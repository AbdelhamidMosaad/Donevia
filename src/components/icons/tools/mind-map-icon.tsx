
import * as React from "react";

export function MindMapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mindmap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A00E0" />
          <stop offset="100%" stopColor="#8E2DE2" />
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
        <circle cx="60" cy="60" r="20" fill="url(#mindmap-grad)" />
        <path d="M60 60 L 90 40" stroke="url(#mindmap-grad)" strokeWidth="5" />
        <circle cx="95" cy="35" r="10" fill="white" stroke="url(#mindmap-grad)" strokeWidth="3"/>
        
        <path d="M60 60 L 90 80" stroke="url(#mindmap-grad)" strokeWidth="5" />
        <circle cx="95" cy="85" r="10" fill="white" stroke="url(#mindmap-grad)" strokeWidth="3"/>

        <path d="M60 60 L 30 40" stroke="url(#mindmap-grad)" strokeWidth="5" />
        <circle cx="25" cy="35" r="10" fill="white" stroke="url(#mindmap-grad)" strokeWidth="3"/>

        <path d="M60 60 L 30 80" stroke="url(#mindmap-grad)" strokeWidth="5" />
        <circle cx="25" cy="85" r="10" fill="white" stroke="url(#mindmap-grad)" strokeWidth="3"/>
      </g>
    </svg>
  );
}

