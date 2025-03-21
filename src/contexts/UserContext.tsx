'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getProfile, getPromptHistory } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  is_premium?: boolean;
  total_prompts_limit?: number;
}

interface UserContextType {
  user: User | null;
  promptCount: number;
  isLoading: boolean;
  setPromptCount: (count: number) => void;
  refreshUserData: (force?: boolean) => Promise<User | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshUserData = async (force: boolean = false): Promise<User | null> => {
    try {
      // Don't refresh if we've refreshed recently, unless forced
      if (!force && Date.now() - lastRefresh < REFRESH_INTERVAL) {
        return user;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await getProfile(currentUser.id);
        if (profile) {
          const userData: User = {
            id: currentUser.id,
            email: currentUser.email || "",
            name: profile.name || currentUser.email?.split("@")[0] || "",
            is_premium: profile.is_premium || false,
            total_prompts_limit: profile.total_prompts_limit || 5,
          };
          setUser(userData);
          setPromptCount(profile.prompt_count || 0);
          setLastRefresh(Date.now());
          return userData;
        }
      }
      setUser(null);
      setPromptCount(0);
      return null;
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
  };

  // Initial session check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userData = await refreshUserData(true);
          if (userData) {
            // Store user data in localStorage for faster initial load
            localStorage.setItem('cachedUser', JSON.stringify(userData));
          }
        } else {
          setUser(null);
          localStorage.removeItem('cachedUser');
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    // Try to load cached user data first
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        setIsLoading(false);
      } catch (e) {
        localStorage.removeItem('cachedUser');
      }
    }

    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!isInitialized) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await refreshUserData(true);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setPromptCount(0);
        localStorage.removeItem('cachedUser');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized]);

  const contextValue = {
    user,
    promptCount,
    isLoading: isLoading && !user, // Only show loading if we don't have user data
    setPromptCount,
    refreshUserData
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 