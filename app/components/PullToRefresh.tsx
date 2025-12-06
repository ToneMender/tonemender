"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";

type PullToRefreshProps = {
  onRefresh: () => void;
  children: ReactNode;
};

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  function maybeVibrate(ms = 30) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (refreshing) return;
    if (typeof window !== "undefined" && window.scrollY > 0) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    pullingRef.current = true;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!pullingRef.current || startYRef.current === null) return;
    const touch = e.touches[0];
    const delta = touch.clientY - startYRef.current;

    if (delta <= 0) {
      setPullDistance(0);
      return;
    }

    const limited = Math.min(delta, 100);
    setPullDistance(limited);
  }

  function handleTouchEnd() {
    if (!pullingRef.current) return;

    const threshold = 70;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      maybeVibrate(40);
      onRefresh();

      // Reset UI after a short delay
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 600);
    } else {
      setPullDistance(0);
    }

    pullingRef.current = false;
    startYRef.current = null;
  }

  const indicatorStyle: React.CSSProperties = {
    transform: `translateY(${pullDistance / 2}px)`,
    opacity: pullDistance > 5 || refreshing ? 1 : 0,
    transition: refreshing ? "opacity 0.2s ease-out" : "opacity 0.15s ease-out",
  };

  const contentStyle: React.CSSProperties = {
    transform: `translateY(${pullDistance}px)`,
    transition: refreshing ? "transform 0.2s ease-out" : "none",
  };

  return (
    <div
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top pull indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center gap-2 text-[11px] text-slate-500"
        style={indicatorStyle}
      >
        <div className="h-3 w-3 rounded-full border border-slate-400 border-t-transparent animate-spin" />
        <span>{refreshing ? "Refreshing…" : "Pull to refresh"}</span>
      </div>

      {/* Content that moves down while pulling */}
      <div style={contentStyle}>{children}</div>
    </div>
  );
}