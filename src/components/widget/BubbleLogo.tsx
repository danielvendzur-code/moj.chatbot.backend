type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/* The exact Môj Chatbot silhouette stays unchanged. A restrained plate and
   underlay give the mark enough optical weight at launcher and avatar sizes,
   while the main paths remain crisp vectors shared by every widget surface. */
const OUTER =
  "M96.6 85.5C100.8 84.6 103.6 82.4 103.6 79.9V12.4C103.6 7.2 99.2 4.5 95.4 6.4L59.5 34.5" +
  "C57.9 36.1 54.1 36.1 52.5 34.5L18.3 6.4C14.5 4.5 8.5 7.2 8.5 12.4V78.5" +
  "C8.5 81.4 11 83.7 14.2 83.7H30.2L30.5 105.5L52.9 83.7H85.3C86.8 83.7 88 82.6 88 81.2V29.2";

const INNER = "M24 71.2V29.2L52.5 55.4C54.1 57 57.9 57 59.5 55.4L88 29.2";

export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 112 112" fill="none" focusable="false">
        <rect
          className="bl__plate"
          x="4.5"
          y="4.5"
          width="103"
          height="103"
          rx="31"
          fill="currentColor"
        />
        <path
          className="bl__underlay"
          d={OUTER}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="bl__underlay"
          d={INNER}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={OUTER}
          stroke="currentColor"
          strokeWidth="4.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={INNER}
          stroke="currentColor"
          strokeWidth="4.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
