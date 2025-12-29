'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/Donevia_newlogo-removebg.png"
      alt="Donevia Logo"
      width={120}
      height={120}
      className={cn(className)}
      priority
    />
  );
}
