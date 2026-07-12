type FlyParticleProps = {
  visible: boolean;
  placement: "launcher" | "panel";
};

export function FlyParticle({ visible, placement }: FlyParticleProps): JSX.Element | null {
  if (!visible) return null;
  return (
    <span className={`fly-particle fly-particle--${placement}`} aria-hidden="true">
      <span className="fly-particle__wing fly-particle__wing--left" />
      <span className="fly-particle__body" />
      <span className="fly-particle__wing fly-particle__wing--right" />
    </span>
  );
}
