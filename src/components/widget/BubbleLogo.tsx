type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/* Exact Môj Chatbot silhouette from the approved identity. The subtle optical
   stroke strengthens the outline at widget sizes without closing the negative
   space; the 4.3 px core preserves the clean rounded geometry of the wordmark.
   There is no plate, tile, fill or photographic backing. */
const OUTER =
  "M96.6 85.5C100.8 84.6 103.6 82.4 103.6 79.9V12.4C103.6 7.2 99.2 4.5 95.4 6.4L59.5 34.5" +
  "C57.9 36.1 54.1 36.1 52.5 34.5L18.3 6.4C14.5 4.5 8.5 7.2 8.5 12.4V78.5" +
  "C8.5 81.4 11 83.7 14.2 83.7H30.2L30.5 105.5L52.9 83.7H85.3C86.8 83.7 88 82.6 88 81.2V29.2";

const INNER = "M24 71.2V29.2L52.5 55.4C54.1 57 57.9 57 59.5 55.4L88 29.2";

function LogoPath({ d }: { d: string }): JSX.Element {
  return (
    <>
      <path
        className="bl__optical-weight"
        d={d}
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.28"
      />
      <path
        className="bl__core"
        d={d}
        stroke="currentColor"
        strokeWidth="4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 112 112" fill="none" focusable="false">
        <LogoPath d={OUTER} />
        <LogoPath d={INNER} />
      </svg>
    </span>
  );
}
