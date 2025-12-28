
import * as React from "react";

export function FlashcardsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <g transform="rotate(10, 60, 60)">
        <rect x="35" y="20" width="60" height="80" rx="10" fill="#2D4696" stroke="white" strokeWidth="4" opacity="0.7"/>
      </g>
      <rect x="25" y="20" width="60" height="80" rx="10" fill="white" />
      <rect x="35" y="40" width="40" height="6" rx="3" fill="#2D4696" />
      <rect x="35" y="55" width="40" height="5" rx="2.5" fill="#2D4696" opacity="0.8" />
    </svg>
  );
}
