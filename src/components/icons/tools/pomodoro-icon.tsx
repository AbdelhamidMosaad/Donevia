
import * as React from "react";

export function PomodoroIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <circle cx="60" cy="65" r="40" fill="white" />
      <path d="M45 25 L 75 25 L 70 15 L 50 15 Z" fill="#2D4696" />
      <path d="M 60 65 L 60 40" stroke="#2D4696" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
