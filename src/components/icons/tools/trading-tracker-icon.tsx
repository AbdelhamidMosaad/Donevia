
import * as React from "react";

export function TradingTrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trading-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="trading-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#trading-shadow)">
        <rect x="15" y="15" width="90" height="90" rx="12" fill="url(#trading-grad)" />
        <path d="M30 80 L 50 60 L 70 75 L 90 40" stroke="white" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M 75 40 L 90 40 L 90 55" stroke="white" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
}
