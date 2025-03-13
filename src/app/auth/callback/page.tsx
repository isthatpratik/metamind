"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/';
      const type = searchParams.get('type');

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error.message);
            router.push('/');
            return;
          }
        }

        // For password recovery flow
        if (type === 'recovery') {
          router.push('/?type=recovery');
          return;
        }

        // For other flows (email verification, etc)
        router.push(next);
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Completing authentication...</p>
      </div>
    </div>
  );
} 