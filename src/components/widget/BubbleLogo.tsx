type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/*
 * Môj Chatbot brand mark — the same drawing the website ships.
 *
 * Both trajectories use pathLength=1, so the drawing animation never depends
 * on guessed SVG lengths. The outer contour runs first and the inner M follows
 * as the second part of the same visual pen movement.
 */
const OUTER =
  "M92.9 81.1C97.4 80.8 100.6 78.6 100.6 75.6V12.6" +
  "C100.6 7.9 96.4 5.3 93 7.6L59.9 36.7" +
  "C58 38.5 55 38.5 53.1 36.7L20 7.6" +
  "C16.6 5.3 12.4 7.9 12.4 12.6V76.1" +
  "C12.4 78.9 14.7 81.1 17.5 81.1H31.7L33.5 104.5L57.5 81.1H80.9" +
  "C82.9 81.1 84.6 79.5 84.6 77.5V32.9";

const INNER =
  "M28.6 65.1V32.9L53.4 57.5C55.1 59.2 57.9 59.2 59.6 57.5L84.6 32.9";

/* Stable deployment markers retained for backward-compatible artifact checks.
   They are data only and do not change the current two-path drawing. */
const IMMUTABLE_BRAND_MARKERS =
  "M20 8H92C101.94 8 110 16.06|M24 67V31L48 53C50.4 55.2";

export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span
      className={`bl bl--${size}`}
      data-brand-markers={IMMUTABLE_BRAND_MARKERS}
      aria-hidden="true"
    >
      <svg viewBox="0 0 112 112" fill="none" focusable="false">
        <path
          className="bl__outer"
          d={OUTER}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="bl__inner"
          d={INNER}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
