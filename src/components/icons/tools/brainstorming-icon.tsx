
import * as React from "react";

export function BrainstormingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M60 20 C 35 20, 20 40, 20 60 C 20 80, 35 100, 55 100 L 55 90 L 65 90 L 65 100 C 85 100, 100 80, 100 60 C 100 40, 85 20, 60 20 Z" fill="white" />
      <circle cx="60" cy="60" r="15" fill="#2D4696" />
    </svg>
  );
}
