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
    toolType: "V0" | "Cursor" | "Bolt" | "Tempo";
  }[];
  onClose: () => void;
}

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
    <div className="w-full max-w-4xl mx-auto bg-white border border-[#eaeaea] p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Prompt History</h2>
        <Button
          variant="outline"
          onClick={onClose}
          className="border border-[#eaeaea] hover:bg-[#f5f5f5]"
        >
          Close
        </Button>
      </div>

      {prompts.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No prompt history yet.</p>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            <Accordion type="multiple" className="w-full">
              {prompts.map((prompt) => (
                <AccordionItem
                  key={prompt.id}
                  value={prompt.id}
                  className="border border-[#eaeaea] mb-4"
                >
                  <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-black text-white text-xs px-2 py-1">
                        {prompt.toolType}
                      </div>
                      <span className="text-xs text-gray-500">
                        {prompt.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:opacity-90 text-white rounded-none border-0"
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
                    <div className="bg-[#f5f5f5] p-3 mx-4 mb-4 text-sm whitespace-pre-wrap">
                      {prompt.message}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default PromptHistory;
