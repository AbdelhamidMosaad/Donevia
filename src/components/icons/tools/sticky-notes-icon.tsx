
import * as React from "react";

export function StickyNotesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sticky-notes-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
        <filter id="sticky-notes-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#sticky-notes-shadow)">
        <rect x="25" y="25" width="70" height="70" rx="8" fill="url(#sticky-notes-grad)" />
        <path d="M 25 85 L 35 95 L 95 35 L 85 25 Z" fill="black" opacity="0.1" />
        <rect x="40" y="40" width="40" height="5" rx="2.5" fill="white" opacity="0.8" />
        <rect x="40" y="55" width="40" height="4" rx="2" fill="white" opacity="0.6" />
        <rect x="40" y="68" width="25" height="4" rx="2" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
}
