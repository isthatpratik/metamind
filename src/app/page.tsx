"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import PremiumModal from "@/components/premium/PremiumModal";
import MainPageRecoveryHandler from "@/components/auth/MainPageRecoveryHandler";
import Image from "next/image";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import {
  getProfile,
  signOut,
  getPromptHistory,
} from "@/lib/supabase";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

interface User {
  id: string;
  email: string;
  name: string;
  is_premium?: boolean;
  total_prompts_limit?: number;
}

type TabType = "login" | "register" | "forgot-password" | "update-password";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<
    "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable" | null
  >(null);
  const MAX_FREE_PROMPTS = 5;
  const { user, promptCount, isLoading, setPromptCount } = useUser();

  // Handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToolSelect = async (tool: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable") => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (promptCount >= MAX_FREE_PROMPTS) {
      setPremiumModalOpen(true);
      return;
    }

    setSelectedTool(tool);
    router.push(`/chat?tool=${tool}`);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast("Error logging out", {
        description: "Failed to sign out. Please try again.",
      });
      return;
    }
    setPromptCount(0);
    setAuthModalOpen(false);
    router.push("/");
  };

  const handleLogin = async (userData: {
    email: string;
    name: string;
    id: string;
    promptCount: number;
  }) => {
    try {
      // Get fresh profile and prompt history data
      const { data: profile, error: profileError } = await getProfile(userData.id);
      const { data: promptHistory, error: historyError } = await getPromptHistory(userData.id);

      if (profileError || historyError) {
        console.error("Error fetching user data:", profileError || historyError);
        return;
      }

      // Calculate the most accurate prompt count
      const actualCount = Math.max(
        profile?.prompt_count || 0,
        promptHistory?.length || 0,
        userData.promptCount
      );

      setPromptCount(actualCount);
      setAuthModalOpen(false);
    } catch (error) {
      console.error("Error in handleLogin:", error);
      toast.error("Error updating user data", {
        description: "Please try logging in again",
        descriptionClassName: "text-gray-500",
      });
    }
  };

  const tools = [
    {
      id: "V0",
      name: "V0",
      description: "AI-powered development tool for creating beautiful interfaces",
    },
    {
      id: "Cursor",
      name: "Cursor AI",
      description: "AI-powered code editor for faster development",
    },
    {
      id: "Bolt",
      name: "Bolt",
      description: "AI-powered development platform for building full-stack apps",
    },
    {
      id: "Tempo",
      name: "Tempo",
      description: "AI-powered platform for building React Applications faster",
    },
    {
      id: "Lovable",
      name: "Lovable",
      description: "AI-powered development tool for creating lovable user experiences",
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center bg-white dark:bg-black text-black dark:text-white">
      <Suspense fallback={null}>
        <MainPageRecoveryHandler
          setActiveTab={setActiveTab}
          setAuthModalOpen={setAuthModalOpen}
        />
      </Suspense>

      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col flex-1">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-8 w-full relative">
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
            <FlickeringGrid
              className="relative z-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)] dark:[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
              squareSize={5}
              gridGap={6}
              colors={["#ffffff", "#f5f5f5", "#e5e5e5"]}
              maxOpacity={0.3}
              flickerChance={0.1}
            />
          </div>
          <div className="text-center space-y-2 relative z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5)_70%,rgba(255,255,255,0)_71%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.3)_70%,rgba(0,0,0,0)_71%)] rounded-full px-8 py-6">
            <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white md:text-5xl">
              {user ? `Welcome, ${user.name}` : "Welcome to MetaMind"}
            </h2>
            <h1 className="text-gray-600 dark:text-white/70 font-normal text-xl max-w-xl">
              Craft powerful AI prompts with intelligent assistance
            </h1>
          </div>

          <div className="w-full max-w-7xl mx-auto flex justify-center">
            <div className="grid grid-cols-1 xl:grid-cols-5 md:grid-cols-3 gap-4 max-w-7xl w-full">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() =>
                    handleToolSelect(
                      tool.id as "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable"
                    )
                  }
                  className="rounded-lg cursor-pointer transition-all duration-300
                    bg-white dark:bg-white/5 backdrop-blur-md
                    border border-black/10 dark:border-white/50
                    shadow-lg dark:shadow-white/10 hover:shadow-xl
                    relative overflow-hidden"
                >
                  <div className="md:p-8 p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-transparent flex items-center justify-center mb-3 overflow-hidden rounded-lg shadow-2xl">
                      <Image
                        src={`/images/${tool.id.toLowerCase()}.${tool.id === "V0" || tool.id === "Bolt" ? "png" : "jpg"}`}
                        alt={`${tool.name} logo`}
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-black mb-2 dark:text-white">
                      {tool.name}
                    </h3>
                    <p className="text-black text-xs md:text-sm line-clamp-3 text-balance dark:text-white/70">
                      {tool.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
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
      </Suspense>
    </main>
  );
}