import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    // I will replace the content below with the exact SVG code you provide.
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="20" fill="#2A2F7F" />
      <path
        d="M30 52.5L45 67.5L75 37.5"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
