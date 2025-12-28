
import * as React from "react";

export function JournalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="journal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="journal-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset in="blur" dy="3" result="offsetBlur" />
          <feFlood floodColor="#2A2F7F" floodOpacity="0.4" result="flood" />
          <feComposite in="flood" in2="offsetBlur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#journal-shadow)">
        <rect x="15" y="10" width="90" height="100" rx="8" fill="url(#journal-grad)" />
        <rect x="22" y="10" width="8" height="100" fill="black" opacity="0.15" />
        <rect x="40" y="25" width="60" height="5" rx="2.5" fill="white" opacity="0.8" />
        <rect x="40" y="40" width="60" height="5" rx="2.5" fill="white" opacity="0.7" />
        <rect x="40" y="55" width="45" height="5" rx="2.5" fill="white" opacity="0.6" />
        <path d="M15 95 h 90" stroke="white" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
      </g>
    </svg>
  );
}
