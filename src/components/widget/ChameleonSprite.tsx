import type { CSSProperties } from "react";
import type { FlyCatchPhase } from "../../hooks/useFlyCatch";

type ChameleonSpriteProps = {
  phase: FlyCatchPhase;
  size: "launcher" | "header" | "avatar";
};

type SpriteStyle = CSSProperties & {
  "--sprite-url": string;
};

export function ChameleonSprite({ phase, size }: ChameleonSpriteProps): JSX.Element {
  const style: SpriteStyle = {
    "--sprite-url": `url("${import.meta.env.BASE_URL}chameleon-sprite.png")`,
  };

  return (
    <span
      className={`cw-sprite cw-sprite--${size}`}
      data-phase={phase}
      style={style}
      aria-hidden="true"
    >
      <span className="cw-sprite__viewport">
        <span className="cw-sprite__sheet" />
      </span>
      <span className="cw-sprite__fly">
        <i />
        <b />
      </span>
    </span>
  );
}
