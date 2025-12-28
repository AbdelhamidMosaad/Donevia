
import * as React from "react";

export function StudyTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M 30 80 L 60 50 L 90 80" stroke="white" strokeWidth="8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M 30 60 L 60 30 L 90 60" stroke="white" strokeWidth="8" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
