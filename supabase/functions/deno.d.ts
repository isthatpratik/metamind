declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from '@supabase/supabase-js';
}

declare module "https://esm.sh/stripe@12.0.0?target=deno" {
  import Stripe from 'stripe';
  const StripeConstructor: typeof Stripe & {
    createFetchHttpClient(): Stripe.HttpClient;
  };
  export default StripeConstructor;
} 