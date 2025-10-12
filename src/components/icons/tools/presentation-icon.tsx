
import * as React from "react";

export function PresentationIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="presentation-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E2DE2" />
          <stop offset="100%" stopColor="#4A00E0" />
        </linearGradient>
      </defs>
      <rect x="10" y="20" width="100" height="70" rx="8" fill="url(#presentation-grad)" />
      <path d="M 50 90 L 50 110 L 70 110 L 70 90" fill="#E5E7EB" />
      <rect x="58" y="110" width="4" height="5" fill="#E5E7EB" />
      <path d="M25 35 L 50 50 L 25 65 Z" fill="white" opacity="0.8"/>
      <rect x="60" y="45" width="35" height="6" rx="3" fill="white" opacity="0.8" />
      <rect x="60" y="60" width="30" height="5" rx="2.5" fill="white" opacity="0.6" />
    </svg>
  );
}
