"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import { generateAIResponse } from "@/lib/openai";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import PremiumModal from "@/components/premium/PremiumModal";
import SearchParamsClient from "@/components/SearchParamsClient";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { supabase, getProfile, savePromptHistory, signOut } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface Message {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  syntaxHighlight?: boolean;
  toolType?: "V0" | "Cursor" | "Bolt" | "Tempo";
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [selectedTool, setSelectedTool] = useState<"V0" | "Cursor" | "Bolt" | "Tempo">("Tempo");
  const MAX_FREE_PROMPTS = 5;
  const { theme } = useTheme();

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

  // Check for authenticated user and get profile
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        return;
      }

      if (session?.user) {
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
          setPromptCount(profile.prompt_count || 0);

          // Check if prompts should be reset (30 days passed)
          const lastReset = new Date(profile.last_prompt_reset);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          if (lastReset < thirtyDaysAgo) {
            // Reset prompt count
            await supabase
              .from('profiles')
              .update({
                prompt_count: 0,
                last_prompt_reset: new Date().toISOString(),
              })
              .eq('id', session.user.id);
            setPromptCount(0);
          }
        }
      } else {
        setAuthModalOpen(true);
      }
    };

    checkUser();
  }, []);

  // Show welcome message only when user logs in
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          id: "1",
          message: `Welcome ${user.name}! Describe your product idea and I'll generate a customized prompt for ${selectedTool}.`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          toolType: selectedTool,
        },
      ]);
    }
  }, [user, messages.length, selectedTool]);

  const handleSendMessage = async (message: string) => {
    try {
      // Check if user is logged in
      if (!user) {
        setAuthModalOpen(true);
        return;
      }

      // Check if user has reached prompt limit
      if (promptCount >= MAX_FREE_PROMPTS) {
        setPremiumModalOpen(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Add user message to the chat
      const userMessage: Message = {
        id: Date.now().toString(),
        message,
        isUser: true,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Call OpenAI API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const aiResponse = await generateAIResponse(message, selectedTool, controller.signal);
        clearTimeout(timeoutId);

        // Play sound effect
        const audio = new Audio("/notification.mp3");
        audio.play();

        // Add shake animation to chat interface
        const chatInterface = document.querySelector(".chat-interface");
        if (chatInterface) {
          chatInterface.classList.add("animate-shake");
          setTimeout(() => {
            chatInterface.classList.remove("animate-shake");
          }, 500);
        }

        // Save to prompt history
        const { error: historyError } = await savePromptHistory(
          user.id,
          message,
          aiResponse,
          selectedTool
        );

        if (historyError) {
          console.error("Error saving prompt history:", historyError);
        }

        // Update prompt count
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ prompt_count: promptCount + 1 })
          .eq('id', user.id);

        if (updateError) {
          console.error("Error updating prompt count:", updateError);
        } else {
          setPromptCount(prev => prev + 1);
        }

        // Add AI response to the chat
        setTimeout(() => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            message: aiResponse,
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
            syntaxHighlight: true,
            toolType: selectedTool,
          };

          setMessages((prev) => [...prev, aiMessage]);
        }, 1000);

      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        message:
          error.name === "AbortError"
            ? "Request timed out. Please try again with a simpler query."
            : "Sorry, there was an error processing your request. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        toolType: selectedTool,
      };

      setMessages((prev) => [...prev, errorMessage]);
      setError(error.message || "An unknown error occurred");
      console.error("Error generating AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setUser(null);
    setMessages([]);
    setPromptCount(0);
    router.push("/");
  };

  const currentYear = new Date().getFullYear();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsClient setSelectedTool={setSelectedTool} />
      <main className="flex min-h-screen flex-col items-center justify-start bg-white dark:bg-black dark:text-white text-black">
        <div className="w-full bg-white/80 dark:bg-black z-50">
          <div className="w-full max-w-7xl mx-auto px-4">
            <div className="w-full flex justify-between items-center py-6">
            <Link href="/" className="flex items-center gap-2 w-25 h-auto">
            <Image
                src={
                  theme === "dark"
                    ? "/images/metamind-dark.png"
                    : "/images/metamind-light.png"
                }
                alt="MetaMind Logo"
                width={200}
                height={200}
                className="object-contain"
              />
            </Link>
              <div className="flex items-center gap-4">
              <ThemeSwitcher />

                {user && (
                  <span className="text-sm font-medium px-4 py-2 bg-white/80 dark:bg-transparent backdrop-blur-sm border border-[#eaeaea] rounded-lg">
                    {promptCount} of {MAX_FREE_PROMPTS} Free Prompts
                  </span>
                )}

                {user && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPremiumModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Upgrade
                    </button>
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 bg-white border border-[#eaeaea] dark:bg-transparent dark:border-white rounded-lg hover:border-black transition-all"
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
                            <p className="text-sm font-medium dark:text-black">{user.name}</p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
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

        <div className="flex-1 w-full max-w-5xl flex flex-col justify-center items-center min-h-0 px-4">
          <div className="text-center space-y-2 mb-4 pt-12">
            <h1 className="text-3xl font-bold tracking-tight text-black">
              MetaMind Prompt Generator
            </h1>
          </div>
          <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
          <FlickeringGrid
              className="relative z-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)] dark:[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
              squareSize={5}
              gridGap={6}
              colors={
                theme === "dark"
                  ? ["#ffffff", "#f5f5f5", "#e5e5e5"]
                  : ["#A07CFE", "#FE8FB5", "#FFBE7B"]
              }
              maxOpacity={theme === "dark" ? 0.3 : 0.6}
              flickerChance={0.1}
            />
          </div>
          <div className="flex w-full py-4 relative border border-[#eaeaea] dark:border-none dark:bg-black rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm dark:backdrop-blur-none before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent">
            
            <ChatInterface
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              initialMessages={messages}
              initialTool={selectedTool}
              showToolSelector={false}
            />
          </div>
        </div>
        <footer className="text-center text-xs text-gray-500 py-6">
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

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => (user ? setAuthModalOpen(false) : null)}
          onLogin={handleLogin}
        />

        <PremiumModal
          isOpen={premiumModalOpen}
          onClose={() => setPremiumModalOpen(false)}
        />
      </main>
    </Suspense>
  );
}
