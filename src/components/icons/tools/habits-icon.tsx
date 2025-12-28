
import * as React from "react";

export function HabitsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="habits-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="habits-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#habits-shadow)">
        <path d="M 60,20 A 40,40 0 0 1 95.3,44.7" stroke="url(#habits-grad)" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 95.3,44.7 L 105,35" stroke="url(#habits-grad)" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 60,20 A 40,40 0 1 0 24.7,44.7" stroke="url(#habits-grad)" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 24.7,44.7 L 15,35" stroke="url(#habits-grad)" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 45 60 L 55 70 L 75 50" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
