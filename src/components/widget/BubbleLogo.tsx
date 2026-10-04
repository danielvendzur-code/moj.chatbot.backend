import { BrandMark } from "./BrandMark";
export function BubbleLogo({
  size,
}: {
  size: "launcher" | "header" | "avatar";
}) {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <BrandMark
        size={size === "header" ? 30 : size === "launcher" ? 36 : 24}
        tone="paper"
        loop={size === "launcher"}
      />
    </span>
  );
}
