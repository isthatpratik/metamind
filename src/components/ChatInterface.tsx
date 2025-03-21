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
  toolType?: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable";
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
  initialTool?: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable";
  onSendMessage?: (
    message: string,
    tool?: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable",
  ) => void;
  isLoading?: boolean;
  showToolSelector?: boolean;
}

// Memoize components for better performance
const MemoizedToolSelector = memo(ToolSelector);
const MemoizedMessageHistory = memo(MessageHistory);
const MemoizedMessageInput = memo(MessageInput);

const ChatInterface = ({
  initialTool = "V0",
  initialMessages = [
    {
      id: "1",
      message: "Hello! How can I help you with AI tool instructions today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
      toolType: initialTool,
    },
  ],
  onSendMessage = () => {},
  isLoading = false,
  showToolSelector = true,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedTool, setSelectedTool] = useState<
    "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable"
  >(initialTool);
  const [error, setError] = useState<string | null>(null);
  const [localIsLoading, setLocalIsLoading] = useState<boolean>(isLoading);

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Update messages' toolType when selectedTool changes
  useEffect(() => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.isUser ? msg : { ...msg, toolType: selectedTool }
      )
    );
  }, [selectedTool]);

  const handleSendMessage = useCallback(
    (message: string) => {
      // Reset any previous errors
      setError(null);
      // Set loading state when sending message
      setLocalIsLoading(true);
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
        // Reset loading state on error
        setLocalIsLoading(false);
      }
    },
    [onSendMessage, selectedTool, showToolSelector],
  );

  const handleToolChange = useCallback(
    (tool: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable") => {
      setSelectedTool(tool);
    },
    [],
  );

  // Reset loading state when messages change
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].isUser === false) {
      setLocalIsLoading(false);
    }
  }, [messages]);

  return (
    <div className="w-full max-w-5xl mx-auto overflow-hidden rounded-lg flex flex-col h-full bg-white dark:bg-black">
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
          loading={localIsLoading}
          selectedTool={selectedTool}
        />
      </div>

      <div className="p-0">
        <MemoizedMessageInput
          onSendMessage={handleSendMessage}
          isLoading={localIsLoading}
          placeholder={`Type your product idea`}
          disabled={localIsLoading}
        />
      </div>
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      
    </div>
  );
};

export default memo(ChatInterface);
