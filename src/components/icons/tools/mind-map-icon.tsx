
import * as React from "react";

export function MindMapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mindmap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
         <filter id="mindmap-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#mindmap-shadow)">
        <circle cx="60" cy="60" r="20" fill="url(#mindmap-grad)" />
        <path d="M60 60 L 90 40" stroke="#2A2F7F" strokeWidth="5" />
        <circle cx="95" cy="35" r="10" fill="white" stroke="#2A2F7F" strokeWidth="3"/>
        <path d="M60 60 L 90 80" stroke="#3CE8A4" strokeWidth="5" />
        <circle cx="95" cy="85" r="10" fill="white" stroke="#3CE8A4" strokeWidth="3"/>
        <path d="M60 60 L 30 60" stroke="#2A2F7F" strokeWidth="5" />
        <circle cx="25" cy="60" r="10" fill="white" stroke="#2A2F7F" strokeWidth="3"/>
      </g>
    </svg>
  );
}
