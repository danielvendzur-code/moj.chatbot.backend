import type { FlyCatchPhase } from "../../hooks/useFlyCatch";

type PixelMascotProps = {
  phase: FlyCatchPhase;
  size: "launcher" | "header" | "avatar";
};

/*
 * Pixel-art zlatý chameleón — kreslený ručne po pixeloch (26 × 14).
 * Scéna má vľavo priestor pre muchu a vystrelený jazyk.
 */
const PALETTE: Record<string, string> = {
  g: "#F2B23E", // zlaté telo
  h: "#FFD976", // svetlý odlesk
  s: "#CE8D17", // tieň / chrbát
  d: "#9C6B0C", // nohy, hlboký tón
  c: "#B97F0E", // hrebeň a ostne
  b: "#FFE9B8", // bruško
  w: "#FFF9EC", // oko
};

const SPRITE = [
  "......cc..................",
  ".....ccc..................",
  "....ggcc..................",
  "...ghhgcc.c.c.c...........",
  "..ggggggggggggggg.........",
  ".gwwwggggggggggggggg......",
  "ggwwwggggggggggggss.gg....",
  "ggwwwgggggggggggg....g....",
  "ssgggbbbbbbbbbbbg..sgg....",
  "...ggbbbbbbbbbbbg.........",
  "....gsssssssssssg.........",
  ".....dd......dd...........",
  ".....dd......dd...........",
  "....dddd....dddd..........",
];

/* Chameleón je v scéne posunutý o 18 jednotiek doprava. */
const OFFSET_X = 18;

type Cell = { x: number; y: number; fill: string };

const CELLS: Cell[] = SPRITE.flatMap((row, y) =>
  [...row].flatMap((char, x) => {
    const fill = PALETTE[char];
    return fill ? [{ x: x + OFFSET_X, y, fill }] : [];
  }),
);

/* Konárik pod chameleónom — tmavé drevo so svetlejšími letokruhmi. */
const BRANCH_SPECKS = [18, 23, 28, 33, 38, 41];

const VIEWBOXES: Record<PixelMascotProps["size"], string> = {
  launcher: "0 0 44 16",
  header: "17 0 27 16",
  avatar: "17 0 27 16",
};

export function PixelMascot({ phase, size }: PixelMascotProps): JSX.Element {
  return (
    <span className={`pm pm--${size}`} data-phase={phase} aria-hidden="true">
      <svg
        className="pm__scene"
        viewBox={VIEWBOXES[size]}
        shapeRendering="crispEdges"
        focusable="false"
      >
        {/* konárik */}
        <g className="pm__branch">
          <rect x="16" y="14" width="28" height="1.4" fill="#6B4A2E" />
          {BRANCH_SPECKS.map((x) => (
            <rect key={x} x={x} y="14.4" width="1.6" height="0.6" fill="#57381F" />
          ))}
        </g>

        {/* jazyk — vystreľuje z papuľky doľava k muche */}
        <g className="pm__tongue">
          <rect x="6" y="7.2" width="12.6" height="1" fill="#E4573D" />
          <rect x="5" y="6.4" width="2.4" height="2.4" fill="#F0705A" />
        </g>

        {/* mucha */}
        <g className="pm__fly">
          <rect className="pm__fly-wing" x="4.6" y="4.6" width="1.1" height="1.1" fill="#CFE0EE" />
          <rect className="pm__fly-wing pm__fly-wing--alt" x="6.4" y="4.6" width="1.1" height="1.1" fill="#CFE0EE" />
          <rect x="5" y="5.6" width="2" height="1.4" fill="#3A3128" />
          <rect x="6.6" y="5.9" width="0.8" height="0.8" fill="#241E16" />
        </g>

        {/* chameleón */}
        <g className="pm__body">
          {CELLS.map((cell) => (
            <rect
              key={`${cell.x}-${cell.y}`}
              x={cell.x}
              y={cell.y}
              width="1"
              height="1"
              fill={cell.fill}
            />
          ))}
          {/* zrenička sleduje muchu */}
          <rect className="pm__pupil" x="21" y="6" width="1" height="1" fill="#241505" />
          {/* viečko na žmurkanie */}
          <rect className="pm__lid" x="20" y="5" width="3" height="3" fill="#F2B23E" />
        </g>

        {/* zlaté iskričky po ulovení */}
        <g className="pm__spark">
          <rect x="16" y="4.6" width="0.9" height="0.9" fill="#FFD976" />
          <rect x="14.4" y="7" width="0.7" height="0.7" fill="#FFEDB0" />
          <rect x="16.6" y="9.4" width="0.7" height="0.7" fill="#FFD976" />
        </g>
      </svg>
    </span>
  );
}
