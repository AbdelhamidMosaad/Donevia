
import * as React from "react";

export function StickyNotesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="25" y="25" width="70" height="70" rx="8" fill="white" transform="rotate(5 60 60)"/>
      <path d="M40 50 L 80 50 M 40 65 L 65 65" stroke="#2D4696" strokeWidth="5" strokeLinecap="round" transform="rotate(5 60 60)"/>
    </svg>
  );
}
