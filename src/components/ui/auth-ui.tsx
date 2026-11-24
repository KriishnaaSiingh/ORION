"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );
    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, currentText, loop, speed, deleteSpeed, delay, displayText, text]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

// ── AuthSplitLayout ──────────────────────────────────────────────────────────
// A two-column auth layout: form left, decorative image right.
// The right panel image + quote swaps between sign-in and sign-up.

interface AuthSplitLayoutProps {
  mode: "login" | "register";
  children: React.ReactNode;
}

const PANEL_CONFIG = {
  login: {
    imageSrc:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Aerial view of glowing data nodes",
    quote: "Intelligence begins where data ends.",
    author: "Orion Intelligence",
  },
  register: {
    imageSrc:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Abstract neural network topology",
    quote: "Every great system starts with a single connection.",
    author: "Orion Intelligence",
  },
};

export function AuthSplitLayout({ mode, children }: AuthSplitLayoutProps) {
  const panel = PANEL_CONFIG[mode];
  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }
      `}</style>

      {/* Left — form */}
      <div className="flex min-h-screen items-center justify-center bg-background p-8 md:min-h-0 md:p-12">
        {children}
      </div>

      {/* Right — decorative panel */}
      <div
        className="relative hidden bg-cover bg-center transition-all duration-700 ease-in-out md:block"
        style={{ backgroundImage: `url(${panel.imageSrc})` }}
        key={panel.imageSrc}
      >
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
        {/* Quote */}
        <div className="relative z-10 flex h-full flex-col items-center justify-end p-8 pb-10">
          <blockquote className="space-y-2 text-center">
            <p className="text-lg font-medium text-white">
              &ldquo;
              <Typewriter key={panel.quote} text={panel.quote} speed={55} />
              &rdquo;
            </p>
            <cite className="block text-sm font-light text-white/60 not-italic">
              — {panel.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
