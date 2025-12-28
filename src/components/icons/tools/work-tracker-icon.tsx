
import * as React from "react";

export function WorkTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="25" y="30" width="70" height="60" rx="10" fill="white" />
      <path d="M35 20 h 50 v 15 h -50 z" fill="white" />
      <circle cx="60" cy="60" r="18" fill="#2D4696" />
      <path d="M60 48 L 60 60 L 72 72" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
