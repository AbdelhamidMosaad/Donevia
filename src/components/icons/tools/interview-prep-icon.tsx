
import * as React from "react";

export function InterviewPrepIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="interview-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="100%" stopColor="#50E3C2" />
        </linearGradient>
        <filter id="interview-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#interview-shadow)">
        <path d="M20 25 h80 a5 5 0 0 1 5 5 v70 a5 5 0 0 1 -5 5 h-80 a5 5 0 0 1 -5 -5 v-70 a5 5 0 0 1 5 -5" fill="url(#interview-grad1)" />
        <circle cx="60" cy="45" r="12" fill="white" />
        <path d="M40 95 C 40 75, 80 75, 80 95 Z" fill="white" />
        <path d="M35 60 h50 M35 70 h50" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}
