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
import { supabase, getProfile, savePromptHistory, signOut, getPromptHistory } from "@/lib/supabase";
import { toast } from "sonner";

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
  const [prompts, setPrompts] = useState<Message[]>([]);
  const [copiedPrompts, setCopiedPrompts] = useState<Record<string, boolean>>({});

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
        await fetchUserData(session.user.id);
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

  // Function to fetch user data and prompt history
  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await getProfile(userId);
      
      if (profileError) {
        console.error("Error getting profile:", profileError);
        return;
      }

      if (profile) {
        setUser({
          id: userId,
          email: profile.email || "",
          name: profile.name || profile.email?.split("@")[0] || "",
        });
        
        // Get prompt count from profile
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
            .eq('id', userId);
          setPromptCount(0);
        }

        // Get prompt history
        const { data: promptHistory, error: historyError } = await getPromptHistory(userId);
        
        if (historyError) {
          console.error("Error getting prompt history:", historyError);
          toast.error("Error loading prompt history", {
            description: "Please try again later"
          });
        } else {
          setPrompts(promptHistory || []);
          // Update prompt count based on history if needed
          if (promptHistory && (!profile.prompt_count || profile.prompt_count < promptHistory.length)) {
            setPromptCount(promptHistory.length);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

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
        description: error.message
      });
      return;
    }
    router.push("/");
  };

  const copyToClipboard = async (text: string, promptId: string) => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for Safari and older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
          throw new Error('Copy failed');
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // Update state and show success toast
      setCopiedPrompts((prev) => ({ ...prev, [promptId]: true }));
      toast.success("Copied to clipboard", {
        description: "The prompt has been copied to your clipboard",
        duration: 2000
      });

      // Reset the copy state after 2 seconds
      setTimeout(() => {
        setCopiedPrompts((prev) => ({ ...prev, [promptId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error("Failed to copy", {
        description: "Please try selecting and copying the text manually",
        duration: 3000
      });
    }
  };

  const currentYear = new Date().getFullYear();

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
        setMessages([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsClient setSelectedTool={setSelectedTool} />
      <main className="flex min-h-screen flex-col items-center justify-start bg-white text-black">
        <div className="w-full border-b bg-white/80 border-[#eaeaea] z-50">
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
                        className="p-2 bg-white border border-[#eaeaea] rounded-lg hover:border-black transition-all"
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
              className="relative z-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
              squareSize={4}
              gridGap={6}
              colors={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
              maxOpacity={0.5}
              flickerChance={0.1}
            />
          </div>
          <div className="flex w-full py-4 relative border border-[#eaeaea] rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent">
            
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
