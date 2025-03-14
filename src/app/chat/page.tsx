"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import Header from "@/components/Header";
import { generateAIResponse } from "@/lib/openai";
import Link from "next/link";
import { useRouter as useNavigationRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import PremiumModal from "@/components/premium/PremiumModal";
import Confetti from "@/components/Confetti";

interface Message {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  syntaxHighlight?: boolean;
  toolType?: "V0" | "Cursor" | "Bolt" | "Tempo";
}

interface User {
  email: string;
  name: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");

  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [selectedTool, setSelectedTool] = useState<
    "V0" | "Cursor" | "Bolt" | "Tempo"
  >("Tempo");
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

  // Set the selected tool from URL parameter
  useEffect(() => {
    if (toolParam && ["V0", "Cursor", "Bolt", "Tempo"].includes(toolParam)) {
      setSelectedTool(toolParam as "V0" | "Cursor" | "Bolt" | "Tempo");
    }
  }, [toolParam]);

  // Check for user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("metamind_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setAuthModalOpen(true);
    }

    const storedPromptCount = localStorage.getItem("metamind_prompt_count");
    if (storedPromptCount) {
      setPromptCount(parseInt(storedPromptCount, 10));
    }
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

  // Redirect to tool selection if no tool is selected
  useEffect(() => {
    if (!toolParam) {
      router.push("/");
    }
  }, [toolParam, router]);

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

      // Show loading indicator immediately after user input
      setIsLoading(true);

      // Call OpenAI API with a timeout for better performance
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const aiResponse = await generateAIResponse(
          message,
          selectedTool,
          controller.signal,
        );
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

        // Add AI response to the chat after a short delay
        setTimeout(() => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            message: aiResponse,
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
            syntaxHighlight: aiResponse.includes("```") || true, // Always use syntax highlighting for prompts
            toolType: selectedTool,
          };

          setMessages((prev) => [...prev, aiMessage]);

          // Save prompt to history
          const promptToSave = {
            id: (Date.now() + 1).toString(),
            message: aiResponse,
            timestamp: new Date().toLocaleTimeString(),
            toolType: selectedTool,
          };

          const storedPrompts = localStorage.getItem("metamind_prompts");
          const prompts = storedPrompts ? JSON.parse(storedPrompts) : [];
          prompts.push(promptToSave);
          localStorage.setItem("metamind_prompts", JSON.stringify(prompts));

          // No confetti animation
        }, 1000);

        // Increment prompt count and save to localStorage
        const newPromptCount = promptCount + 1;
        setPromptCount(newPromptCount);
        localStorage.setItem(
          "metamind_prompt_count",
          newPromptCount.toString(),
        );
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (error: any) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        message:
          error.name === "AbortError"
            ? "Request timed out. Please try again with a simpler query."
            : "Sorry, there was an error processing your request. Please check your API key and try again.",
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
    localStorage.setItem("metamind_user", JSON.stringify(userData));
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setMessages([]);
    setPromptCount(0);
    localStorage.removeItem("metamind_user");
    localStorage.removeItem("metamind_prompt_count");
    router.push("/");
  };

  const currentYear = new Date().getFullYear();

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-white text-black">
      <div className="w-full flex justify-between items-center py-6 px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/images/logo.svg"
            alt="MetaMind Logo"
            width={40}
            height={40}
          />
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm font-medium">
              {promptCount} of {MAX_FREE_PROMPTS} Free Prompts
            </span>
          )}

          {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPremiumModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white text-sm font-medium rounded-none"
              >
                Upgrade
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 bg-white border border-[#eaeaea] rounded-none"
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
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg py-1 z-10 border border-[#eaeaea]">
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

      <div className="w-full max-w-5xl flex flex-col items-center gap-8 pt-12 px-4">
        <div className="text-center space-y-2 mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            MetaMind Prompt Generator
          </h1>
        </div>

        <ChatInterface
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          initialMessages={messages}
          initialTool={selectedTool}
          showToolSelector={false}
        />

        <footer className="text-center text-xs text-gray-500 mt-8">
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
        onClose={() => (user ? setAuthModalOpen(false) : null)}
        onLogin={handleLogin}
      />

      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />

      {/* Removed confetti */}
    </main>
  );
}
