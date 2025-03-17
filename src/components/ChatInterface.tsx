import React, { useState, useEffect, useCallback, memo } from "react";
import ToolSelector from "./ToolSelector";
import MessageHistory from "./MessageHistory";
import MessageInput from "./MessageInput";
import { Toaster } from "./ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { ShineBorder } from "./magicui/shine-border";

interface Message {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  syntaxHighlight?: boolean;
  toolType?: "V0" | "Cursor" | "Bolt" | "Tempo";
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
  initialTool?: "V0" | "Cursor" | "Bolt" | "Tempo";
  onSendMessage?: (
    message: string,
    tool?: "V0" | "Cursor" | "Bolt" | "Tempo",
  ) => void;
  isLoading?: boolean;
  showToolSelector?: boolean;
}

// Memoize components for better performance
const MemoizedToolSelector = memo(ToolSelector);
const MemoizedMessageHistory = memo(MessageHistory);
const MemoizedMessageInput = memo(MessageInput);

const ChatInterface = ({
  initialMessages = [
    {
      id: "1",
      message: "Hello! How can I help you with AI tool instructions today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      toolType: "Tempo",
    },
  ],
  initialTool = "Tempo",
  onSendMessage = () => {},
  isLoading = false,
  showToolSelector = true,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedTool, setSelectedTool] = useState<
    "V0" | "Cursor" | "Bolt" | "Tempo"
  >(initialTool);
  const [error, setError] = useState<string | null>(null);

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSendMessage = useCallback(
    (message: string) => {
      // Reset any previous errors
      setError(null);
      // Call the onSendMessage prop with the message and selected tool
      try {
        if (showToolSelector) {
          onSendMessage(message, selectedTool);
        } else {
          onSendMessage(message);
        }
      } catch (err) {
        setError("Failed to send message. Please try again.");
        console.error("Error sending message:", err);
      }
    },
    [onSendMessage, selectedTool, showToolSelector],
  );

  const handleToolChange = useCallback(
    (tool: "V0" | "Cursor" | "Bolt" | "Tempo") => {
      setSelectedTool(tool);
    },
    [],
  );

  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-lg flex flex-col h-full bg-white dark:bg-black">
      {showToolSelector && (
        <div className="p-0">
          <MemoizedToolSelector
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
          />
        </div>
      )}

      <div className="flex-1 overflow-hidden p-0">
      
        {error && (
          <Alert variant="destructive" className="m-4 bg-black rounded-lg border-0">
            <AlertCircle className="h-4 w-4 text-white" />
            <AlertTitle className="text-white">Error</AlertTitle>
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        )}
        <MemoizedMessageHistory
          messages={messages}
          loading={isLoading}
          selectedTool={selectedTool}
        />
      </div>

      <div className="p-0">
        <MemoizedMessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder={`Type your product idea`}
          disabled={isLoading}
        />
      </div>
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      <Toaster />
    </div>
  );
};

export default memo(ChatInterface);
