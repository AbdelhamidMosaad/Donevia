import * as React from "react";

export function LearningAssistantIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="learning-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ef01a" />
          <stop offset="100%" stopColor="#38b000" />
        </linearGradient>
        <filter id="learning-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#learning-shadow)">
        <path
          d="M60 10 L 110 35 V 85 L 60 110 L 10 85 V 35 Z"
          fill="url(#learning-grad1)"
        />
        <path
          d="M60 25 L 95 42 V 78 L 60 95 L 25 78 V 42 Z"
          fill="white"
          opacity="0.2"
        />
        <path d="M45 50 L 75 50 M 45 60 L 75 60 M 45 70 L 65 70" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
