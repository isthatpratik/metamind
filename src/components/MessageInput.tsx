import React, { useState, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import { SendHorizonal } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set new height
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    resizeTextarea();
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        onSendMessage(message);
        setMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"; // Reset height to auto
           // Set to default height
        }
      }
    },
    [message, isLoading, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <div className="w-full bg-white dark:bg-black p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "resize-none overflow-hidden bg-white dark:bg-black dark:border-white dark:text-white rounded-lg border border-black/80 text-black focus:border-black focus:ring-0",
            isLoading && "opacity-70"
          )}
          rows={1}
          autoCorrect="on"

        />
        <Button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="h-full w-12 rounded-lg shrink-0 self-end bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90 text-white animate-gradient-x"
          aria-label="Send message"
        >
            <SendHorizonal className="h-8 w-8" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
