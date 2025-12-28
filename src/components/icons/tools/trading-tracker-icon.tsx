
import * as React from "react";

export function TradingTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M25 85 L 50 60 L 70 75 L 95 40" stroke="white" strokeWidth="8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M 80 40 L 95 40 L 95 55" stroke="white" strokeWidth="8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
