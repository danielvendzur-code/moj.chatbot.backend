type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/** Original vector AI mascot. Crisp at every size, friendly and animated without relying on raster art. */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  const shellId = `ai-shell-${size}`;
  const faceId = `ai-face-${size}`;
  const blueId = `ai-blue-${size}`;
  const glowId = `ai-glow-${size}`;

  return (
    <span className={`bl bl--${size} ai-assistant-mascot`} aria-hidden="true">
      <svg viewBox="0 0 56 56" focusable="false">
        <defs>
          <linearGradient id={shellId} x1="8" y1="5" x2="47" y2="51" gradientUnits="userSpaceOnUse">
            <stop stopColor="#27344A" />
            <stop offset="0.48" stopColor="#111927" />
            <stop offset="1" stopColor="#06080D" />
          </linearGradient>
          <linearGradient id={faceId} x1="14" y1="15" x2="42" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#163E7B" />
            <stop offset="0.5" stopColor="#0B1A32" />
            <stop offset="1" stopColor="#070B13" />
          </linearGradient>
          <linearGradient id={blueId} x1="13" y1="9" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9BD6FF" />
            <stop offset="0.42" stopColor="#4A91FF" />
            <stop offset="1" stopColor="#245ED6" />
          </linearGradient>
          <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="1.7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="ai-assistant-mascot__antenna"
          d="M28 9.4V5.7"
          stroke={`url(#${blueId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="28" cy="3.8" r="2.65" fill={`url(#${blueId})`} filter={`url(#${glowId})`} />

        <path
          className="ai-assistant-mascot__shell"
          d="M13.2 9.2h29.6c5.7 0 9.2 3.6 9.2 9.4v17.1c0 5.8-3.5 9.4-9.2 9.4H31.7l-10.4 6.8v-6.95c-10.8-.65-17.3-4.75-17.3-12.6V18.6c0-5.8 3.5-9.4 9.2-9.4Z"
          fill={`url(#${shellId})`}
          stroke="rgba(231,242,255,.76)"
          strokeWidth="1.45"
        />

        <path
          className="ai-assistant-mascot__face"
          d="M14.6 14.1h26.8c4.85 0 7.65 2.9 7.65 7.8v8.95c0 4.9-2.8 7.8-7.65 7.8H14.6c-4.85 0-7.65-2.9-7.65-7.8V21.9c0-4.9 2.8-7.8 7.65-7.8Z"
          fill={`url(#${faceId})`}
          stroke={`url(#${blueId})`}
          strokeWidth="2"
        />

        <path
          d="M12.2 18.3c3.45-2.15 7.25-3.05 11.5-3.05h8.5"
          stroke="#FFFFFF"
          strokeOpacity=".34"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        <g className="ai-assistant-mascot__eyes" fill="#8ED0FF" filter={`url(#${glowId})`}>
          <ellipse cx="19.15" cy="26.25" rx="3.15" ry="3.45" />
          <ellipse cx="36.85" cy="26.25" rx="3.15" ry="3.45" />
        </g>
        <g className="ai-assistant-mascot__eye-shine" fill="#FFFFFF">
          <circle cx="20.15" cy="25.05" r="0.78" />
          <circle cx="37.85" cy="25.05" r="0.78" />
        </g>
        <g className="ai-assistant-mascot__eyelids" fill="#0A1324">
          <ellipse cx="19.15" cy="26.25" rx="3.5" ry="3.78" />
          <ellipse cx="36.85" cy="26.25" rx="3.5" ry="3.78" />
        </g>

        <path
          className="ai-assistant-mascot__smile"
          d="M21.2 32.3c1.8 1.65 4.05 2.48 6.8 2.48s5-.83 6.8-2.48"
          stroke="#F7FAFF"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        <circle cx="7.5" cy="27" r="1.65" fill={`url(#${blueId})`} />
        <circle cx="48.5" cy="27" r="1.65" fill={`url(#${blueId})`} />
      </svg>
    </span>
  );
}
