import "./brand-mark.css";
export function BrandMark({
  size = 34,
  className = "",
  loop = false,
  tone = "ink",
}: {
  size?: number;
  className?: string;
  loop?: boolean;
  tone?: "ink" | "paper" | "brand";
}) {
  const color =
    tone === "paper" ? "#FFFCF7" : tone === "brand" ? "#5B3A26" : "#1C1612";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Môj Chatbot logo"
      className={`brand-mark mc-mark ${className}`}
      style={{ color }}
      focusable="false"
      data-loop={loop || undefined}
      fill="currentColor"
    >
      <rect className="mc-join" x="21.5" y="49.4" width="57" height="1.2" />
      <path className="mc-half mc-half--top" d="M6 46.5A29 29 0 0 1 64 46.5Z" />
      <path
        className="mc-half mc-half--bottom"
        d="M36 53.5H94A29 29 0 0 1 93.01 61C91.7 65.8 92.34 67.76 93.43 72.64L96.1 84.6L84.14 81.93C79.26 80.84 77.34 80.21 72.51 81.51A29 29 0 0 1 36 53.5Z"
      />
    </svg>
  );
}
