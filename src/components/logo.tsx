
import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="20" fill="#2A2F7F" />
      {/* Stylized Checkmark */}
      <path
        d="M30 50 L 45 65 L 75 35"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Swoosh element underneath */}
      <path
        d="M30 70 Q 50 60, 70 70"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
