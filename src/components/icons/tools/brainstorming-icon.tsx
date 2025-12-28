
import * as React from "react";

export function BrainstormingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="brainstorming-grad1"
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#F72585" />
          <stop offset="100%" stopColor="#7209B7" />
        </radialGradient>
        <filter id="brainstorming-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feOffset in="blur" dy="4" result="offsetBlur" />
          <feFlood floodColor="#B5179E" floodOpacity="0.5" result="flood" />
          <feComposite in="flood" in2="offsetBlur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#brainstorming-shadow)">
        <path
          d="M60 10 C 30 10, 10 35, 10 60 C 10 80, 25 100, 45 108 L 40 95 C 45 98, 50 100, 55 100 L 55 110 L 65 110 L 65 100 C 70 100, 75 98, 80 95 L 75 108 C 95 100, 110 80, 110 60 C 110 35, 90 10, 60 10 Z"
          fill="url(#brainstorming-grad1)"
        />
        <circle cx="60" cy="60" r="30" fill="white" opacity="0.1" />
        <path
          d="M60 40 L 50 55 L 70 55 L 60 40 Z M 60 80 L 50 65 L 70 65 L 60 80 Z M 40 60 L 55 70 L 55 50 L 40 60 Z M 80 60 L 65 70 L 65 50 L 80 60 Z"
          fill="white"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
