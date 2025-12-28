
import * as React from "react";

export function DocsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
       <defs>
        <linearGradient id="docs-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="docs-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#docs-shadow)">
        <rect x="20" y="15" width="80" height="90" rx="10" fill="url(#docs-grad)" />
        <rect x="35" y="30" width="50" height="6" rx="3" fill="white" />
        <rect x="35" y="45" width="50" height="4" rx="2" fill="white" opacity="0.8" />
        <rect x="35" y="55" width="50" height="4" rx="2" fill="white" opacity="0.8" />
        <rect x="35" y="65" width="30" height="4" rx="2" fill="white" opacity="0.8" />
        <rect x="35" y="80" width="50" height="4" rx="2" fill="white" opacity="0.6" />
        <rect x="35" y="90" width="40" height="4" rx="2" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
}
