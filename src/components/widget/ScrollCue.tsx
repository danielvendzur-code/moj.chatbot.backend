import type { RefObject } from "react";
import { useScrollCue } from "../../hooks/useScrollCue";
import { WidgetIcon } from "./WidgetIcon";

type ScrollCueProps = {
  targetRef: RefObject<HTMLElement>;
  label?: string;
};

/**
 * The arrow that says "there is more below" and moves you there.
 *
 * It sits in a wrapper alongside the scroll container rather than inside it,
 * so it stays pinned to the bottom edge instead of scrolling away with the
 * content it is pointing at.
 */
export function ScrollCue({
  targetRef,
  label = "Zobraziť ďalšie možnosti",
}: ScrollCueProps): JSX.Element | null {
  const { hasMore, scrollOn } = useScrollCue(targetRef);

  if (!hasMore) return null;

  return (
    <>
      {/* Without the fade the arrow lands on top of whatever card happens to
          be at the bottom edge and reads as a rendering fault. */}
      <span className="cw-scroll-fade" aria-hidden="true" />
      <button
        type="button"
        className="cw-scroll-cue"
        data-testid="scroll-cue"
        aria-label={label}
        title={label}
        onClick={scrollOn}
      >
        <WidgetIcon name="arrow" />
      </button>
    </>
  );
}
