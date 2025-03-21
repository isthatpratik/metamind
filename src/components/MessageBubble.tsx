import React from "react";
import { Copy } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useToast } from "./ui/use-toast";
import Image from "next/image";
import { useTheme } from "next-themes";

interface MessageBubbleProps {
  message: string;
  isUser?: boolean;
  timestamp?: string;
  syntaxHighlight?: boolean;
  toolType?: "V0" | "Cursor" | "Bolt" | "Tempo";
}

const MessageBubble = ({
  message = "This is a sample message.",
  isUser = false,
  timestamp = new Date().toLocaleTimeString(),
  syntaxHighlight = false,
  toolType = "Tempo",
}: MessageBubbleProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();

  const copyToClipboard = (textToCopy: string = message) => {
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard",
      description: "The content has been copied to your clipboard.",
      duration: 2000,
    });
  };

  // Determine background color based on sender
  const bubbleClasses = cn(
    "p-4 max-w-[85%] rounded-lg mb-4 dark:bg-gray-700 dark:border-white/10 dark:border dark:text-white",
    isUser
      ? "bg-black text-white ml-auto"
      : "bg-white text-black mr-auto border dark:bg-black/80 dark:border-white/30 dark:text-white",
  );

  return (
    <div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}
    >
      <div className="flex items-center mb-2 text-xs text-black ">
        {!isUser && (
          <div className="flex items-center justify-center w-5 h-5 mr-1 overflow-hidden">
            <Image
              src={theme === "light" ? "/images/metamind-black.png" : "/images/metamind-white.png"}
              alt="MetaMind"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
        )}
        <span className="flex items-center dark:text-white">
          {isUser ? "You" : "MetaMind"} • {timestamp}
        </span>
      </div>

      <div className={bubbleClasses}>
        {syntaxHighlight && !isUser ? (
          <div className="relative">
            <div className="relative">
              <div className="absolute -top-3 left-4 bg-black rounded-lg text-white text-xs px-2 py-1">
                {toolType} Prompt
              </div>
              <pre className="p-6 pt-8 bg-black text-sm text-white mt-2 whitespace-pre-wrap rounded-lg overflow-x-hidden">
                <code>{message}</code>
              </pre>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-gradient-to-r from-[#A07CFE] via-[#FE8FB5] to-[#FFBE7B] hover:opacity-90 text-white rounded-lg border-0"
                  onClick={() => copyToClipboard()}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Prompt
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message}</div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
