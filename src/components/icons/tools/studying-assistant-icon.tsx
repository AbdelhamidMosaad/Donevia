
import * as React from "react";

export function StudyingAssistantIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="studying-assistant-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="studying-assistant-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#studying-assistant-shadow)">
        <path d="M60 10 L 110 35 V 85 L 60 110 L 10 85 V 35 Z" fill="url(#studying-assistant-grad)" />
        <path d="M45 50 L 75 50 M 45 60 L 75 60 M 45 70 L 65 70" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 40 L 60 30 L 70 40" stroke="#3CE8A4" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
