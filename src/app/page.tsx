"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import PremiumModal from "@/components/premium/PremiumModal";
import Image from "next/image";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { MagicCard } from "@/components/magicui/magic-card";
import { supabase, getProfile, signOut, getPromptHistory } from "@/lib/supabase";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
}

type TabType = "login" | "register" | "forgot-password" | "update-password";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [selectedTool, setSelectedTool] = useState<"V0" | "Cursor" | "Bolt" | "Tempo" | null>(null);
  const MAX_FREE_PROMPTS = 5;
  const searchParams = useSearchParams();

  // Check for recovery parameter in URL
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
  }, [searchParams]);

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

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile and prompt history
        const { data: profile, error: profileError } = await getProfile(session.user.id);
        
        if (profileError) {
          console.error("Error getting profile:", profileError);
          return;
        }

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: profile.name || session.user.email?.split("@")[0] || "",
          });

          // Get prompt history to ensure accurate count
          const { data: promptHistory, error: historyError } = await getPromptHistory(session.user.id);
          
          if (historyError) {
            console.error("Error getting prompt history:", historyError);
          } else {
            // Set prompt count based on the most accurate source
            const actualCount = Math.max(
              profile.prompt_count || 0,
              promptHistory?.length || 0
            );
            setPromptCount(actualCount);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPromptCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (userData: { email: string; name: string; id: string; promptCount: number }) => {
    setUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
    });
    
    // Get fresh prompt count after login
    const { data: profile } = await getProfile(userData.id);
    const { data: promptHistory } = await getPromptHistory(userData.id);
    
    // Use the most accurate count available
    const actualCount = Math.max(
      profile?.prompt_count || 0,
      promptHistory?.length || 0,
      userData.promptCount
    );
    
    setPromptCount(actualCount);
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error logging out", {
        description: error.message,
        descriptionClassName: "text-gray-500"
      });
      return;
    }
    setUser(null);
    setPromptCount(0);
  };

  const handleToolSelect = async (tool: "V0" | "Cursor" | "Bolt" | "Tempo") => {
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

  const currentYear = new Date().getFullYear();

  const tools = [
    {
      id: "V0",
      name: "V0",
      description: "AI-powered design tool for creating beautiful interfaces",
    },
    {
      id: "Cursor",
      name: "Cursor AI",
      description: "AI-powered code editor for faster development",
    },
    {
      id: "Bolt",
      name: "Bolt",
      description: "AI-powered development platform for building apps",
    },
    {
      id: "Tempo",
      name: "Tempo Labs",
      description: "AI-powered platform for building web applications",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-white text-black">
      <div className="w-full border-b border-[#eaeaea]">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="w-full flex justify-between items-center py-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="MetaMind Logo"
                width={40}
                height={40}
              />
            </Link>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm font-medium px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#eaeaea] rounded-lg">
                {promptCount} of {MAX_FREE_PROMPTS} Free Prompts
              </span>
              )}

              {!user ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="px-4 py-2 bg-white border border-[#eaeaea] text-sm font-medium rounded-lg"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("register");
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPremiumModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg"
                  >
                    Upgrade
                  </button>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="p-2 bg-white border border-[#eaeaea] rounded-lg"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                      </svg>
                    </button>
                    {menuOpen && user && (
                      <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg py-1 z-10 border border-[#eaeaea] rounded-lg">
                        <div className="px-4 py-2 border-b border-[#eaeaea]">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link
                          href="/prompt-history"
                          className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#f5f5f5] border-b border-[#eaeaea]"
                        >
                          Prompt History
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#f5f5f5]"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 flex flex-col">
        <div className="relative flex flex-col items-center justify-center gap-8 py-12 w-full flex-1">
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
            <FlickeringGrid
              className="relative z-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
              squareSize={5}
              gridGap={6}
              colors={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
              maxOpacity={0.6}
              flickerChance={0.1}
            />
          </div>
          <div className="text-center space-y-2 mb-8 relative z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5)_70%,rgba(255,255,255,0)_71%)] rounded-full px-8 py-6">
            <h2 className="text-4xl font-bold tracking-tight text-black md:text-4xl">
              {user ? `Welcome, ${user.name}` : "Welcome to MetaMind"}
            </h2>
            <h1 className="text-gray-600 font-normal text-xl max-w-xl">
              Craft powerful AI prompts with intelligent assistance
            </h1>
          </div>

          <div className="w-full max-w-4xl mx-auto flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl">
              {tools.map((tool) => (
                <MagicCard
                  key={tool.id}
                  className="rounded-lg"
                  
                  gradientOpacity={0.12}
                  onClick={() =>
                    handleToolSelect(
                      tool.id as "V0" | "Cursor" | "Bolt" | "Tempo"
                    )
                  }
                >
                  <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white flex items-center justify-center mb-3 overflow-hidden rounded-lg border border-[#eaeaea]">
                      <Image
                        src={`/images/${tool.id.toLowerCase()}.${tool.id === "V0" || tool.id === "Bolt" ? "png" : "jpg"}`}
                        alt={`${tool.name} logo`}
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-black text-sm line-clamp-3 text-balance">
                      {tool.description}
                    </p>
                  </div>
                </MagicCard>
              ))}
            </div>
          </div>
        </div>

        <footer className="text-center bg-transparent text-xs text-gray-500 py-6 relative">
          <p>
            © {currentYear} MetaMind - Product prompt generator by{" "}
            <Link
              href="https://ampvc.co"
              target="_blank"
              className="text-gray-700 hover:text-black transition-colors"
            >
              Ampersand
            </Link>
          </p>
        </footer>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          // Prevent closing modal during password update
          if (activeTab === 'update-password' && searchParams.get('type') === 'recovery') {
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
    </main>
  );
}
