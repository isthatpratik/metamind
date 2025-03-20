'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, handlePaymentSuccess } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { refreshUserData } = useUser();
  const [isProcessing, setIsProcessing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Get current user
        const { user, error } = await getCurrentUser();
        if (error || !user) {
          console.error('Authentication error:', error);
          toast.error('Authentication required', {
            description: 'Please sign in to continue'
          });
          router.push('/');
          return;
        }

        // Process payment success with retries
        const processPayment = async () => {
          const { data, error: paymentError } = await handlePaymentSuccess(user.id);
          
          if (paymentError) {
            if (retryCount < MAX_RETRIES) {
              console.log(`Retrying payment success processing (${retryCount + 1}/${MAX_RETRIES})...`);
              setRetryCount(prev => prev + 1);
              setTimeout(processPayment, 2000); // Retry after 2 seconds
              return;
            }
            throw paymentError;
          }

          // Refresh user data to get updated premium status
          await refreshUserData();

          // Show success message with the new limit
          toast.success('Payment successful!', {
            description: `Your account has been upgraded with 150 additional prompts.`
          });
          
          // Redirect to home after a short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        };

        await processPayment();
      } catch (error) {
        console.error('Error handling payment success:', error);
        toast.error('Error processing payment', {
          description: error instanceof Error ? error.message : 'Please contact support if this persists'
        });
        
        // Redirect to home after showing error
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleSuccess();
  }, [router, retryCount, refreshUserData]);

  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-black">
      <div className="text-center space-y-4">
        {isProcessing ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto dark:border-white"></div>
            <p className="text-sm text-gray-500 dark:text-white">
              {retryCount > 0 
                ? `Processing your payment... (Attempt ${retryCount + 1}/${MAX_RETRIES})`
                : 'Processing your payment...'}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-white">Redirecting...</p>
        )}
      </div>
    </div>
  );
} 