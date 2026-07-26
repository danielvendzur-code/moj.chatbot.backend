type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/**
 * „Môj Chatbot" brand mark — a geometric M monogram inside a soft speech
 * bubble. One colour (currentColor), balanced stroke weights, and it still
 * reads at a 20px avatar.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false" fill="none">
        <path
          d="M15.5 8h17A10 10 0 0 1 42.5 18v6.6a10 10 0 0 1-10 10h-9.2l-7.5 5.7c-.86.66-2.1.04-2.1-1.04v-4.9A10 10 0 0 1 5.5 24.6V18a10 10 0 0 1 10-10Z"
          fill="currentColor"
          fillOpacity="0.14"
        />
        <path
          d="M15.5 8h17A10 10 0 0 1 42.5 18v6.6a10 10 0 0 1-10 10h-9.2l-7.5 5.7c-.86.66-2.1.04-2.1-1.04v-4.9A10 10 0 0 1 5.5 24.6V18a10 10 0 0 1 10-10Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M16.4 27.6V18.4a1 1 0 0 1 1.76-.65L24 24.6l5.84-6.85a1 1 0 0 1 1.76.65v9.2"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
