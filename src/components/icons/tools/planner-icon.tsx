
import * as React from "react";

export function PlannerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="100" height="100" rx="20" fill="#2D4696" />
      <rect x="20" y="25" width="80" height="70" rx="12" fill="white" />
      <rect x="20" y="25" width="80" height="15" rx="12" ry="12" fill="#2D4696" fillOpacity="0.8" />
      <circle cx="32" cy="32.5" r="4" fill="white" />
      <circle cx="45" cy="32.5" r="4" fill="white" />
      <rect x="30" y="50" width="18" height="13" rx="3" fill="#2D4696" />
      <rect x="52" y="50" width="38" height="13" rx="3" fill="#2D4696" opacity="0.3" />
      <rect x="30" y="68" width="60" height="13" rx="3" fill="#2D4696" opacity="0.3" />
    </svg>
  );
}
