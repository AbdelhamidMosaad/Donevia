import * as React from "react";

export function LectureNotesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M 30 20 L 90 20 L 90 100 L 30 100 Z" fill="white" />
      <path d="M 30 35 L 90 35 M 40 50 L 80 50 M 40 65 L 80 65 M 40 80 L 60 80" stroke="#2D4696" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
