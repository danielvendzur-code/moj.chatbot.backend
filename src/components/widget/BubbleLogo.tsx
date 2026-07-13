type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/*
 * Logo asistenta — čistá chatová bublina s tromi bodkami.
 * Bublina preberá farbu textu (currentColor), bodky sú zlatý akcent.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path
          fill="currentColor"
          d="M15 7h18a11 11 0 0 1 11 11v7a11 11 0 0 1-11 11h-9.6l-8.3 6.9c-.65.54-1.64.08-1.64-.77v-6.75A11 11 0 0 1 4 25v-7A11 11 0 0 1 15 7Z"
        />
        <circle className="bl__dot" cx="15.4" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="24" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="32.6" cy="21.7" r="2.7" />
      </svg>
    </span>
  );
}
