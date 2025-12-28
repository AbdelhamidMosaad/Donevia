
import * as React from "react";

export function ToDoListIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path
        d="M45 45L60 60L85 35"
        stroke="white"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="45"
        y1="80"
        x2="85"
        y2="80"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
