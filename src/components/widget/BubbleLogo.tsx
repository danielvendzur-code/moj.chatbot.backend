type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/**
 * „Môj Chatbot" brand mark — a single-stroke round speech bubble whose outline
 * is the logo itself (no tile, no filled bubble behind it), with a flowing M
 * and the signature centre loop inside.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false" fill="none">
        <path
          d="M40.6 22.8a16.8 16.8 0 1 0-9.8 15.3l7.3 3.2c1.1.5 2.2-.6 1.7-1.7l-2.7-6.2a16.7 16.7 0 0 0 3.5-10.6Z"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.6 30.6V20.2c0-2.9 3.9-3.8 5.1-1.1L24 26.4l3.3-7.3c1.2-2.7 5.1-1.8 5.1 1.1v10.4"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="29.4" r="2.4" stroke="currentColor" strokeWidth="2.6" />
      </svg>
    </span>
  );
}
