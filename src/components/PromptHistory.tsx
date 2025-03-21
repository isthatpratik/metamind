import React, { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "./ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

interface PromptHistoryProps {
  prompts: {
    id: string;
    message: string;
    timestamp: string;
    toolType: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable";
  }[];
  onClose: () => void;
}

// Function to extract app name from prompt
const extractAppName = (message: string): string => {
  // First, try to match exact patterns for common app types
  const exactPatterns = [
    {
      pattern: /(?:create|build|develop|generate)\s+(?:an?|the)\s+([a-zA-Z]+)\s+clone/i,
      process: (match: string[]) => {
        const brandName = match[1];
        const knownBrands: { [key: string]: string } = {
          netflix: "Netflix Clone",
          twitter: "Twitter Clone",
          facebook: "Facebook Clone",
          instagram: "Instagram Clone",
          tiktok: "TikTok Clone",
          youtube: "YouTube Clone",
          amazon: "Amazon Clone",
          spotify: "Spotify Clone",
          airbnb: "Airbnb Clone",
          uber: "Uber Clone"
        };
        return knownBrands[brandName.toLowerCase()] || `${brandName} Clone`;
      }
    },
    {
      pattern: /(?:create|build|develop|generate)\s+(?:an?|the)\s+([a-zA-Z\s]+?)\s+(?:app|application|platform|website|dashboard)/i,
      process: (match: string[]) => {
        const type = match[0].match(/(?:app|application|platform|website|dashboard)/i)?.[0] || "";
        return `${match[1].trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      }
    }
  ];

  // Try exact patterns first
  for (const { pattern, process } of exactPatterns) {
    const match = message.match(pattern);
    if (match) {
      return process(match);
    }
  }

  // If no exact match, try to extract meaningful phrases
  const meaningfulPhrases = [
    // E-commerce patterns
    {
      pattern: /(?:e-commerce|ecommerce|online\s+store|shopping\s+platform)/i,
      result: "E-commerce Platform"
    },
    // Social media patterns
    {
      pattern: /(?:social\s+media|social\s+network|community\s+platform)/i,
      result: "Social Media Platform"
    },
    // Streaming patterns
    {
      pattern: /(?:streaming|video\s+platform|media\s+platform)/i,
      result: "Streaming Platform"
    },
    // AI/ML patterns
    {
      pattern: /(?:ai|artificial\s+intelligence|ml|machine\s+learning)/i,
      result: "AI Platform"
    },
    // Chat/Messaging patterns
    {
      pattern: /(?:chat|messaging|communication)/i,
      result: "Chat Application"
    }
  ];

  for (const { pattern, result } of meaningfulPhrases) {
    if (pattern.test(message)) {
      return result;
    }
  }

  // Extract any app-related description
  const appDescription = message.match(/(?:create|build|develop|generate)\s+(?:an?|the)\s+([^,.]+?)(?:\s+using|with|in|,|\.|$)/i);
  if (appDescription && appDescription[1]) {
    const description = appDescription[1].trim();
    // Clean and format the description
    const words = description.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .filter(word => !['A', 'An', 'The'].includes(word));
    
    if (words.length > 0) {
      // Add "App" suffix if it doesn't already have a type
      if (!words.some(word => ['App', 'Application', 'Platform', 'Website', 'Dashboard', 'System'].includes(word))) {
        words.push('App');
      }
      return words.join(' ');
    }
  }

  return "Custom App"; // Default fallback
};

const PromptHistory = ({ prompts = [], onClose }: PromptHistoryProps) => {
  const { toast } = useToast();
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The prompt has been copied to your clipboard.",
      duration: 2000,
    });
  };

  const togglePrompt = (id: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border rounded-lg border-[#eaeaea] p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Prompt History</h2>
      </div>

      {prompts.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No prompt history yet.</p>
      ) : (
        <div className="space-y-4">
          <Accordion type="multiple" className="w-full">
            {prompts.map((prompt) => (
              <AccordionItem
                key={prompt.id}
                value={prompt.id}
                className="border border-[#eaeaea] rounded-lg mb-4"
              >
                <div className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-black rounded-lg text-white text-xs px-4 py-2">
                      {prompt.toolType} - {extractAppName(prompt.message)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {prompt.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs bg-gradient-to-r from-[#A07CFE] via-[#FE8FB5] to-[#FFBE7B] hover:opacity-90 text-white rounded-lg border-0"
                      onClick={() => copyToClipboard(prompt.message)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Prompt
                    </Button>
                    <AccordionTrigger className="p-0">
                      <span className="sr-only">Toggle</span>
                    </AccordionTrigger>
                  </div>
                </div>
                <AccordionContent>
                  <div className="mx-4 mb-4 overflow-hidden">
                    <ScrollArea className="h-[400px] pr-4" style={{ scrollbarGutter: 'stable' }}>
                      <div className="bg-[#f5f5f5] p-3 rounded-lg text-sm whitespace-pre-wrap">
                        {prompt.message}
                      </div>
                    </ScrollArea>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default PromptHistory;
