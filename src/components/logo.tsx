
import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M84 10H16C12.6863 10 10 12.6863 10 16V84C10 87.3137 12.6863 90 16 90H84C87.3137 90 90 87.3137 90 84V16C90 12.6863 87.3137 10 84 10Z"
        fill="#2A2F7F"
      />
      <path
        d="M68.5293 31.3418C69.9195 29.9516 72.1583 29.9516 73.5485 31.3418L79.1354 36.9287C80.8524 38.6457 79.781 41.5 77.5869 41.5H62.4131C60.219 41.5 59.1476 38.6457 60.8646 36.9287L68.5293 31.3418Z"
        transform="translate(0, 10)"
        fill="white"
      />
      <path
        d="M31.3418 56.4707C29.9516 55.0805 29.9516 52.8417 31.3418 51.4515L36.9287 45.8646C38.6457 44.1476 41.5 45.219 41.5 47.4131V62.5869C41.5 64.781 38.6457 65.8524 36.9287 64.1354L31.3418 58.5485V56.4707Z"
        transform="translate(0, 10)"
        fill="white"
      />
      <path
        d="M25 70C25 64.4772 29.4772 60 35 60H65C70.5228 60 75 64.4772 75 70C75 72.7614 72.7614 75 70 75H30C27.2386 75 25 72.7614 25 70Z"
        transform="translate(0, 10)"
        fill="white"
      />
    </svg>
  );
}
