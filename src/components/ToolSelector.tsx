import React from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import Image from "next/image";

interface ToolSelectorProps {
  selectedTool?: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable";
  onToolChange?: (tool: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable") => void;
}

const ToolSelector = ({
  selectedTool = "V0",
  onToolChange = () => {},
}: ToolSelectorProps) => {
  const handleToolChange = (value: string) => {
    onToolChange(value as "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable");
  };

  return (
    <div className="p-6 w-full bg-white border-b border-[#eaeaea]">
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-medium text-black">Select AI Tool</h3>
        <RadioGroup
          defaultValue={selectedTool}
          value={selectedTool}
          onValueChange={handleToolChange}
          className="flex flex-wrap justify-center gap-6 mt-3"
        >
          {["V0", "Cursor", "Bolt", "Tempo", "Lovable"].map((tool) => (
            <div
              key={tool}
              className={`flex items-center space-x-2 p-3 ${selectedTool === tool ? "bg-black text-white" : "bg-white hover:bg-[#f5f5f5] border border-[#eaeaea]"}`}
            >
              <RadioGroupItem
                value={tool}
                id={tool.toLowerCase()}
                className={selectedTool === tool ? "text-white" : "text-black"}
              />
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={tool.toLowerCase()}
                  className={`cursor-pointer ${selectedTool === tool ? "text-white" : "text-black"}`}
                >
                  {tool} {tool === "Cursor" || tool === "Bolt" ? "AI" : ""}
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default ToolSelector;
