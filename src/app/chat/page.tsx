"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import { generateAIResponse } from "@/lib/openai";
import AuthModal from "@/components/auth/AuthModal";
import PremiumModal from "@/components/premium/PremiumModal";
import SearchParamsClient from "@/components/SearchParamsClient";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { supabase, savePromptHistory, getProfile, getPromptHistory } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";

interface Message {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  syntaxHighlight?: boolean;
  toolType?: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable";
}

export default function ChatPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<
    "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable"
  >("V0");
  const { user, promptCount, setPromptCount } = useUser();

  const handleLogin = async (userData: {
    email: string;
    name: string;
    id: string;
    promptCount: number;
  }) => {
    try {
      // Get fresh profile and prompt history data
      const { data: profile, error: profileError } = await getProfile(userData.id);
      const { data: promptHistory, error: historyError } = await getPromptHistory(userData.id);

      if (profileError || historyError) {
        console.error("Error fetching user data:", profileError || historyError);
        return;
      }

      // Calculate the most accurate prompt count
      const actualCount = Math.max(
        profile?.prompt_count || 0,
        promptHistory?.length || 0,
        userData.promptCount
      );

      setPromptCount(actualCount);
      setAuthModalOpen(false);
    } catch (error) {
      console.error("Error in handleLogin:", error);
      toast({
        title: "Error updating user data",
        description: "Please try logging in again",
        variant: "destructive",
      });
    }
  };

  // Show welcome message only when user logs in or tool changes
  useEffect(() => {
    if (user && messages.length === 0) {
      const welcomeMessage = {
        id: "1",
        message: `Welcome ${user.name}! Describe your product idea and I'll generate a customized prompt for ${selectedTool}.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        toolType: selectedTool,
      };
      setMessages([welcomeMessage]);

      // Store welcome message in session storage to persist across reloads
      sessionStorage.setItem('welcomeMessage', JSON.stringify(welcomeMessage));
    } else if (messages.length > 0) {
      // Update existing welcome message if tool changes
      const updatedMessages = messages.map(msg => 
        msg.id === "1" ? {
          ...msg,
          message: `Welcome ${user?.name || ''}! Describe your product idea and I'll generate a customized prompt for ${selectedTool}.`,
          toolType: selectedTool,
        } : msg
      );
      setMessages(updatedMessages);
      if (updatedMessages[0]?.id === "1") {
        sessionStorage.setItem('welcomeMessage', JSON.stringify(updatedMessages[0]));
      }
    }
  }, [user, messages.length, selectedTool]);

  // Load persisted welcome message on mount
  useEffect(() => {
    const storedMessage = sessionStorage.getItem('welcomeMessage');
    if (storedMessage && messages.length === 0) {
      try {
        const parsedMessage = JSON.parse(storedMessage);
        // Update the stored message with current tool type if different
        if (selectedTool !== parsedMessage.toolType) {
          parsedMessage.toolType = selectedTool;
          parsedMessage.message = `Welcome ${user?.name || ''}! Describe your product idea and I'll generate a customized prompt for ${selectedTool}.`;
          sessionStorage.setItem('welcomeMessage', JSON.stringify(parsedMessage));
        }
        setMessages([parsedMessage]);
      } catch (e) {
        console.error('Error parsing stored welcome message:', e);
        sessionStorage.removeItem('welcomeMessage');
      }
    }
  }, [selectedTool, messages.length, user]);

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

  return (
    <>
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>}>
        <SearchParamsClient setSelectedTool={setSelectedTool} />
      </Suspense>
      <main className="flex flex-1 flex-col items-center bg-black text-white">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col flex-1">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-8 w-full relative">
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
              <FlickeringGrid
                className="relative z-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
                squareSize={5}
                gridGap={6}
                colors={["#ffffff", "#f5f5f5", "#e5e5e5"]}
                maxOpacity={0.6}
                flickerChance={0.1}
              />
            </div>
            <div className="text-center space-y-2 pt-8 drop-shadow-2xl shadow-black">
              <h1 className="text-3xl font-bold tracking-tight text-white relative shadow-2xl shadow-black">
                Prompt. Create. Innovate.
              </h1>
            </div>
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
            </div>}>
              <div className="flex w-full max-w-5xl py-4 px-4 self-center relative bg-black/80 backdrop-blur-sm overflow-hidden">
                <ChatInterface
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  initialMessages={messages}
                  initialTool={selectedTool}
                  showToolSelector={false}
                />
              </div>
            </Suspense>
          </div>
        </div>
      </main>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />
      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />
    </>
  );
}
