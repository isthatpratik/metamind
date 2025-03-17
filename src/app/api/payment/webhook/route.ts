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

      // Get current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium, total_prompts_limit, prompt_count')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      // Update user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          total_prompts_limit: (profile?.total_prompts_limit || 0) + 150,
          prompt_count: profile?.prompt_count || 0,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        throw new Error(`Failed to update user profile: ${updateError.message}`);
      }

      console.log('User profile updated successfully');

      // Record the payment in payments table
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: paymentIntent.amount / 100, // Convert from cents to dollars
          status: 'succeeded',
          payment_intent_id: paymentIntent.id,
        });

      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        throw new Error(`Failed to record payment: ${paymentError.message}`);
      }

      console.log('Payment recorded successfully');
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