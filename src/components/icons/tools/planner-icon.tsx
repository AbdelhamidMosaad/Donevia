import * as React from "react";

export function PlannerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="planner-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <filter id="planner-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset in="blur" dy="4" result="offsetBlur" />
          <feFlood floodColor="#22c55e" floodOpacity="0.4" result="flood" />
          <feComposite in="flood" in2="offsetBlur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#planner-shadow)">
        <rect x="15" y="20" width="90" height="80" rx="12" fill="url(#planner-grad1)" />
        <rect x="15" y="20" width="90" height="20" rx="12" ry="12" fill="black" fillOpacity="0.2" />
        <circle cx="30" cy="30" r="5" fill="white" opacity="0.5" />
        <circle cx="45" cy="30" r="5" fill="white" opacity="0.5" />
        
        <rect x="30" y="55" width="20" height="15" rx="3" fill="white" opacity="0.8" />
        <rect x="55" y="55" width="35" height="15" rx="3" fill="white" opacity="0.4" />
        <rect x="30" y="75" width="35" height="15" rx="3" fill="white" opacity="0.4" />
        <rect x="70" y="75" width="20" height="15" rx="3" fill="white" opacity="0.8" />
      </g>
    </svg>
  );
}
