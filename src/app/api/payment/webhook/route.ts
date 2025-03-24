import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No signature found in webhook request');
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      console.log('Webhook event constructed successfully:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;

      console.log('Processing payment success for user:', userId);

      if (!userId) {
        console.error('No user ID found in payment intent metadata');
        throw new Error('No user ID found in payment intent metadata');
      }

      // Check if this payment intent has already been processed
      const { data: existingPayment, error: paymentCheckError } = await supabase
        .from('payments')
        .select('id')
        .eq('payment_intent_id', paymentIntent.id)
        .single();

      if (paymentCheckError && paymentCheckError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking existing payment:', paymentCheckError);
        throw new Error(`Failed to check existing payment: ${paymentCheckError.message}`);
      }

      if (existingPayment) {
        console.log('Payment intent already processed:', paymentIntent.id);
        return NextResponse.json({ received: true });
      }

      // Record the payment first to prevent duplicate processing
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: paymentIntent.amount / 100, // Convert from cents to dollars
          status: 'succeeded', // Only set succeeded when confirmed by Stripe webhook
          payment_intent_id: paymentIntent.id,
        });

      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        throw new Error(`Failed to record payment: ${paymentError.message}`);
      }

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_prompts_limit, is_premium')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      // Calculate new prompt limit
      // If user is not premium, start from base limit of 5
      const baseLimit = profile?.is_premium ? (profile?.total_prompts_limit || 0) : 5;
      const newLimit = baseLimit + 150;

      console.log('Updating prompt limit:', {
        currentLimit: profile?.total_prompts_limit,
        isPremium: profile?.is_premium,
        baseLimit,
        newLimit
      });

      // Update user's profile with premium features
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_prompts_limit: newLimit,
          has_prompt_history_access: true,
          is_premium: true,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log('Payment processed and profile updated successfully');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 