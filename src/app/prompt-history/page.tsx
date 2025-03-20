"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  supabase,
  getProfile,
  getPromptHistory,
  signOut,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import PremiumModal from "@/components/premium/PremiumModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";

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
  is_premium?: boolean;
  total_prompts_limit?: number;
}

const TOOL_LOGOS = {
  V0: "/images/v0.png",
  Cursor: "/images/cursor.jpg",
  Bolt: "/images/bolt.png",
  Tempo: "/images/tempo.jpg",
} as const;

const getPromptSummary = (message: string): string => {
  // Remove common prefixes that might appear in prompts
  const cleanMessage = message
    .replace(
      /^(please|can you|could you|help me|i want to|i need to|how to)/i,
      ""
    )
    .trim();

  // Split into words and get first 6 words
  const words = cleanMessage.split(/\s+/);
  const summary = words.slice(0, 6).join(" ");

  // Add ellipsis if the message is longer
  return words.length > 6 ? `${summary}...` : summary;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function PromptHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [prompts, setPrompts] = useState<PromptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState<{
    [key: string]: boolean;
  }>({});
  const MAX_FREE_PROMPTS = 5;
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Set initial theme to dark only if no theme is set
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

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

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        router.push("/");
        return;
      }

      if (!session?.user) {
        router.push("/");
        return;
      }

      const { data: profile, error: profileError } = await getProfile(
        session.user.id
      );

      if (profileError) {
        console.error("Error getting profile:", profileError);
        return;
      }

      if (profile) {
        // Check if user has access to prompt history
        if (!profile.has_prompt_history_access) {
          toast({
            title: "Premium feature",
            description: "Please upgrade to access prompt history",
            variant: "destructive",
          });
          router.push("/");
          return;
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: profile.name || session.user.email?.split("@")[0] || "",
          is_premium: profile.is_premium || false,
          total_prompts_limit: profile.total_prompts_limit || 5,
        });
        setPromptCount(profile.prompt_count || 0);

        // Get prompt history
        const { data: promptHistory, error: historyError } =
          await getPromptHistory(session.user.id);

        if (historyError) {
          console.error("Error getting prompt history:", historyError);
          toast({
            title: "Error loading prompt history",
            description: "Please try again later",
            variant: "destructive",
          });
        } else {
          setPrompts(promptHistory || []);
        }
      }

      setIsLoading(false);
    };

    checkUser();
  }, [router, toast]);

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
    router.push("/");
  };

  const copyToClipboard = async (text: string, promptId: string) => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for Safari and older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed:", err);
          throw new Error("Copy failed");
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // Update state and show success toast
      setCopiedPrompts((prev) => ({ ...prev, [promptId]: true }));
      toast({
        title: "Copied to clipboard",
        description: "The prompt has been copied to your clipboard",
        duration: 2000,
      });

      // Reset the copy state after 2 seconds
      setTimeout(() => {
        setCopiedPrompts((prev) => ({ ...prev, [promptId]: false }));
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      toast({
        title: "Failed to copy",
        description: "Please try selecting and copying the text manually",
        variant: "destructive",
        duration: 3000,
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
    <main className="flex min-h-screen flex-col items-center bg-white dark:bg-black dark:text-white text-black">
      <div className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="w-full flex justify-between items-center py-6">
            <Link href="/" className="flex items-center gap-2 w-25 h-auto">
              <Image
                src={resolvedTheme === "light" ? "/images/metamind-light.png" : "/images/metamind-dark.png"}
                alt="MetaMind Logo"
                width={200}
                height={200}
                className="object-contain lg:w-[180px] w-[120px]"
              />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />

              {user && (
                <span className="hidden sm:inline-block text-sm font-medium px-4 py-2 bg-white/80 dark:bg-transparent backdrop-blur-sm border border-[#eaeaea] rounded-lg">
                  {user.is_premium 
                    ? `${promptCount}/${user.total_prompts_limit} Premium Prompts`
                    : `${promptCount}/${user.total_prompts_limit} Free Prompts`
                  }
                </span>
              )}

              {user && (
                <div className="flex items-center gap-2">
                  <button
                      onClick={() => setPremiumModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-tr from-[#A07CFE] from-30% via-[#FE8FB5] via-60% to-[#FFBE7B] to-90% text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {user.is_premium ? "Buy Prompts" : "Upgrade"}
                    </button>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="p-2 bg-white border border-[#eaeaea] dark:bg-transparent dark:border-white rounded-lg"
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
                      <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg py-1 z-50 border border-[#eaeaea] rounded-lg">
                        <div className="px-4 py-2 border-b border-[#eaeaea]">
                          <p className="text-sm font-medium dark:text-black">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
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
            <p className="text-gray-500">
              No prompts yet. Start generating some prompts!
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-black text-white dark:text-black dark:bg-whiterounded-lg hover:bg-black/90"
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
                className="border border-[#eaeaea] dark:border-white/70 rounded-lg px-6"
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
                          onClick={() =>
                            copyToClipboard(prompt.message, prompt.id)
                          }
                          className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                          title="Copy prompt"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
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
                      <p className="text-gray-600 dark:text-zinc-400">{prompt.message}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Metamind Response</h3>
                      <div className="bg-[#f5f5f5] dark:bg-white/10 dark:border dark:border-white/30 p-4 rounded-lg">
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
      <Toaster />
    </main>
  );
}
