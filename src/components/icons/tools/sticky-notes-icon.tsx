
import * as React from "react";

export function StickyNotesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sticky-notes-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#fca311" />
        </linearGradient>
        <filter id="sticky-notes-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dy="3" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#sticky-notes-shadow)">
        <rect x="25" y="25" width="70" height="70" rx="8" fill="url(#sticky-notes-grad1)" />
        <path d="M 25 85 L 35 95 L 95 35 L 85 25 Z" fill="#000" opacity="0.1" />
        <rect x="40" y="40" width="40" height="5" rx="2.5" fill="white" opacity="0.8" />
        <rect x="40" y="55" width="40" height="4" rx="2" fill="white" opacity="0.6" />
        <rect x="40" y="68" width="25" height="4" rx="2" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
}
