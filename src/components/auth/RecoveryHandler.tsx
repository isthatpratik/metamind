import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface RecoveryHandlerProps {
  setActiveTab: (tab: "login" | "register" | "forgot-password" | "update-password") => void;
}

export default function RecoveryHandler({ setActiveTab }: RecoveryHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're returning from a password reset
    if (searchParams.get("type") === "recovery") {
      setActiveTab("update-password");
    }
  }, [searchParams, setActiveTab]);

  return null;
} 