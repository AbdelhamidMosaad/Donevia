
import * as React from "react";

export function FlashcardsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="flashcards-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a00f4" />
          <stop offset="100%" stopColor="#9d4edd" />
        </linearGradient>
        <linearGradient id="flashcards-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8338ec" />
          <stop offset="100%" stopColor="#b5179e" />
        </linearGradient>
        <filter id="flashcards-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dy="2" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#flashcards-shadow)">
        <rect
          x="30"
          y="25"
          width="70"
          height="85"
          rx="10"
          transform="rotate(10 65 67.5)"
          fill="url(#flashcards-grad1)"
        />
        <rect
          x="20"
          y="20"
          width="70"
          height="85"
          rx="10"
          transform="rotate(-5 55 62.5)"
          fill="url(#flashcards-grad2)"
        />
        <rect x="25" y="45" width="60" height="6" rx="3" fill="white" transform="rotate(-5 55 48)" />
        <rect x="25" y="60" width="40" height="5" rx="2.5" fill="white" opacity="0.8" transform="rotate(-5 45 62.5)" />
      </g>
    </svg>
  );
}
