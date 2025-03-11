import React, { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";

interface MessageInputProps {
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const MessageInput = ({
  onSendMessage = () => {},
  isLoading = false,
  placeholder = "Type your product idea",
  disabled = false,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        onSendMessage(message);
        setMessage("");
      }
    },
    [message, isLoading, onSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  return (
    <div className="w-full bg-white p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "min-h-[60px] max-h-[120px] resize-none bg-white border border-black text-black focus:border-black focus:ring-0 rounded-none",
            isLoading && "opacity-70",
          )}
          rows={1}
        />
        <Button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="h-[60px] w-[60px] shrink-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90 text-white rounded-none animate-gradient-x"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin"></div>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="square"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="square"
              />
            </svg>
          )}
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
