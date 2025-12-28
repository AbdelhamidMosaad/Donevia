
import * as React from "react";

export function TradingTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trading-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#43D4C4" />
          <stop offset="100%" stopColor="#8E2DE2" />
        </linearGradient>
        <filter id="trading-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#trading-shadow)">
        <rect x="15" y="15" width="90" height="90" rx="12" fill="url(#trading-grad1)" />
        <path d="M30 80 L 50 60 L 70 75 L 90 40" stroke="white" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M 75 40 L 90 40 L 90 55" stroke="white" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="25" y="25" width="70" height="70" rx="8" fill="white" opacity="0.1" />
      </g>
    </svg>
  );
}
