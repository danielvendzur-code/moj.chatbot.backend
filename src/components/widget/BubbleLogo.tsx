type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/** Schválený symbol Môj Chatbot — verzia 1. */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 112 112" focusable="false" fill="none">
        <path
          d="M93 84V23C93 13 81 9 74 16L56 34L38 16C31 9 19 13 19 23V70C19 81 27 89 38 89H47V104L63 89H78"
          stroke="currentColor"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M36 69V43L51 58C54 61 58 61 61 58L76 43V69"
          stroke="currentColor"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// Deployment marker: preserves the stable visual version while retriggering Pages.
