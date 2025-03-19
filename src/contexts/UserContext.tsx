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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
          // Fetch profile and prompt history in parallel
          const [profileResult, historyResult] = await Promise.all([
            getProfile(session.user.id),
            getPromptHistory(session.user.id)
          ]);

          if (profileResult.error) {
            console.error("Error getting profile:", profileResult.error);
            setIsLoading(false);
            return;
          }

          if (profileResult.data) {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: profileResult.data.name || session.user.email?.split("@")[0] || "",
              is_premium: profileResult.data.is_premium || false,
              total_prompts_limit: profileResult.data.total_prompts_limit || 5,
            });
            setPromptCount(profileResult.data.prompt_count || 0);
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
        try {
          // Fetch profile and prompt history in parallel
          const [profileResult, historyResult] = await Promise.all([
            getProfile(session.user.id),
            getPromptHistory(session.user.id)
          ]);

          if (profileResult.data) {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: profileResult.data.name || session.user.email?.split("@")[0] || "",
              is_premium: profileResult.data.is_premium || false,
              total_prompts_limit: profileResult.data.total_prompts_limit || 5,
            });
            setPromptCount(profileResult.data.prompt_count || 0);
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
        }
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
    <UserContext.Provider value={{ user, promptCount, isLoading, setPromptCount }}>
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