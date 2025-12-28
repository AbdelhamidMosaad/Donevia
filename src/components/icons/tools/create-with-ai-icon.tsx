
import * as React from "react";

export function CreateWithAiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M30 30 L 90 30 L 90 90 L 30 90 Z" fill="none" stroke="white" strokeWidth="5" />
      <path d="M40 50 L 80 50 M 40 65 L 70 65" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M85 20 L 90 15 L 95 20 M 90 15 L 90 25" stroke="white" strokeWidth="3" fill="none" />
      <path d="M100 30 L 105 25 L 110 30 M 105 25 L 105 35" stroke="white" strokeWidth="3" fill="none" opacity="0.7" />
    </svg>
  );
}
