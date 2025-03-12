"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface MainPageRecoveryHandlerProps {
  setActiveTab: (tab: "login" | "register" | "forgot-password" | "update-password") => void;
  setAuthModalOpen: (open: boolean) => void;
}

export default function MainPageRecoveryHandler({ 
  setActiveTab, 
  setAuthModalOpen 
}: MainPageRecoveryHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run this effect once on mount
    const type = searchParams?.get('type');
    if (type === 'recovery') {
      // Delay setting the active tab slightly to ensure modal is ready
      setTimeout(() => {
        setActiveTab('update-password');
        setAuthModalOpen(true);
      }, 100);

      // Clean up URL
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []); // Empty dependency array to run only once

  return null;
} 