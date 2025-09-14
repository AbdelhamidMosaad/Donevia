import * as React from "react";

export function HabitsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="habits-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a9d8f" />
          <stop offset="100%" stopColor="#264653" />
        </linearGradient>
        <filter id="habits-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset in="blur" dy="3" result="offsetBlur" />
          <feFlood floodColor="#2a9d8f" floodOpacity="0.5" result="flood" />
          <feComposite in="flood" in2="offsetBlur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#habits-shadow)">
        <path
          d="M 60,15 A 45,45 0 1 1 15,60 M 60,15 A 45,45 0 1 0 105,60"
          stroke="url(#habits-grad1)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 50 60 L 60 70 L 80 50"
          stroke="white"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M 105 60 L 95 50 L 105 40" stroke="url(#habits-grad1)" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 15 60 L 25 70 L 15 80" stroke="url(#habits-grad1)" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
