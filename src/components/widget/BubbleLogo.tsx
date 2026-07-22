type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/** The same robot-in-a-bubble mark used by the portfolio navigation. */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path d="M24 7V4.5" stroke="#3478f6" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="3" r="2.6" fill="#3478f6" />
        <path
          d="M14 6.5h20c6.2 0 10 3.8 10 10V27c0 6.2-3.8 10-10 10h-9.5L15 44.5V37C8.1 36.5 4 32.8 4 26.5v-10c0-6.2 3.8-10 10-10Z"
          fill="#f7f9fc"
        />
        <rect x="9" y="13" width="30" height="19" rx="9.5" fill="#3478f6" />
        <path
          d="M14 16.8c2.1-1.5 4.6-2.2 7.5-2.2h5.8"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <ellipse cx="18" cy="22" rx="2.3" ry="2.7" fill="#050609" />
        <ellipse cx="30" cy="22" rx="2.3" ry="2.7" fill="#050609" />
        <circle cx="18.8" cy="21" r="0.7" fill="#ffffff" />
        <circle cx="30.8" cy="21" r="0.7" fill="#ffffff" />
        <path
          d="M18 27c1.6 1.2 3.6 1.8 6 1.8s4.4-.6 6-1.8"
          stroke="#050609"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="8.6" cy="22.5" r="1.6" fill="#3478f6" />
        <circle cx="39.4" cy="22.5" r="1.6" fill="#3478f6" />
      </svg>
    </span>
  );
}
