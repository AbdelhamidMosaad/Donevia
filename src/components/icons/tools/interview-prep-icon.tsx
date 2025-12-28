
import * as React from "react";

export function InterviewPrepIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="30" y="25" width="60" height="70" rx="10" fill="white" />
      <circle cx="60" cy="45" r="10" fill="#2D4696" />
      <path d="M45 85 C 45 65, 75 65, 75 85 Z" fill="#2D4696" />
    </svg>
  );
}
