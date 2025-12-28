
import * as React from "react";

export function WorkTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="work-tracker-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="work-tracker-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#work-tracker-shadow)">
        <rect x="20" y="25" width="80" height="70" rx="10" fill="url(#work-tracker-grad)" />
        <path d="M 40 20 h 40 v 10 h -40 z" fill="#2A2F7F" />
        <circle cx="60" cy="60" r="20" fill="white" />
        <path d="M60 45 L 60 60 L 75 75" stroke="#333" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
