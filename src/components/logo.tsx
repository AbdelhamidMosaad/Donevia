
import * as React from 'react';
import Image from 'next/image';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/donevia_newlogo.png"
      alt="Donevia Logo"
      width={100}
      height={120}
      className={className}
      aria-hidden="true"
    />
  );
}
