import * as React from "react";

export function CVBuilderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="25" y="20" width="70" height="80" rx="10" fill="white" />
      <circle cx="60" cy="40" r="8" fill="#2D4696" />
      <rect x="40" y="55" width="40" height="5" rx="2.5" fill="#2D4696" />
      <rect x="40" y="65" width="40" height="5" rx="2.5" fill="#2D4696" opacity="0.7" />
      <rect x="40" y="75" width="25" height="5" rx="2.5" fill="#2D4696" opacity="0.7" />
    </svg>
  );
}
