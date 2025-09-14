import * as React from "react";

export function TasksIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tasks-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8338ec" />
          <stop offset="100%" stopColor="#3a86ff" />
        </linearGradient>
        <filter id="tasks-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#tasks-shadow)">
        <rect x="20" y="20" width="80" height="80" rx="15" fill="url(#tasks-grad1)" />
        <path
          d="M40 50 L 50 60 L 75 35"
          stroke="white"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M40 80 L 75 80" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}
