
import * as React from "react";

export function JournalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="journal-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c19a6b" />
          <stop offset="100%" stopColor="#8c5e3c" />
        </linearGradient>
        <filter id="journal-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dy="3" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#journal-shadow)">
        <rect x="15" y="10" width="90" height="100" rx="8" fill="url(#journal-grad1)" />
        <rect x="22" y="10" width="8" height="100" fill="#a47a4a" />
        <rect x="40" y="25" width="60" height="5" rx="2.5" fill="white" opacity="0.6" />
        <rect x="40" y="40" width="60" height="5" rx="2.5" fill="white" opacity="0.6" />
        <rect x="40" y="55" width="40" height="5" rx="2.5" fill="white" opacity="0.6" />
        <path d="M15 95 h 90" stroke="white" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
      </g>
    </svg>
  );
}
