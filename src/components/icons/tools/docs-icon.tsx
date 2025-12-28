
import * as React from "react";

export function DocsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="25" y="20" width="70" height="80" rx="10" fill="white" />
      <rect x="35" y="35" width="50" height="6" rx="3" fill="#2D4696" />
      <rect x="35" y="50" width="50" height="4" rx="2" fill="#2D4696" opacity="0.8" />
      <rect x="35" y="60" width="50" height="4" rx="2" fill="#2D4696" opacity="0.8" />
      <rect x="35" y="70" width="30" height="4" rx="2" fill="#2D4696" opacity="0.8" />
    </svg>
  );
}
