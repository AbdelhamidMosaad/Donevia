import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  // Use a static ID to prevent hydration mismatch between server and client
  const logoGradientId = 'logoGradient';

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={logoGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8E2DE2" />
          <stop offset="100%" stopColor="#4A00E0" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="6"
        fill={`url(#${logoGradientId})`}
      />
      <path
        d="M6.66663 12.8704L9.91663 16.1204L17.0104 9.02609"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
