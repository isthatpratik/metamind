'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, handlePaymentSuccess } from '@/lib/supabase';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const { user, error } = await getCurrentUser();
        if (error || !user) {
          toast.error('Authentication required');
          router.push('/');
          return;
        }

        const { error: paymentError } = await handlePaymentSuccess(user.id);
        if (paymentError) throw paymentError;

        toast.success('Payment successful! Your account has been upgraded.');
        router.push('/');
      } catch (error) {
        console.error('Error handling payment success:', error);
        toast.error('Error processing payment');
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