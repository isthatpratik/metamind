"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PromptHistory from "@/components/PromptHistory";

interface User {
  email: string;
  name: string;
}

interface Prompt {
  id: string;
  message: string;
  timestamp: string;
  toolType: "V0" | "Cursor" | "Bolt" | "Tempo";
}

export default function PromptHistoryPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
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

  // Check for user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("metamind_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/");
    }

    const storedPromptCount = localStorage.getItem("metamind_prompt_count");
    if (storedPromptCount) {
      setPromptCount(parseInt(storedPromptCount, 10));
    }

    // Load prompt history from localStorage
    const storedPrompts = localStorage.getItem("metamind_prompts");
    if (storedPrompts) {
      setPrompts(JSON.parse(storedPrompts));
    }
  }, [router]);

  const handleLogout = () => {
    setUser(null);
    setPromptCount(0);
    localStorage.removeItem("metamind_user");
    localStorage.removeItem("metamind_prompt_count");
    router.push("/");
  };

  const currentYear = new Date().getFullYear();

  return (
    <main className="flex min-h-screen flex-col items-center bg-white text-black">
      <div className="w-full border-b border-[#eaeaea] bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="w-full flex justify-between items-center py-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg overflow-hidden p-1">
                <Image
                  src="/images/logo.svg"
                  alt="MetaMind Logo"
                  width={40}
                  height={40}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm font-medium px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#eaeaea] rounded-lg">
                  {promptCount} of {MAX_FREE_PROMPTS} Free Prompts
                </span>
              )}

              {user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg"
                  >
                    Back to Home
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
                        <button
                          onClick={() => router.push("/prompt-history")}
                          className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#f5f5f5] border-b border-[#eaeaea]"
                        >
                          Prompt History
                        </button>
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
          <div className="text-center space-y-2 mb-8 relative z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0)_90%)] rounded-2xl px-8 py-6">
            <h1 className="text-4xl font-bold tracking-tight text-black bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-transparent bg-clip-text">
              {
                [
                  "Your Prompt Arsenal",
                  "AI Prompt Collection",
                  "Your Creative Prompts",
                  "Prompt Masterpieces",
                  "Your Genius Prompts",
                ][Math.floor(Math.random() * 5)]
              }
            </h1>
          </div>

          <div className="w-full max-w-4xl rounded-lg mx-auto flex justify-center relative z-10">
            <PromptHistory prompts={prompts} onClose={() => router.push("/")} />
          </div>
        </div>

        <footer className="text-center text-xs text-gray-500 py-6 relative">
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
    </main>
  );
}
