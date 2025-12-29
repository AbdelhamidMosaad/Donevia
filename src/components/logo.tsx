'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M29,10h62c11.08,0,20,8.92,20,20v60c0,11.08-8.92,20-20,20H29c-11.08,0-20-8.92-20-20V30C9,18.92,17.92,10,29,10Z"
        fill="#2D4696"
      />
      <path
        d="M85.11,82.65H49.35V37.35h35.76c9.72,0,17.55,7.83,17.55,17.55v10.2c0,9.72-7.83,17.55-17.55,17.55Z"
        fill="white"
      />
      <path
        d="M71.7,68.85H49.35V51.15H71.7c9.72,0,17.55,7.83,17.55,17.55v-8.85c0-4.86-3.91-8.7-8.7-8.7H49.35"
        fill="#2D4696"
      />
    </svg>
  );
}
