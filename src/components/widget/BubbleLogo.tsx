type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/**
 * „Môj Chatbot" mark — a friendly speech bubble with a spark inside
 * (chat + smart help). Single-colour (currentColor) so it stays crisp on the
 * blue launcher, header tile and avatar.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false" fill="none">
        <path
          d="M14 8H34A8 8 0 0 1 42 16V25A8 8 0 0 1 34 33H22L15 39V33H14A8 8 0 0 1 6 25V16A8 8 0 0 1 14 8Z"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <path
          d="M14 8H34A8 8 0 0 1 42 16V25A8 8 0 0 1 34 33H22L15 39V33H14A8 8 0 0 1 6 25V16A8 8 0 0 1 14 8Z"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        <path
          d="M24 12.4Q25.5 19 31.6 20.5Q25.5 22 24 28.6Q22.5 22 16.4 20.5Q22.5 19 24 12.4Z"
          fill="currentColor"
        />
        <path
          d="M33.4 24.2Q33.9 27 36.8 27.6Q33.9 28.2 33.4 31Q32.9 28.2 30 27.6Q32.9 27 33.4 24.2Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
      </svg>
    </span>
  );
}
