
import * as React from "react";

export function CreateWithAiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="create-ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E2DE2" />
          <stop offset="100%" stopColor="#4A00E0" />
        </linearGradient>
      </defs>
      <path
        d="M60 10 C 90 10, 110 30, 110 60 C 110 90, 90 110, 60 110 C 30 110, 10 90, 10 60 C 10 30, 30 10, 60 10 Z"
        fill="url(#create-ai-grad)"
      />
      <path
        d="M45 40 L 75 40 M 45 50 L 75 50 M 45 60 L 60 60"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M50 75 L 60 85 L 70 75"
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
       <path
        d="M60 70 V 85"
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M75 35 L 80 30 L 85 35 M 80 30 L 80 40"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}
