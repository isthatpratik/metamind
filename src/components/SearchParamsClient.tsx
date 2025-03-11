"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface SearchParamsClientProps {
  setSelectedTool: (tool: "V0" | "Cursor" | "Bolt" | "Tempo") => void;
}

export default function SearchParamsClient({ setSelectedTool }: SearchParamsClientProps) {
  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");

  useEffect(() => {
    if (toolParam && ["V0", "Cursor", "Bolt", "Tempo"].includes(toolParam)) {
      setSelectedTool(toolParam as "V0" | "Cursor" | "Bolt" | "Tempo");
    }
  }, [toolParam, setSelectedTool]);

  return null; // No UI needed, just updating state
}
