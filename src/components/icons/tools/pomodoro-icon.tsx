import * as React from "react";

export function PomodoroIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pomodoro-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef476f" />
          <stop offset="100%" stopColor="#d62828" />
        </linearGradient>
        <filter id="pomodoro-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dy="4" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#pomodoro-shadow)">
        <circle cx="60" cy="65" r="45" fill="url(#pomodoro-grad1)" />
        <path d="M45 25 L 75 25 L 70 15 L 50 15 Z" fill="#333" />
        <rect x="57" y="10" width="6" height="5" fill="#555" />
        <path d="M 60 20 A 40 40 0 0 0 60 100 A 40 40 0 0 0 60 20" fill="white" opacity="0.8" />
        <path d="M 60 65 L 60 30" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        <path d="M 60 65 L 85 65" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
