
import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="120" height="120" rx="30" fill="#2A2F7F"/>
      <path d="M40.3361 58.8361L54.1722 72.6721L84.8361 42" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M36 80C50.2857 88.2857 74.8 -1.99999 104 26" stroke="#3CE8A4" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}
