type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/** Shared Môj Chatbot mark: the same blue M-bot used by the website. */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path
          d="M11.2 4.5h25.6c5.1 0 8.7 3.6 8.7 8.7v18.3c0 5.1-3.6 8.7-8.7 8.7H27l-9.6 6.1v-6.1h-6.2c-5.1 0-8.7-3.6-8.7-8.7V13.2c0-5.1 3.6-8.7 8.7-8.7Z"
          fill="#3478f6"
        />
        <rect
          x="8"
          y="10"
          width="32"
          height="23.5"
          rx="9"
          fill="#090b10"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="1.4"
        />
        <path
          d="M12 13.8h11"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="17" cy="21" r="2.15" fill="#ffffff" />
        <circle cx="31" cy="21" r="2.15" fill="#ffffff" />
        <path
          d="M15 28.5v-4.1l9 5.7 9-5.7v4.1"
          stroke="#3478f6"
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
