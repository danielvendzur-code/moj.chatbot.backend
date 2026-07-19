type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

let gradientCounter = 0;

const BUBBLE_PATH =
  "M15 7h18a11 11 0 0 1 11 11v7a11 11 0 0 1-11 11h-9.6l-8.3 6.9c-.65.54-1.64.08-1.64-.77v-6.75A11 11 0 0 1 4 25v-7A11 11 0 0 1 15 7Z";

/*
 * Emblém asistenta (paleta Forest Night): chatová bublina
 * v starej mosadzi, tmavé lesné bodky, jemný ivory záblesk.
 * Tieň ostáva lacný duplikovaný path (žiadny SVG filter).
 */
export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  const uid = `bl${++gradientCounter}`;

  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <defs>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9bc84" />
            <stop offset="100%" stopColor="#c9aa70" />
          </linearGradient>
          <linearGradient id={`${uid}-glint`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fdf7e9" stopOpacity="0" />
            <stop offset="50%" stopColor="#fdf7e9" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fdf7e9" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <path d={BUBBLE_PATH} />
          </clipPath>
        </defs>
        {/* lacný tieň — posunutá tmavá kópia */}
        <path d={BUBBLE_PATH} transform="translate(0 1.1)" fill="#000000" opacity="0.32" />
        {/* telo bubliny — mosadzný gradient */}
        <path fill={`url(#${uid}-body)`} d={BUBBLE_PATH} />
        {/* diskrétny záblesk svetla — orezaný na tvar bubliny */}
        <g clipPath={`url(#${uid}-clip)`}>
          <rect className="bl__glint" x="-16" y="2" width="13" height="44" fill={`url(#${uid}-glint)`} />
        </g>
        {/* tmavé bodky — jemný nádych rieši widget.css */}
        <circle className="bl__dot" cx="15.4" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="24" cy="21.7" r="2.7" />
        <circle className="bl__dot" cx="32.6" cy="21.7" r="2.7" />
      </svg>
    </span>
  );
}
