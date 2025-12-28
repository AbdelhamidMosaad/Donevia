
import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="#2A2F7F"/>
      <path d="M7.81818 11.4545L11.4545 15.0909L18 8.54545" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 12.7273C17.1429 13.9299 15.1111 15.6364 12.3636 15.6364C9.61616 15.6364 7 13.974 7 12.1818" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
