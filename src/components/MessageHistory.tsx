import React, { useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import MessageBubble from "./MessageBubble";

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

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  return (
    <div className="w-full h-[480px] flex flex-col bg-white">
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
              <div className="w-64 h-3 bg-[#f5f5f5] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-progress"
                  style={{ width: "0%" }}
                ></div>
              </div>
              <p className="text-sm text-black animate-pulse font-medium">
                Working on the prompt details... Please wait!
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
