
import * as React from "react";

export function BeCreativeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="be-creative-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E2DE2" />
          <stop offset="100%" stopColor="#4A00E0" />
        </linearGradient>
        <filter id="be-creative-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dy="4" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#be-creative-shadow)">
        <path d="M60,10 C90,10 110,30 110,60 C110,90 90,110 60,110 C30,110 10,90 10,60 C10,30 30,10 60,10 Z" fill="url(#be-creative-grad)" />
        <path d="M60,30 a30,30 0 1,0 0.001,0" fill="none" stroke="white" strokeWidth="5"/>
        <path d="M60,40 Q75,50 60,60 Q45,70 60,80" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="30" r="5" fill="white" />
        <circle cx="60" cy="90" r="5" fill="white" />
      </g>
    </svg>
  );
}
