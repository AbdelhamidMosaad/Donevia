
'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
        <Image
          src="/donevia_newlogo.png"
          alt="Donevia Logo"
          fill
          className="object-contain"
          aria-hidden="true"
        />
    </div>
  );
}
