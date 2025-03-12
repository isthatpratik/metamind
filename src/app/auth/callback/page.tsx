'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/';

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error.message);
          }
        } catch (error) {
          console.error('Error in auth callback:', error);
        }
      }

      // Redirect to the home page or the specified next URL
      router.push(next);
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Verifying your email...</p>
      </div>
    </div>
  );
} 