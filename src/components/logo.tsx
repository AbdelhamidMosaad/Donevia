
import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
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
      <rect width="24" height="24" rx="6" fill="#2A2F7F"/>
      <path d="M7.65186 12.3182L10.5185 15.1849L17.6852 8.01825" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.6852 10.3516C15.9185 12.0183 13.0519 14.2183 10.5185 15.1849" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
