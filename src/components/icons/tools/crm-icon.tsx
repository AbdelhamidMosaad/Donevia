import * as React from "react";

export function CrmIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="crm-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffb703" />
          <stop offset="100%" stopColor="#fb8500" />
        </linearGradient>
        <filter id="crm-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#crm-shadow)">
        <path
          d="M20 35 h80 a10 10 0 0 1 10 10 v50 a10 10 0 0 1 -10 10 h-80 a10 10 0 0 1 -10 -10 v-50 a10 10 0 0 1 10 -10"
          fill="url(#crm-grad1)"
        />
        <path d="M40 25 h40 a5 5 0 0 1 5 5 v5 h-50 v-5 a5 5 0 0 1 5 -5" fill="#e5e5e5" />
        <rect x="25" y="45" width="70" height="40" rx="5" fill="white" opacity="0.3" />
        <circle cx="40" cy="65" r="8" fill="white" />
        <rect x="55" y="60" width="30" height="4" rx="2" fill="white" />
        <rect x="55" y="70" width="20" height="4" rx="2" fill="white" />
      </g>
    </svg>
  );
}
