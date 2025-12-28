
import * as React from "react";

export function EnglishCoachIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="english-coach-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="english-coach-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#english-coach-shadow)">
        <path d="M20 25 h80 a5 5 0 0 1 5 5 v70 a5 5 0 0 1 -5 5 h-80 a5 5 0 0 1 -5 -5 v-70 a5 5 0 0 1 5 -5" fill="url(#english-coach-grad)" />
        <path d="M 60 40 L 45 75 L 75 75 Z" fill="none" stroke="white" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M 50 65 h 20" stroke="white" strokeWidth="6" />
      </g>
    </svg>
  );
}
