"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, createPaymentIntent, handlePaymentSuccess } from "@/lib/supabase";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentForm = ({ onBack }: { onBack: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!stripe || !elements) {
        throw new Error('Stripe has not been initialized');
      }

      console.log('Confirming payment...');
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (stripeError) {
        console.error('Stripe payment error:', stripeError);
        throw new Error(stripeError.message);
      }
    } catch (error: unknown) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Complete Your Purchase</h3>
      </div>
      <PaymentElement />
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <Button
        onClick={handlePayment}
        disabled={isLoading || !stripe || !elements}
        className="w-full"
      >
        {isLoading ? "Processing..." : "Pay $3.99"}
      </Button>
    </div>
  );
};

const FeaturesView = ({ onUpgrade, onClose }: { onUpgrade: () => void; onClose: () => void }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <span className="text-black font-bold">MetaMind Premium</span>
        </DialogTitle>
        <DialogDescription className="text-center">
          Get 150 additional prompts and access to prompt history
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span>150 Additional Prompts</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span>Access to Prompt History</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span>One-time payment of $3.99</span>
          </div>
        </div>
      </div>

      <DialogFooter className="lg:justify-center">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto bg-white rounded-lg text-black hover:bg-[#f5f5f5] hover:text-black border border-[#eaeaea]"
        >
          Maybe Later
        </Button>
        <Button
          onClick={onUpgrade}
          className="w-full sm:w-auto bg-black hover:bg-black/90 text-white rounded-lg"
        >
          Upgrade Now
        </Button>
      </DialogFooter>
    </>
  );
};

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [currentPrompts, setCurrentPrompts] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium, prompt_count, total_prompts_limit')
          .eq('id', user.id)
          .single();
        
        setIsPremium(profile?.is_premium || false);
        setCurrentPrompts(profile?.prompt_count || 0);
        setTotalPrompts(profile?.total_prompts_limit || 0);
      }
    };
    checkPremiumStatus();
  }, []);

  const handleUpgrade = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      console.log('Creating payment intent...');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: 3.99,
            currency: 'usd'
          }),
        }
      );

      const responseData = await response.json();
      console.log('Payment intent response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create payment intent');
      }

      if (!responseData.clientSecret) {
        throw new Error('No client secret received');
      }

      console.log('Setting client secret and showing payment form...');
      setClientSecret(responseData.clientSecret);
      setShowPayment(true);
    } catch (error: unknown) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create payment intent',
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setShowPayment(false);
    setClientSecret(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {showPayment && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm onBack={handleBack} />
          </Elements>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <span className="text-black font-bold">MetaMind Premium</span>
              </DialogTitle>
              <DialogDescription className="text-center">
                {isPremium 
                  ? `You currently have ${currentPrompts} of ${totalPrompts} prompts remaining`
                  : "Get 150 additional prompts and access to prompt history"}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>150 Additional Prompts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Access to Prompt History</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>One-time payment of $3.99</span>
                </div>
              </div>
            </div>

            <DialogFooter className="lg:justify-center">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto bg-white rounded-lg text-black hover:bg-[#f5f5f5] hover:text-black border border-[#eaeaea]"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleUpgrade}
                className="w-full sm:w-auto bg-black hover:bg-black/90 text-white rounded-lg"
              >
                {isPremium ? "Buy More Prompts" : "Upgrade Now"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PremiumModal;
