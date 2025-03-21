"use client";

import "./globals.css";
import { Fustat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/UserContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import PremiumModal from "@/components/premium/PremiumModal";
import { Toaster } from "@/components/ui/toaster";

const fustat = Fustat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fustat",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password" | "update-password">("login");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const handleLogin = (userData: any) => {
    setAuthModalOpen(false);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>MetaMind - AI Prompt Generator</title>
        <meta name="description" content="Generate powerful AI prompts with intelligent assistance" />
      </head>
      <body className={`flex flex-col min-h-screen ${fustat.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <Navbar 
              onOpenAuth={(tab) => {
                setActiveTab(tab);
                setAuthModalOpen(true);
              }}
              onOpenPremium={() => setPremiumModalOpen(true)}
            />
            <main className="flex-1 flex flex-col">
              {children}
              
            </main>
            
            <Footer />

            <AuthModal
              isOpen={authModalOpen}
              onClose={() => {
                if (
                  activeTab === "update-password" &&
                  typeof window !== "undefined" &&
                  window.location.search.includes("type=recovery")
                ) {
                  return;
                }
                setAuthModalOpen(false);
              }}
              onLogin={handleLogin}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            <PremiumModal
              isOpen={premiumModalOpen}
              onClose={() => setPremiumModalOpen(false)}
            />
          </UserProvider>

          
        </ThemeProvider>
      </body>
    </html>
  );
}
