"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  onClick?: () => void;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#FE8BBB",
  gradientOpacity = 0.8,
  gradientFrom = "#262626",
  gradientTo = "#9E7AFF",
  onClick,
}: MagicCardProps) {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (cardRef.current) {
        const { left, top } = cardRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }
    },
    [mouseX, mouseY],
  );

  const handleMouseOut = useCallback(
    (e: MouseEvent) => {
      if (!e.relatedTarget) {
        document.removeEventListener("mousemove", handleMouseMove);
        mouseX.set(-gradientSize);
        mouseY.set(-gradientSize);
      }
    },
    [handleMouseMove, mouseX, gradientSize, mouseY],
  );

  const handleMouseEnter = useCallback(() => {
    document.addEventListener("mousemove", handleMouseMove);
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [handleMouseMove, mouseX, gradientSize, mouseY]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [handleMouseEnter, handleMouseMove, handleMouseOut]);

  useEffect(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative rounded-[inherit] cursor-pointer",
        "dark:backdrop-blur-md dark:bg-white/5",
        className
      )}
      onClick={onClick}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white dark:bg-white/10 duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
          radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
          ${theme === "dark" ? "rgba(255,255,255,0.1)" : gradientFrom}, 
          ${theme === "dark" ? "rgba(255,255,255,0.05)" : gradientTo}, 
          ${theme === "dark" ? "transparent" : "hsl(var(--border))"} 100%
          )
          `,
        }}
      />
      <div className="absolute inset-px rounded-[inherit] bg-white dark:bg-transparent dark:border dark:border-white/20" />
      <motion.div
        className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, 
              ${theme === "dark" ? "rgba(255,255,255,0.15)" : gradientColor}, 
              transparent 100%)
          `,
          opacity: theme === "dark" ? 0.3 : gradientOpacity,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
} 