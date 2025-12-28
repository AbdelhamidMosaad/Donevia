'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Icon Component */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Main Rounded Square Background */}
        <rect x="10" y="10" width="100" height="100" rx="28" fill="#30419B" />
        
        {/* The Checkmark */}
        <path
          d="M38 58L52 72L84 40"
          stroke="white"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* The Swoosh/Curve underneath the check */}
        <path
          d="M34 65C34 65 48 88 88 62"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>

      {/* Donevia Brand Text */}
      <span 
        className="text-[#30419B] font-bold text-4xl tracking-tight" 
        style={{ fontFamily: 'sans-serif' }}
      >
        Donevia
      </span>
    </div>
  );
}