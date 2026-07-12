import type { ChameleonState } from "../../types/assistant";

type ChameleonMascotProps = {
  state: ChameleonState;
  mode: "page" | "launcher" | "panel";
  className?: string;
};

export function ChameleonMascot({ state, mode, className = "" }: ChameleonMascotProps): JSX.Element {
  return (
    <span
      className={`chameleon-mascot chameleon-mascot--${mode} ${className}`}
      data-state={state}
      aria-hidden="true"
    >
      <span className="chameleon-mascot__crop">
        <img src={`${import.meta.env.BASE_URL}chameleon.png`} alt="" draggable="false" />
      </span>
      <span className="chameleon-mascot__tongue" />
      <span className="chameleon-mascot__shadow" />
    </span>
  );
}
