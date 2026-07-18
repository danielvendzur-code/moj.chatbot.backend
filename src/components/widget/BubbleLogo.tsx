type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

let gradientCounter = 0;

const BUBBLE_PATH =
  "M15 7h18a11 11 0 0 1 11 11v7a11 11 0 0 1-11 11h-9.6l-8.3 6.9c-.65.54-1.64.08-1.64-.77v-6.75A11 11 0 0 1 4 25v-7A11 11 0 0 1 15 7Z";

/*
 * Logo asistenta — dve farby: biela bublina + tri zelené bodky
 * v jednom tóne. Tieň je lacný duplikovaný path (žiadny SVG
 * filter — tie sa prepočítavajú pri každej animácii).
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  const uid = `bl${++gradientCounter}`;

  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <defs>
          <linearGradient id={`${uid}-glint`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#dcf6ea" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <path d={BUBBLE_PATH} />
          </clipPath>
        </defs>
        {/* lacný tieň — posunutá tmavá kópia */}
        <path d={BUBBLE_PATH} transform="translate(0 1.1)" fill="#04160f" opacity="0.28" />
        {/* telo bubliny — čistá biela */}
        <path fill="#ffffff" d={BUBBLE_PATH} />
        {/* diskrétny záblesk svetla — orezaný na tvar bubliny */}
        <g clipPath={`url(#${uid}-clip)`}>
          <rect className="bl__glint" x="-16" y="2" width="13" height="44" fill={`url(#${uid}-glint)`} />
        </g>
        {/* bodky v jednom tóne */}
        <circle className="bl__dot" cx="15.4" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="24" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="32.6" cy="21.7" r="2.7" />
      </svg>
    </span>
  );
}
