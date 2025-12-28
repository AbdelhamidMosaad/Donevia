import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="22" fill="#2A2F7F" />
      <path
        d="M69.916 31.9546L43.433 58.4376L30.15 45.1546C28.933 43.9376 27.017 43.9376 25.8 45.1546C24.583 46.3716 24.583 48.2876 25.8 49.5046L41.25 64.9546C42.467 66.1716 44.383 66.1716 45.6 64.9546L74.25 36.3046C75.467 35.0876 75.467 33.1716 74.25 31.9546C73.033 30.7376 71.116 30.7376 69.916 31.9546Z"
        fill="white"
      />
      <path
        d="M32.5 58.25C37.5 55.75 52.5 53.75 70 60.75"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
