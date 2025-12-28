
import * as React from "react";

export function MindMapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <circle cx="40" cy="60" r="15" fill="white" />
      <path d="M55 60 h 30" stroke="white" strokeWidth="5" />
      <circle cx="90" cy="60" r="10" fill="white" />
      <path d="M90 60 L 90 40" stroke="white" strokeWidth="5" />
      <circle cx="90" cy="35" r="8" fill="white" />
      <path d="M90 60 L 90 80" stroke="white" strokeWidth="5" />
      <circle cx="90" cy="85" r="8" fill="white" />
    </svg>
  );
}
