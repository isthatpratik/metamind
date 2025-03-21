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
import {
  supabase,
  getProfile,
  savePromptHistory,
  signOut,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useUser } from "@/contexts/UserContext";

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
  is_premium?: boolean;
  total_prompts_limit?: number;
}

export default function ChatPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<
    "V0" | "Cursor" | "Bolt" | "Tempo"
  >("Tempo");
  const MAX_FREE_PROMPTS = 5;
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, promptCount, setPromptCount } = useUser();

  // Set initial theme based on system preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (!savedTheme) {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(systemPrefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", systemPrefersDark);
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
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
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // Check if user has reached their prompt limit
    if (promptCount >= (user.total_prompts_limit || 5)) {
      setPremiumModalOpen(true);
      return;
    }

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      message,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
      toolType: selectedTool,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Generate AI response
      const response = await generateAIResponse(message, selectedTool);

      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        message: response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        syntaxHighlight: true,
        toolType: selectedTool,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save to prompt history
      await savePromptHistory(user.id, message, response, selectedTool);

      // Update prompt count
      const newPromptCount = promptCount + 1;
      setPromptCount(newPromptCount);

      // Update profile with new prompt count
      await supabase
        .from("profiles")
        .update({ prompt_count: newPromptCount })
        .eq("id", user.id);

      // If user is premium and has used all prompts, revert to free tier
      if (
        user.is_premium &&
        newPromptCount >= (user.total_prompts_limit || 150)
      ) {
        await supabase
          .from("profiles")
          .update({
            is_premium: false,
            total_prompts_limit: 5,
            has_prompt_history_access: false,
          })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error logging out",
        description:
          error instanceof Error ? error.message : "Failed to log out",
        variant: "destructive",
      });
      return;
    }
    setMessages([]);
    router.push("/");
  };

  const currentYear = new Date().getFullYear();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsClient setSelectedTool={setSelectedTool} />
      <main className="flex flex-1 flex-col items-center bg-white dark:bg-black text-black dark:text-white">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col flex-1">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-8 w-full relative">
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
              <FlickeringGrid
                className="relative z-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)] dark:[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
                squareSize={5}
                gridGap={6}
                colors={
                  theme === "dark"
                    ? ["#ffffff", "#f5f5f5", "#e5e5e5"]
                    : ["#A07CFE", "#FE8FB5", "#FFBE7B"]
                }
                maxOpacity={0.6}
                flickerChance={0.1}
              />
            </div>
            <div className="text-center space-y-2 mb-8 relative z-10">
              <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
                MetaMind Prompt Generator
              </h1>
            </div>
            <div className="flex w-full max-w-4xl py-4 self-center relative border border-[#eaeaea] dark:border-none dark:bg-black rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm dark:backdrop-blur-none before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent">
              <ChatInterface
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                initialMessages={messages}
                initialTool={selectedTool}
                showToolSelector={false}
              />
            </div>
          </div>
        </div>
      </main>
    </Suspense>
  );
}
