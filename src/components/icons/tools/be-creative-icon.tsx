
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
          <stop offset="0%" stopColor="#2A2F7F" />
          <stop offset="100%" stopColor="#3CE8A4" />
        </linearGradient>
        <filter id="be-creative-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#be-creative-shadow)">
        <path d="M60,15 C40,15 25,35 25,55 C25,70 35,85 47,93 L50,80 C40,75 35,65 35,55 C35,40 45,25 60,25 C75,25 85,40 85,55 C85,65 80,75 70,80 L73,93 C85,85 95,70 95,55 C95,35 80,15 60,15Z" fill="url(#be-creative-grad)" />
        <rect x="55" y="90" width="10" height="15" rx="3" fill="#2A2F7F"/>
        <path d="M50 85 h20" stroke="#3CE8A4" strokeWidth="3" />
        <path d="M45 45 l5 -5 M75 45 l-5 -5 M60 30 l0 -5" stroke="#3CE8A4" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
