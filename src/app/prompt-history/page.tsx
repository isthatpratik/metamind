"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Toaster } from "@/components/ui/toaster";
import { CopyIcon, CheckIcon } from "lucide-react";
import PremiumModal from "@/components/premium/PremiumModal";
import { supabase, getProfile, getPromptHistory } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";

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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getPromptSummary = (message: string): string => {
  const maxLength = 50;
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + "...";
};

export default function PromptHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: userLoading, refreshUserData } = useUser();
  const [prompts, setPrompts] = useState<PromptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState<{
    [key: string]: boolean;
  }>({});

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
    const checkUserAndLoadHistory = async () => {
      try {
        // First check session directly with supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to access prompt history",
            variant: "destructive",
          });
          router.push("/");
          return;
        }

        // If we have a session but no user context or it's still loading, refresh user data
        if (!user && !userLoading) {
          await refreshUserData();
          return;
        }

        // Don't proceed if still loading user context
        if (userLoading) {
          return;
        }

        // At this point we should have both session and user context
        if (!user?.is_premium) {
          setPremiumModalOpen(true);
          toast({
            title: "Premium feature",
            description: "Please upgrade to access prompt history",
            variant: "destructive",
          });
          router.push("/");
          return;
        }

        // Load prompt history
        const { data: promptHistory, error: historyError } = await getPromptHistory(session.user.id);

        if (historyError) {
          console.error("Error getting prompt history:", historyError);
          toast({
            title: "Error loading prompt history",
            description: "Please try again later",
            variant: "destructive",
          });
          return;
        }

        setPrompts(promptHistory || []);
        setPromptCount(user.total_prompts_limit || 5);
      } catch (error) {
        console.error("Error in prompt history:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndLoadHistory();
  }, [user, userLoading, router, toast, refreshUserData]);

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

  // Show loading state while either the user context or data is loading
  if (userLoading || isLoading) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="text-black dark:text-white">Loading...</div>}>
      <main className="flex flex-col items-center justify-start bg-white dark:bg-black dark:text-white text-black flex-1">
        <div className="w-full max-w-7xl flex flex-col px-4 min-h-[calc(100vh-10rem)]">
          <div className="text-center space-y-2 pt-8">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
              Prompt History
            </h1>
          </div>
          <div className="flex w-full py-4 relative dark:bg-black rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm dark:backdrop-blur-none before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent">
            <div className="w-full max-w-7xl mx-auto py-4">
              {prompts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No prompts yet. Start generating some prompts!
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-block px-4 py-2 bg-black text-white dark:text-black dark:bg-white rounded-lg hover:bg-black/90"
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
                      className="border border-[#eaeaea] dark:border-white/50 rounded-md px-6"
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
          </div>
        </div>
      </main>
      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />
      <Toaster />
    </Suspense>
  );
}
