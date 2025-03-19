"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import Image from "next/image";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  user: { email: string; name: string } | null;
  onLogin: () => void;
  onLogout: () => void;
  promptCount: number;
  maxPrompts: number;
  selectedTool?: "V0" | "Cursor" | "Bolt" | "Tempo";
}

const Header = ({
  user,
  onLogin,
  onLogout,
  promptCount,
  maxPrompts,
  selectedTool,
}: HeaderProps) => {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 flex items-center justify-center">
          <Image
            src="/images/metamind-logo.png"
            alt="MetaMind Logo"
            width={32}
            height={32}
          />
        </div>
        <span className="text-sm text-gray-400 ml-2">MetaMind</span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex flex-col items-center mr-2 md:block">
            <div className="text-xs text-gray-400 mb-1">
              {promptCount}/{maxPrompts} prompts used
            </div>
            <div className="h-2 w-32 bg-gray-800 rounded-full">
              <div
                className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(promptCount / maxPrompts) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <ThemeSwitcher />

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 rounded-md px-2 text-white hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
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
                  <span className="hidden sm:inline-block">{user.name}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-gray-800 border-gray-700 text-white"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-gray-400">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm cursor-pointer text-white hover:bg-gray-700">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm cursor-pointer text-white hover:bg-gray-700"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            size="sm"
            onClick={onLogin}
            className="bg-white/70 dark:bg-white/70 text-black hover:bg-white/80"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
