
import * as React from "react";

export function WhiteboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="15" y="20" width="90" height="80" rx="8" fill="white" />
      <path d="M30 80 C 50 40, 70 100, 90 50" stroke="#2D4696" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
