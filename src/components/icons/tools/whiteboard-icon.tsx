
import * as React from "react";

export function WhiteboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="whiteboard-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#480ca8" />
          <stop offset="100%" stopColor="#560bad" />
        </linearGradient>
        <filter id="whiteboard-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#whiteboard-shadow)">
        <rect x="10" y="15" width="100" height="90" rx="10" fill="url(#whiteboard-grad1)" />
        <rect x="15" y="20" width="90" height="80" rx="8" fill="white" />
        <path d="M30 80 C 50 40, 70 100, 90 50" stroke="#f72585" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
