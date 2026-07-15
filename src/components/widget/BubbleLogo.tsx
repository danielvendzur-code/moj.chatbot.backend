type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

let gradientCounter = 0;

const BUBBLE_PATH =
  "M15 7h18a11 11 0 0 1 11 11v7a11 11 0 0 1-11 11h-9.6l-8.3 6.9c-.65.54-1.64.08-1.64-.77v-6.75A11 11 0 0 1 4 25v-7A11 11 0 0 1 15 7Z";

/*
 * Logo asistenta — chatová bublina s tromi tonálnymi bodkami.
 * Kvalita app ikony: gradient tela, mäkký tieň, horný lesk
 * a raz za pár sekúnd diskrétny záblesk svetla (glint) cez bublinu.
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  const uid = `bl${++gradientCounter}`;

  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <defs>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2efe8" />
          </linearGradient>
          <linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-glint`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <path d={BUBBLE_PATH} />
          </clipPath>
          <filter id={`${uid}-sh`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="0.9" floodColor="#0a2e21" floodOpacity="0.32" />
          </filter>
        </defs>
        {/* telo bubliny */}
        <path fill={`url(#${uid}-body)`} filter={`url(#${uid}-sh)`} d={BUBBLE_PATH} />
        {/* horný lesk */}
        <path
          className="bl__gloss"
          fill={`url(#${uid}-gloss)`}
          d="M15 8.3h18a9.7 9.7 0 0 1 9.3 7c.1.36-.2.7-.57.7H6.27c-.37 0-.67-.34-.57-.7a9.7 9.7 0 0 1 9.3-7Z"
        />
        {/* diskrétny záblesk svetla — orezaný na tvar bubliny */}
        <g clipPath={`url(#${uid}-clip)`}>
          <rect className="bl__glint" x="-16" y="2" width="13" height="44" fill={`url(#${uid}-glint)`} />
        </g>
        {/* tonálne bodky — jedna rodina zelenej, žiadny cirkus */}
        <circle className="bl__dot" cx="15.4" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="24" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="32.6" cy="21.7" r="2.7" />
      </svg>
    </span>
  );
}
