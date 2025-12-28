
import * as React from "react";

export function EnglishCoachIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="english-coach-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E2DE2" />
          <stop offset="100%" stopColor="#4A00E0" />
        </linearGradient>
        <filter id="english-coach-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#english-coach-shadow)">
        <path
          d="M20 30 Q 60 10, 100 30 L 100 80 Q 60 110, 20 80 Z"
          fill="url(#english-coach-grad1)"
        />
        <text
          x="60"
          y="68"
          fontFamily="Arial, sans-serif"
          fontSize="48"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          A
        </text>
        <path d="M20 30 Q 60 10, 100 30 L 100 40 Q 60 20, 20 40 Z" fill="white" opacity="0.3" />
      </g>
    </svg>
  );
}
