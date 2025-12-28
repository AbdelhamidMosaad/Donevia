
import * as React from "react";

export function EnglishCoachIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M30 30 L 90 30 L 90 90 L 30 90 Z" fill="none" stroke="white" strokeWidth="5" />
      <path d="M 60 40 L 45 75 L 75 75 Z" fill="none" stroke="white" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M 50 65 h 20" stroke="white" strokeWidth="6" />
    </svg>
  );
}
