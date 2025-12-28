
import * as React from "react";

export function MeetingNotesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="meeting-notes-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4361EE" />
          <stop offset="100%" stopColor="#3A0CA3" />
        </linearGradient>
        <filter id="meeting-notes-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dy="3" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#meeting-notes-shadow)">
        <rect x="20" y="15" width="80" height="90" rx="10" fill="url(#meeting-notes-grad1)" />
        <path d="M40 30 h40 M40 45 h40 M40 60 h20" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <circle cx="45" cy="80" r="4" fill="white" />
        <circle cx="60" cy="80" r="4" fill="white" />
        <circle cx="75" cy="80" r="4" fill="white" />
        <rect x="20" y="15" width="80" height="15" rx="5" fill="black" opacity="0.1" />
      </g>
    </svg>
  );
}
