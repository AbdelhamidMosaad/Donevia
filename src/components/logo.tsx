
export function DoneviaLogo({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A00E0" />
          <stop offset="50%" stopColor="#8E2DE2" />
          <stop offset="100%" stopColor="#43D4C4" />
        </linearGradient>
      </defs>
      <g clipPath="url(#clip0_1_2)">
        <path
          d="M20 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V4C21 3.44772 20.5523 3 20 3Z"
          fill="url(#logoGradient)"
        />
        <g filter="url(#filter0_d_1_2)">
          <path
            d="M6.66663 12.8704L9.91663 16.1204L17.0104 9.02609"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d_1_2"
          x="2.91663"
          y="5.27609"
          width="17.8438"
          height="14.5942"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="0" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_2"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_2"
            result="shape"
          />
        </filter>
        <clipPath id="clip0_1_2">
          <rect width="24" height="24" rx="6" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
