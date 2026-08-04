type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/*
 * Compact Môj Chatbot mark for small UI surfaces.
 * The speech bubble is the silhouette and the white M is cut directly into it,
 * so the logo remains legible in the launcher, header and 23 px chat avatar.
 * The tail intentionally sits on the right and the mark has no plate, double
 * outline or decorative backing.
 */
const BUBBLE =
  "M20 8H92C101.94 8 110 16.06 110 26V71C110 80.94 101.94 89 92 89H82L100 106L69 89H20C10.06 89 2 80.94 2 71V26C2 16.06 10.06 8 20 8Z";

const MONOGRAM =
  "M24 67V31L48 53C50.4 55.2 53.6 55.2 56 53L80 31V67";

export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 112 112" fill="none" focusable="false">
        <path className="bl__bubble" d={BUBBLE} fill="currentColor" />
        <path
          className="bl__monogram"
          d={MONOGRAM}
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
