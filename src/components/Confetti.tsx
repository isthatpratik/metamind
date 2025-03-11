"use client";

import React, { useEffect, useState } from "react";

interface ConfettiProps {
  duration?: number;
  onComplete?: () => void;
}

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  speed: number;
  angle: number;
}

const Confetti = ({ duration = 3000, onComplete }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Set dimensions to window size
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Generate confetti pieces
    const colors = [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
    ];
    const newPieces: ConfettiPiece[] = [];

    for (let i = 0; i < 100; i++) {
      newPieces.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        size: 5 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speed: 1 + Math.random() * 3,
        angle: Math.random() * 90 - 45,
      });
    }

    setPieces(newPieces);

    // Handle window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Set timeout to hide confetti
    const timeout = setTimeout(() => {
      setShowConfetti(false);
      if (onComplete) onComplete();
    }, duration);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, [duration, onComplete]);

  if (!showConfetti) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <div
          key={index}
          className="absolute animate-fall"
          style={{
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            animation: `fall ${3 + Math.random() * 2}s linear forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(${dimensions.height + 100}px)
              rotate(${720 + Math.random() * 360}deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Confetti;
