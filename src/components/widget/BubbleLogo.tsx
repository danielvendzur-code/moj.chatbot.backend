type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/** The same precise robot-in-a-bubble mark used by the portfolio navigation. */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path
          d="M24 7V4.8"
          stroke="#3478f6"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="24" cy="3.2" r="2.35" fill="#3478f6" />
        <path
          d="M13.2 7.2h21.6c5.7 0 9 3.4 9 9v10.9c0 5.6-3.3 9-9 9h-10l-9.1 7.1v-7.4c-7-.4-11.5-3.9-11.5-9.7V16.2c0-5.6 3.3-9 9-9Z"
          fill="#090c12"
          stroke="rgba(247,249,252,.72)"
          strokeWidth="1.7"
        />
        <rect
          x="9.5"
          y="12.3"
          width="29"
          height="18.8"
          rx="8"
          fill="#0d1119"
          stroke="#3478f6"
          strokeWidth="2"
        />
        <path
          d="M13.5 15.8h9.2"
          stroke="#ffffff"
          strokeOpacity="0.28"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <rect x="15" y="20" width="5.2" height="3.5" rx="1.75" fill="#3478f6" />
        <rect
          x="27.8"
          y="20"
          width="5.2"
          height="3.5"
          rx="1.75"
          fill="#3478f6"
        />
        <path
          d="m18.2 26.2 5.8 3 5.8-3"
          stroke="#f7f9fc"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 18.5v6.8M37 18.5v6.8"
          stroke="#3478f6"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
