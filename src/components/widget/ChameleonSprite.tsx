import type { FlyCatchPhase } from "../../hooks/useFlyCatch";

type ChameleonSpriteProps = {
  phase: FlyCatchPhase;
  size: "launcher" | "header" | "avatar";
};

export function ChameleonSprite({ phase, size }: ChameleonSpriteProps): JSX.Element {
  const mascotUrl = `${import.meta.env.BASE_URL}chameleon-mascot.png`;

  return (
    <span
      className={`cw-sprite cw-sprite--${size}`}
      data-phase={phase}
      aria-hidden="true"
    >
      <span className="cw-sprite__halo" />
      <span className="cw-sprite__tongue"><i /></span>
      <span className="cw-sprite__art">
        <img className="cw-sprite__image" src={mascotUrl} alt="" draggable={false} />
      </span>
      <span className="cw-sprite__fly">
        <i />
        <b />
      </span>
      <span className="cw-sprite__catch"><i /><i /><i /></span>
    </span>
  );
}
