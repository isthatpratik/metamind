"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-center text-xs text-gray-500 py-6 relative">
      <p>
        © {currentYear} MetaMind - Product prompt generator by{" "}
        <Link
          href="https://ampvc.co"
          target="_blank"
          className="text-gray-700 hover:text-black transition-colors"
        >
          Ampersand
        </Link>
      </p>
    </footer>
  );
} 