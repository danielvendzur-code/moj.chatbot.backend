type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/**
 * „Môj Chatbot" brand mark — an M monogram inside a speech bubble.
 * One colour (currentColor) so it stays sharp on the blue launcher, the
 * header and the avatar, and it still reads at 20px.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false" fill="none">
        <path
          d="M15 7.5h18A9.5 9.5 0 0 1 42.5 17v8A9.5 9.5 0 0 1 33 34.5H22.6l-7.7 5.9c-.8.6-1.9 0-1.9-1v-5.2A9.5 9.5 0 0 1 5.5 25v-8A9.5 9.5 0 0 1 15 7.5Z"
          fill="currentColor"
          fillOpacity="0.16"
        />
        <path
          d="M15 7.5h18A9.5 9.5 0 0 1 42.5 17v8A9.5 9.5 0 0 1 33 34.5H22.6l-7.7 5.9c-.8.6-1.9 0-1.9-1v-5.2A9.5 9.5 0 0 1 5.5 25v-8A9.5 9.5 0 0 1 15 7.5Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M15.5 27.5V16.8a.6.6 0 0 1 1.05-.4L24 24.4l7.45-8a.6.6 0 0 1 1.05.4v10.7"
          stroke="currentColor"
          strokeWidth="3.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
