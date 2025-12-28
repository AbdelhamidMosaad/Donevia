
import * as React from "react";

export function BookmarksIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M30 20 H 90 C 95.523 20, 100 24.477, 100 30 V 100 L 60 80 L 20 100 V 30 C 20 24.477, 24.477 20, 30 20 Z" fill="white" />
    </svg>
  );
}
