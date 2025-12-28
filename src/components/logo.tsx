'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="20" fill="#2A2F7F" />
      <path
        d="M69.9576 30.6271C71.3533 29.2314 73.5358 29.2314 74.9315 30.6271C76.3272 32.0228 76.3272 34.2053 74.9315 35.601L46.7323 63.8002C45.3366 65.1959 43.1541 65.1959 41.7584 63.8002L25.0685 47.1103C23.6728 45.7146 23.6728 43.5321 25.0685 42.1364C26.4642 40.7407 28.6467 40.7407 30.0424 42.1364L44.2453 56.3393L69.9576 30.6271Z"
        fill="white"
      />
      <path
        d="M33.9167 63.875C33.9167 63.875 48.2917 73.2917 64.9167 60.7083"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
