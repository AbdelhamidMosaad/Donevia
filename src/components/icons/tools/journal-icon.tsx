
import * as React from "react";

export function JournalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="20" y="15" width="80" height="90" rx="8" fill="white" />
      <rect x="25" y="15" width="8" height="90" fill="#2D4696" opacity="0.2" />
      <path d="M45 40 L 85 40 M 45 55 L 85 55 M 45 70 L 70 70" stroke="#2D4696" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
