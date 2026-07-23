type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/** Premium vector AI mascot. It stays sharp at every widget size and blinks in CSS. */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  const shellId = `ai-shell-${size}`;
  const faceId = `ai-face-${size}`;
  const blueId = `ai-blue-${size}`;
  const glowId = `ai-glow-${size}`;

  return (
    <span className={`bl bl--${size} ai-assistant-mascot`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <defs>
          <linearGradient id={shellId} x1="7" y1="5" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1B2433" />
            <stop offset="1" stopColor="#070A10" />
          </linearGradient>
          <linearGradient id={faceId} x1="14" y1="14" x2="35" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#15376D" />
            <stop offset="0.52" stopColor="#0B1628" />
            <stop offset="1" stopColor="#080B12" />
          </linearGradient>
          <linearGradient id={blueId} x1="12" y1="11" x2="38" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#75B8FF" />
            <stop offset="0.5" stopColor="#3478F6" />
            <stop offset="1" stopColor="#1F55C9" />
          </linearGradient>
          <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M12.8 6.7h22.4c5.4 0 8.7 3.25 8.7 8.65v12.1c0 5.4-3.3 8.65-8.7 8.65H25.1l-9.25 6.15v-6.4C9.1 35.4 5.1 31.85 5.1 26.6V15.35c0-5.4 3.3-8.65 7.7-8.65Z"
          fill={`url(#${shellId})`}
          stroke="rgba(247,249,252,.72)"
          strokeWidth="1.35"
        />
        <path
          d="M14.1 11.4h19.8c4.75 0 7.45 2.75 7.45 7.45v7.1c0 4.7-2.7 7.45-7.45 7.45H14.1c-4.75 0-7.45-2.75-7.45-7.45v-7.1c0-4.7 2.7-7.45 7.45-7.45Z"
          fill={`url(#${faceId})`}
          stroke={`url(#${blueId})`}
          strokeWidth="1.8"
        />
        <path
          d="M12.2 15.25c2.5-1.45 5.15-2.05 8.1-2.05h7.7"
          stroke="#FFFFFF"
          strokeOpacity=".3"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <g className="ai-assistant-mascot__eyes" fill="#75B8FF" filter={`url(#${glowId})`}>
          <rect x="14" y="20" width="6.3" height="4.6" rx="2.3" />
          <rect x="27.7" y="20" width="6.3" height="4.6" rx="2.3" />
        </g>
        <g className="ai-assistant-mascot__eyelids" fill="#0A101B">
          <rect x="13.65" y="19.65" width="7" height="5.3" rx="2.6" />
          <rect x="27.35" y="19.65" width="7" height="5.3" rx="2.6" />
        </g>
        <path
          d="M18.1 27.85c1.55 1.25 3.52 1.88 5.9 1.88 2.38 0 4.35-.63 5.9-1.88"
          stroke="#F7F9FC"
          strokeWidth="1.55"
          strokeLinecap="round"
        />
        <path d="M24 6.7V4.2" stroke="#3478F6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="2.9" r="2.15" fill={`url(#${blueId})`} filter={`url(#${glowId})`} />
        <circle cx="7.2" cy="22.35" r="1.45" fill="#3478F6" />
        <circle cx="40.8" cy="22.35" r="1.45" fill="#3478F6" />
      </svg>
    </span>
  );
}
