
import * as React from "react";

export function GoalsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <circle cx="60" cy="60" r="40" fill="white" />
      <circle cx="60" cy="60" r="25" fill="#2D4696" />
      <circle cx="60" cy="60" r="10" fill="white" />
    </svg>
  );
}
