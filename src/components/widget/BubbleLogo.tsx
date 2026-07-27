type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/**
 * „Môj Chatbot" brand mark — a single-stroke round speech bubble whose outline
 * is the logo itself, with a flowing M inside and a small teardrop where the
 * two inner strokes meet.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false" fill="none">
        <path
          d="M41 22.6A17 17 0 1 0 29.4 38.7l8 3.3c1.2.5 2.4-.7 1.9-1.9l-2.9-6.8A16.9 16.9 0 0 0 41 22.6Z"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.9 31.4c-.7-6.8.2-13 2.7-13 2.3 0 4.4 5.3 5.4 8.6 1-3.3 3.1-8.6 5.4-8.6 2.5 0 3.4 6.2 2.7 13"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="29.6" r="2.2" stroke="currentColor" strokeWidth="2.6" />
      </svg>
    </span>
  );
}
