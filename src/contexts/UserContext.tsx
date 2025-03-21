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
  refreshUserData: (force?: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const refreshUserData = async (force: boolean = false) => {
    try {
      // Don't refresh if we've refreshed recently, unless forced
      if (!force && Date.now() - lastRefresh < REFRESH_INTERVAL) {
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await getProfile(currentUser.id);
        if (profile) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || "",
            name: profile.name || currentUser.email?.split("@")[0] || "",
            is_premium: profile.is_premium || false,
            total_prompts_limit: profile.total_prompts_limit || 5,
          });
          setPromptCount(profile.prompt_count || 0);
          setLastRefresh(Date.now());
        }
      } else {
        setUser(null);
        setPromptCount(0);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const { data: profile } = await getProfile(session.user.id);
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: profile.name || session.user.email?.split("@")[0] || "",
              is_premium: profile.is_premium || false,
              total_prompts_limit: profile.total_prompts_limit || 5,
            });
            setPromptCount(profile.prompt_count || 0);
            setLastRefresh(Date.now());
          }
        }
      } catch (error) {
        console.error("Error in checkUser:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await refreshUserData(true); // Force refresh on sign in
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setPromptCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, promptCount, isLoading, setPromptCount, refreshUserData }}>
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