
import * as React from "react";

export function HabitsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M 60,30 A 30,30 0 0 1 86,47" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M 86,47 L 95,38" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 60,30 A 30,30 0 1 0 34,47" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M 34,47 L 25,38" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 45 60 L 55 70 L 75 50" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
