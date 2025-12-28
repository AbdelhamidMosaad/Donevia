'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/donevia_newlogo.png"
      alt="Donevia Logo"
      width={64}
      height={64}
      className={cn(className)}
      aria-hidden="true"
    />
  );
}
