
import * as React from "react";

export function MeetingNotesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="meeting-notes-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="meeting-notes-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#meeting-notes-shadow)">
        <rect x="20" y="15" width="80" height="90" rx="10" fill="url(#meeting-notes-grad)" />
        <path d="M40 30 h40 M40 45 h40 M40 60 h25" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <circle cx="45" cy="80" r="6" fill="white" />
        <circle cx="60" cy="80" r="6" fill="white" opacity="0.7" />
        <circle cx="75" cy="80" r="6" fill="white" opacity="0.7" />
      </g>
    </svg>
  );
}
