/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare global {
  interface Window {
    Deno: {
      env: {
        get(key: string): string | undefined;
      };
    };
  }
}

const Deno = window.Deno;

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User ID is required' 
        }),
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    console.log('Processing payment success for user:', userId)

    // First get the current profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('total_prompts_limit, is_premium')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to fetch profile: ${profileError.message}` 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      )
    }

    console.log('Current profile:', profile)

    // Calculate new prompt limit
    const currentLimit = profile?.total_prompts_limit || 0
    const newLimit = currentLimit + 150

    console.log('Updating profile with new limit:', newLimit)

    // Update user's profile with premium features
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        total_prompts_limit: newLimit,
        has_prompt_history_access: true,
        is_premium: true,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to update profile: ${updateError.message}` 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      )
    }

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

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to record payment: ${paymentError.message}` 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      )
    }

    console.log('Payment success handled successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment processed successfully',
        data: {
          newLimit,
          is_premium: true,
          has_prompt_history_access: true
        }
      }),
      { 
        headers: corsHeaders,
        status: 200
      }
    )
  } catch (error) {
    console.error('Payment success handler error:', error)
    const errorWithMessage = toErrorWithMessage(error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorWithMessage.message 
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    )
  }
}) 