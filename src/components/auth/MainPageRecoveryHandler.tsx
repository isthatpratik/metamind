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
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setActiveTab('update-password');
      setAuthModalOpen(true);
      // Remove the recovery parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('type');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, setActiveTab, setAuthModalOpen]);

  return null;
} 