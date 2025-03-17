declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/stripe@12.0.0?target=deno" {
  export default class Stripe {
    constructor(secretKey: string, options?: any);
    paymentIntents: {
      create(options: any): Promise<any>;
    };
    static createFetchHttpClient(): any;
  }
}

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
} 