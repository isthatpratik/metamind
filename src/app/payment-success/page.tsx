'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Auth error:', userError);
          toast.error('Authentication required');
          router.push('/');
          return;
        }

        // Check if the user's profile has been updated
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_premium, total_prompts_limit, prompt_count')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error('Failed to fetch user profile');
        }

        // If the profile hasn't been updated yet, wait a bit and check again
        if (!profile?.is_premium) {
          console.log('Profile not updated yet, waiting...');
          setTimeout(() => {
            router.refresh();
          }, 5000);
          return;
        }

        toast.success('Payment successful! Your account has been upgraded.');
        router.push('/');
      } catch (error) {
        console.error('Error handling payment success:', error);
        toast.error('Error processing payment. Please contact support if the issue persists.');
        router.push('/');
      }
    };

    handleSuccess();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Processing your payment...</p>
      </div>
    </div>
  );
} 