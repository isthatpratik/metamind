import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()

    // Update user's profile with premium features
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        total_prompts_limit: 150, // Premium users get 150 prompts
        has_prompt_history_access: true,
        is_premium: true,
        prompt_count: 0, // Reset prompt count for premium users
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Record the payment
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert([
        {
          user_id: userId,
          amount: 3.99,
          status: 'completed',
        },
      ])

    if (paymentError) throw paymentError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 