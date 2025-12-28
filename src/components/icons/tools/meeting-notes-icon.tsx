
import * as React from "react";

export function MeetingNotesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="25" y="20" width="70" height="80" rx="10" fill="white" />
      <path d="M40 35 h40 M40 50 h40 M40 65 h25" stroke="#2D4696" strokeWidth="5" strokeLinecap="round" />
      <circle cx="45" cy="80" r="6" fill="#2D4696" />
      <circle cx="60" cy="80" r="6" fill="#2D4696" opacity="0.7" />
      <circle cx="75" cy="80" r="6" fill="#2D4696" opacity="0.7" />
    </svg>
  );
}
