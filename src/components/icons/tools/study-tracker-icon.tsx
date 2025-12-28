
import * as React from "react";

export function StudyTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="study-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#43D4C4" />
          <stop offset="100%" stopColor="#8E2DE2" />
        </linearGradient>
        <filter id="study-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dy="4" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#study-shadow)">
        <path
          d="M60 10 L 110 35 L 90 100 L 30 100 L 10 35 Z"
          fill="url(#study-grad1)"
        />
        <path
          d="M60 20 L 100 40 L 85 90 L 35 90 L 20 40 Z"
          fill="white"
          opacity="0.15"
        />
        <path d="M 40 45 L 55 65 L 80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
