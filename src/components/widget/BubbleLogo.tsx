type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/* The speech bubble itself: the shape the outline encloses. It is painted
   white so the mark carries its own background and reads on any page it is
   dropped onto, rather than borrowing the contrast of whatever is behind it. */
const BUBBLE =
  "M26.6 14.7L56 42L85.4 14.7C91 9.3 100 13.1 100 20.8V75.6C100 79.2 97.6 82 94 82.4L54.2 82L32.4 99.4V82H20.9C15.9 82 12 78 12 73V20.8C12 13.1 21 9.3 26.6 14.7Z";

/* One unbroken stroke: the right shoulder overshoots the bubble and ends free,
   the bubble turns the corner and runs back up as the M's right stem. */
const OUTLINE =
  "M95.2 83.3C98.2 82 100 79.2 100 75.6V20.8C100 13.1 91 9.3 85.4 14.7L58.4 39.4C57.2 40.6 54.8 40.6 53.6 39.4L26.6 14.7C21 9.3 12 13.1 12 20.8V73C12 78 15.9 82 20.9 82H32.4V99.4L54.2 82H79.5C82.8 82 85.4 79.4 85.4 76.1V33";

const INNER = "M26.6 70.6V33L53.6 58.6C54.8 59.8 57.2 59.8 58.4 58.6L85.4 33";

/* The line is drawn at a constant fraction of the mark, so it thickens as the
   mark shrinks — at avatar size the traced weight would fall under a pixel. */
const WEIGHT = { launcher: 4.6, header: 5.2, avatar: 6.6 } as const;

/** Schválený symbol Môj Chatbot — verzia 1. */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  const gradientId = `bl-ink-${size}`;
  const ink = size === "launcher" ? `url(#${gradientId})` : "currentColor";
  const line = {
    stroke: ink,
    strokeWidth: WEIGHT[size],
    strokeLinecap: "round",
    strokeLinejoin: "round",
    pathLength: 100,
  } as const;

  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 112 112" focusable="false" fill="none">
        {size === "launcher" ? (
          <defs>
            {/* Lime where the mark meets the page and green where it crosses
                its own white body, so both halves keep their contrast. */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor="#b9ed4d" />
              <stop offset="0.52" stopColor="#5fb63c" />
              <stop offset="1" stopColor="#19834f" />
            </linearGradient>
          </defs>
        ) : null}
        <path className="bl__bubble" d={BUBBLE} fill="#ffffff" />
        <path className="bl__ink bl__ink--outline" d={OUTLINE} {...line} />
        <path className="bl__ink bl__ink--inner" d={INNER} {...line} />
      </svg>
    </span>
  );
}
