"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase, getProfile, getPromptHistory, signOut } from "@/lib/supabase";
import { toast } from "sonner";
import PremiumModal from "@/components/premium/PremiumModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";

interface PromptHistory {
  id: string;
  message: string;
  ai_response: string;
  tool_type: "V0" | "Cursor" | "Bolt" | "Tempo";
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

const TOOL_LOGOS = {
  "V0": "/images/v0.png",
  "Cursor": "/images/cursor.jpg",
  "Bolt": "/images/bolt.png",
  "Tempo": "/images/tempo.jpg"
} as const;

const getPromptSummary = (message: string): string => {
  // Remove common prefixes that might appear in prompts
  const cleanMessage = message.replace(/^(please|can you|could you|help me|i want to|i need to|how to)/i, '').trim();
  
  // Split into words and get first 6 words
  const words = cleanMessage.split(/\s+/);
  const summary = words.slice(0, 6).join(' ');
  
  // Add ellipsis if the message is longer
  return words.length > 6 ? `${summary}...` : summary;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function PromptHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prompts, setPrompts] = useState<PromptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState<{ [key: string]: boolean }>({});
  const MAX_FREE_PROMPTS = 5;

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

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPrompts([]);
        setPromptCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initial check for existing session
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
      router.push("/");
        return;
      }

      if (!session?.user) {
        router.push("/");
        return;
      }

      await fetchUserData(session.user.id);
      setIsLoading(false);
    };

    checkUser();
  }, [router, toast]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

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
                          href="/"
                          className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#f5f5f5] border-b border-[#eaeaea]"
                        >
                          Generate Prompts
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

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Prompt History</h1>
        
        {prompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No prompts yet. Start generating some prompts!</p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90"
            >
              Generate Prompts
            </Link>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {prompts.map((prompt) => (
              <AccordionItem
                key={prompt.id}
                value={prompt.id}
                className="border border-[#eaeaea] rounded-lg px-6"
              >
                <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image
                          src={TOOL_LOGOS[prompt.tool_type]}
                          alt={`${prompt.tool_type} logo`}
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {getPromptSummary(prompt.message)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 ml-4">
                      {formatDate(prompt.created_at)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 py-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Your Request</h3>
                        <div
                          onClick={() => copyToClipboard(prompt.message, prompt.id)}
                          className="p-2 hover:bg-[#f5f5f5] rounded-md transition-colors cursor-pointer"
                          title="Copy prompt"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              copyToClipboard(prompt.message, prompt.id);
                            }
                          }}
                        >
                          {copiedPrompts[prompt.id] ? (
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600">{prompt.message}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">AI Response</h3>
                      <div className="bg-[#f5f5f5] p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {prompt.ai_response}
                        </pre>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />
    </main>
  );
}
