import * as React from "react";

export function MindMapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mindmap-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f72585" />
          <stop offset="100%" stopColor="#c77dff" />
        </linearGradient>
        <filter id="mindmap-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#mindmap-shadow)">
        <circle cx="60" cy="60" r="18" fill="url(#mindmap-grad1)" />
        <circle cx="25" cy="35" r="12" fill="url(#mindmap-grad1)" />
        <circle cx="95" cy="35" r="12" fill="url(#mindmap-grad1)" />
        <circle cx="25" cy="85" r="12" fill="url(#mindmap-grad1)" />
        <circle cx="95" cy="85" r="12" fill="url(#mindmap-grad1)" />
        <path
          d="M45 50 L35 42 M75 50 L85 42 M45 70 L35 78 M75 70 L85 78"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.4"
        />
        <circle cx="60" cy="60" r="12" fill="white" />
      </g>
    </svg>
  );
}
