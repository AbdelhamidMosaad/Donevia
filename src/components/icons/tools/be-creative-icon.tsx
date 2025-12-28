
import * as React from "react";

export function BeCreativeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <path d="M60,30 C40,30 30,45 30,60 C30,75 40,90 55,95 L50,80 C45,75 40,70 40,60 C40,50 50,40 60,40 C70,40 80,50 80,60 C80,70 75,75 70,80 L65,95 C80,90 90,75 90,60 C90,45 80,30 60,30Z" fill="white"/>
      <path d="M50 35 l5 -5 M70 35 l-5 -5 M60 25 l0 -5" stroke="white" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}
