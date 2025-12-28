
import * as React from "react";

export function CreateWithAiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="create-ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="create-ai-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#create-ai-shadow)">
        <rect x="20" y="20" width="80" height="80" rx="15" fill="url(#create-ai-grad)"/>
        <path d="M45 40 L 75 40 M 45 50 L 75 50 M 45 60 L 60 60" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 75 L 60 85 L 50 75" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M60 70 V 85" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M75 30 L 80 25 L 85 30 M 80 25 L 80 35" stroke="#3CE8A4" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
