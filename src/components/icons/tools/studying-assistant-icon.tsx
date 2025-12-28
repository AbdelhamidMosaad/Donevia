
import * as React from "react";

export function StudyingAssistantIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M60 15 L 105 40 V 80 L 60 105 L 15 80 V 40 Z" fill="white" />
      <path d="M45 50 L 75 50 M 45 60 L 75 60 M 45 70 L 65 70" stroke="#2D4696" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 40 L 60 30 L 70 40" stroke="#2D4696" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
