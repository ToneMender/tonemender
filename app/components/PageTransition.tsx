"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const tracking = useRef(false);

  function maybeVibrate(ms = 20) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  }

  // Swipe-back gesture (from left edge)
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];

    // Only start tracking if user starts very near left edge
    if (t.clientX > 40) return;

    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    tracking.current = true;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!tracking.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;

    // If mostly vertical movement, cancel tracking
    if (Math.abs(dy) > 60) {
      tracking.current = false;
      return;
    }

    // Swipe right enough → go back
    if (dx > 70) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        maybeVibrate(15);
        router.back();
      }
      tracking.current = false;
    }
  }

  function handleTouchEnd() {
    tracking.current = false;
  }

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 sm:px-0 py-8 bg-slate-100 text-slate-900 relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -30, filter: "blur(8px)" }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 30,
            mass: 0.9,
          }}
          className="w-full max-w-xl"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}