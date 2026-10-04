import { BrandMark } from "./BrandMark";
export function BubbleLogo({
  size,
  tone = "paper",
}: {
  size: "launcher" | "header" | "avatar";
  tone?: "paper" | "brand";
}) {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <BrandMark
        size={size === "header" ? 30 : size === "launcher" ? 36 : 24}
        tone={tone}
        loop={size === "launcher"}
      />
    </span>
  );
}
