type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/**
 * Rovnaký finálny symbol ako na verejnom webe.
 * M aj textová bublina sú vytvorené jednou neprerušenou čiarou.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 112 112" focusable="false" fill="none">
        <path
          d="M69 103L69 88H82C93 88 101 80 101 69V23C101 14 91 10 84 17L64 37C59 42 53 42 48 37L28 17C21 10 11 14 11 23V69C11 80 19 88 30 88H54L69 103Z"
          stroke="currentColor"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
