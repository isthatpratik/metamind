"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/UserContext";
import { signOut } from "@/lib/supabase";
import { toast } from "sonner";

interface NavbarProps {
  onOpenAuth: (tab: "login" | "register") => void;
  onOpenPremium: () => void;
}

export function Navbar({ onOpenAuth, onOpenPremium }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const { user, promptCount, isLoading: userLoading, setPromptCount } = useUser();

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicks outside menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast("Error logging out", {
        description: "Failed to sign out. Please try again.",
      });
      return;
    }
    setPromptCount(0);
    router.push("/");
  };

  const handleNavigation = (path: string) => {
    if (path === "/prompt-history" && !user?.is_premium) {
      onOpenPremium();
    } else {
      router.push(path);
    }
    setMenuOpen(false); // Close menu after navigation
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full bg-white dark:bg-black">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="w-full flex justify-between items-center py-6">
            <div className="flex items-center gap-2 w-25 h-auto">
              <div className="w-[180px] h-[50px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-black">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="w-full flex justify-between items-center py-6">
          <Link href="/" className="flex items-center gap-2 w-25 h-auto">
            <Image
              src={resolvedTheme === "dark" ? "/images/metamind-dark.png" : "/images/metamind-light.png"}
              alt="MetaMind Logo"
              width={200}
              height={200}
              className="object-contain lg:w-[180px] w-[120px]"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />

            {/* Prompt count display */}
            {userLoading ? (
              <div className="hidden sm:block h-10 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
            ) : user && (
              <span className="hidden sm:inline-block text-sm dark:text-white font-medium px-4 py-2 bg-white/80 dark:bg-transparent backdrop-blur-sm border border-[#eaeaea] dark:border-white/50 rounded-lg">
                {user.is_premium 
                  ? `${promptCount}/${user.total_prompts_limit} Premium Prompts`
                  : `${promptCount}/${user.total_prompts_limit} Free Prompts`
                }
              </span>
            )}

            {/* Auth buttons or user menu */}
            {userLoading ? (
              <div className="flex gap-2">
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
              </div>
            ) : !user ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenAuth("login")}
                  className="px-4 py-2 bg-black text-white text-sm font-medium dark:border-white/50 dark:border rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth("register")}
                  className="px-4 py-2 bg-black text-white text-sm font-medium dark:border-white/50 dark:border rounded-lg"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenPremium}
                  className="px-4 py-2 bg-gradient-to-tr from-[#A07CFE] from-30% via-[#FE8FB5] via-60% to-[#FFBE7B] to-90% text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {user.is_premium ? "Buy Prompts" : "Upgrade"}
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 bg-white border border-[#eaeaea] dark:bg-transparent dark:text-white dark:border-white/50 rounded-lg"
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
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg py-1 z-50 border border-[#eaeaea] rounded-lg">
                      <div className="px-4 py-2 border-b border-[#eaeaea] dark:text-black">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleNavigation('/prompt-history')}
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
  );
} 