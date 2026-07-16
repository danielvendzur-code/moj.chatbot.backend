import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type HoverGlideProps = {
  /* kontajner s position: relative, v ktorom pilulka kĺže */
  containerRef: RefObject<HTMLElement | null>;
  /* plne guľatá pilulka (chipy) namiesto zaoblenej karty */
  pill?: boolean;
  /* po odchode myši zaparkovať na [data-selected="true"] */
  park?: boolean;
  /* zmeny, po ktorých treba prepočítať pozíciu (krok, výber…) */
  deps?: readonly unknown[];
};

/*
 * Kĺžuca sklenená pilulka — rovnaký princíp ako prepínač režimov:
 * jeden biely glass povrch sa pružinovo presúva pod prvkami
 * označenými data-glide.
 */
export function HoverGlide({
  containerRef,
  pill = false,
  park = false,
  deps = [],
}: HoverGlideProps): JSX.Element {
  const glideRef = useRef<HTMLSpanElement>(null);
  const firstMoveRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const glide = glideRef.current;
    if (!container || !glide) return;

    const moveTo = (el: HTMLElement) => {
      const c = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      /* prvé umiestnenie bez prechodu, nech pilulka nepriletí z rohu */
      if (firstMoveRef.current) {
        glide.style.transition = "none";
        requestAnimationFrame(() => {
          glide.style.transition = "";
        });
        firstMoveRef.current = false;
      }
      glide.style.width = `${r.width}px`;
      glide.style.height = `${r.height}px`;
      glide.style.transform = `translate(${r.left - c.left}px, ${r.top - c.top}px)`;
      glide.style.opacity = "1";
    };

    const parkOrHide = () => {
      const selected = park
        ? container.querySelector<HTMLElement>('[data-glide][data-selected="true"]')
        : null;
      if (selected) moveTo(selected);
      else {
        glide.style.opacity = "0";
        firstMoveRef.current = true;
      }
    };

    const onOver = (event: Event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-glide]");
      if (target && container.contains(target)) moveTo(target);
    };

    container.addEventListener("mouseover", onOver);
    container.addEventListener("mouseleave", parkOrHide);
    parkOrHide();

    return () => {
      container.removeEventListener("mouseover", onOver);
      container.removeEventListener("mouseleave", parkOrHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return (
    <span
      className={`cw-glide${pill ? " cw-glide--pill" : ""}`}
      ref={glideRef}
      aria-hidden="true"
    />
  );
}
