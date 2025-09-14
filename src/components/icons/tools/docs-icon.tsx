import * as React from "react";

export function DocsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="docs-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#219EBC" />
          <stop offset="100%" stopColor="#8ECAE6" />
        </linearGradient>
        <filter id="docs-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
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
      <g filter="url(#docs-shadow)">
        <rect x="20" y="10" width="80" height="100" rx="10" fill="url(#docs-grad1)" />
        <rect x="35" y="25" width="50" height="6" rx="3" fill="white" />
        <rect x="35" y="40" width="50" height="4" rx="2" fill="white" opacity="0.8" />
        <rect x="35" y="50" width="50" height="4" rx="2" fill="white" opacity="0.8" />
        <rect x="35" y="60" width="30" height="4" rx="2" fill="white" opacity="0.8" />
        <rect x="35" y="75" width="50" height="4" rx="2" fill="white" opacity="0.6" />
        <rect x="35" y="85" width="40" height="4" rx="2" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
}
