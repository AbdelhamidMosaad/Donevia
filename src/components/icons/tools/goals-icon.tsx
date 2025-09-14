import * as React from "react";

export function GoalsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="goals-grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#e63946" />
          <stop offset="100%" stopColor="#d62828" />
        </radialGradient>
        <filter id="goals-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#goals-shadow)">
        <circle cx="60" cy="60" r="50" fill="url(#goals-grad1)" />
        <circle cx="60" cy="60" r="35" fill="white" />
        <circle cx="60" cy="60" r="20" fill="url(#goals-grad1)" />
        <circle cx="60" cy="60" r="8" fill="white" />
      </g>
    </svg>
  );
}
