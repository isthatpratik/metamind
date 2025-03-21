"use client";

import { useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import AuthModal from "@/components/auth/AuthModal";
import PremiumModal from "@/components/premium/PremiumModal";
import { Toaster } from "@/components/ui/toaster";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password" | "update-password">("login");

  const handleOpenAuth = (tab: "login" | "register") => {
    setActiveTab(tab);
    setAuthModalOpen(true);
  };

  const handleLogin = () => {
    setAuthModalOpen(false);
  };

  return (
    <>
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenPremium={() => setPremiumModalOpen(true)}
      />
      <div className="flex-1">
        {children}
        <Footer />
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogin={handleLogin}
      />
      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />
      <Toaster />
    </>
  );
} 