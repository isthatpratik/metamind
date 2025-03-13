import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import MessageBubble from "./MessageBubble";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  syntaxHighlight?: boolean;
  toolType?: "V0" | "Cursor" | "Bolt" | "Tempo";
}

interface MessageHistoryProps {
  messages?: Message[];
  loading?: boolean;
  selectedTool?: "V0" | "Cursor" | "Bolt" | "Tempo";
}

const MessageHistory = ({
  messages = [
    {
      id: "1",
      message: "Hello! How can I help you with AI tool instructions today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
      toolType: "Tempo",
    },
  ],
  loading = false,
  selectedTool = "Tempo",
}: MessageHistoryProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Simulate progress when loading
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (100 - prev) * 0.1;
          return next >= 95 ? 95 : next;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [loading]);

  return (
    <div className="w-full h-[480px] flex flex-col bg-white dark:bg-black relative">
      <AnimatePresence>
        {!loading && messages.length > 0 && messages[messages.length - 1]?.isUser === false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 pointer-events-none"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(160, 124, 254, 0)",
                  "0 0 0 20px rgba(160, 124, 254, 0.2)",
                  "0 0 0 40px rgba(160, 124, 254, 0)",
                ],
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                times: [0, 0.5, 1],
                repeat: 0,
              }}
              className="w-full h-full rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollArea className="flex-1 p-4 h-full" ref={scrollAreaRef}>
        <div className="flex flex-col space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.message}
              isUser={message.isUser}
              timestamp={message.timestamp}
              syntaxHighlight={message.syntaxHighlight}
              toolType={
                message.isUser ? undefined : message.toolType || selectedTool
              }
            />
          ))}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-64 h-3 bg-[#f5f5f5] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-black font-medium">
                Generating response... {Math.round(progress)}%
              </p>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageHistory;
