
import * as React from "react";

export function WorkTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="work-tracker-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#43D4C4" />
          <stop offset="100%" stopColor="#3A0CA3" />
        </linearGradient>
        <filter id="work-tracker-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#work-tracker-shadow)">
        <rect x="20" y="25" width="80" height="70" rx="10" fill="url(#work-tracker-grad1)" />
        <path d="M 40 20 h 40 v 10 h -40 z" fill="#333" />
        <circle cx="60" cy="60" r="20" fill="white" />
        <path d="M60 45 L 60 60 L 75 75" stroke="#333" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M20 35 h 80" stroke="white" strokeWidth="2" strokeDasharray="5 5" opacity="0.5"/>
      </g>
    </svg>
  );
}
