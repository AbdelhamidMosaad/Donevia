
import * as React from "react";

export function WhiteboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="whiteboard-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#2A2F7F" />
        </linearGradient>
         <filter id="whiteboard-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset in="blur" dy="3" result="offsetBlur" />
          <feFlood floodColor="#2A2F7F" floodOpacity="0.4" result="flood" />
          <feComposite in="flood" in2="offsetBlur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#whiteboard-shadow)">
        <rect x="10" y="15" width="100" height="90" rx="10" fill="url(#whiteboard-grad)" />
        <rect x="15" y="20" width="90" height="80" rx="8" fill="white" />
        <path d="M30 80 C 50 40, 70 100, 90 50" stroke="#3CE8A4" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
