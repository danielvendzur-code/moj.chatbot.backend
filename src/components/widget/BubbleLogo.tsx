type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/**
 * Rovnaký finálny symbol ako na webe.
 * Pravý a ľavý horný ťah majú identickú výšku a značka je horizontálne
 * otočená. Launcher nemá vlastnú bublinu ani okraj — samotné logo je ovládanie.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 112 112" focusable="false" fill="none">
        <g transform="translate(112 0) scale(-1 1)">
          <path
            d="M8 19V71.5C8 81.2 15.8 89 25.5 89H43L59 104V89H79.5C89.2 89 97 81.2 97 71.5V19C97 11.4 87.8 7.6 82.5 13L61 34.8C56.2 39.7 48.4 39.7 43.6 34.8L22.5 13C17.2 7.6 8 11.4 8 19Z"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M29 68V42L45.1 58.1C49 62 55.2 62 59.1 58.1L75 42V68"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  );
}
