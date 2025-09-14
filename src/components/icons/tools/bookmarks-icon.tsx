import * as React from "react";

export function BookmarksIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bookmarks-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4361EE" />
          <stop offset="100%" stopColor="#3A0CA3" />
        </linearGradient>
        <filter id="bookmarks-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dy="2" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#bookmarks-shadow)">
        <path
          d="M95 110 V 25 C 95 16.7 88.3 10 80 10 H 40 C 31.7 10 25 16.7 25 25 V 110 L 60 85 L 95 110 Z"
          fill="url(#bookmarks-grad1)"
        />
        <path
          d="M95 110 V 25 C 95 16.7 88.3 10 80 10 H 40 C 31.7 10 25 16.7 25 25 V 110 L 60 85 L 95 110 Z"
          fill="black"
          fillOpacity="0.1"
          style={{ mixBlendMode: "multiply" }}
        />
        <path
          d="M60 85 L 25 110 L 25 25 C 25 19.477 29.477 15 35 15 H 80 C 85.523 15 90 19.477 90 25 V 110 L 60 85 Z"
          fill="white"
          fillOpacity="0.2"
        />
      </g>
    </svg>
  );
}
