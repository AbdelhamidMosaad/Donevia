import * as React from 'react';

export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="22" fill="#2A2F7F" />
      <path
        d="M28.75 48.75C28.75 47.3693 29.8693 46.25 31.25 46.25H42.5C43.8807 46.25 45 47.3693 45 48.75V57.5C45 58.8807 43.8807 60 42.5 60H31.25C29.8693 60 28.75 58.8807 28.75 57.5V48.75Z"
        transform="rotate(45 43.15 48.15)"
        fill="white"
      />
      <path
        d="M78.75 28.75C79.4404 28.75 80 29.3096 80 30V63.75C80 64.4404 79.4404 65 78.75 65H66.25C65.5596 65 65 64.4404 65 63.75V30C65 29.3096 65.5596 28.75 66.25 28.75H78.75Z"
        transform="rotate(45 61.3 54.3)"
        fill="white"
      />
      <path
        d="M36 65 C 50 82, 60 82, 74 65"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
