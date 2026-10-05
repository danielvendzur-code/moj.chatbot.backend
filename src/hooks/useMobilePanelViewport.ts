import { useLayoutEffect, type RefObject } from "react";

/** Priamy mobilný panel sleduje viditeľnú plochu aj pri klávesnici. */
export function useMobilePanelViewport(
  panelRef: RefObject<HTMLElement>,
  open: boolean,
  embedded: boolean,
): void {
  useLayoutEffect(() => {
    if (!open || embedded || !window.matchMedia("(max-width: 640px)").matches)
      return;
    const panel = panelRef.current;
    if (!panel) return;
    const viewport = window.visualViewport;
    const body = document.body;
    const scroll = { x: window.scrollX, y: window.scrollY };
    const properties = ["position", "top", "left", "right", "width"] as const;
    const previous = properties.map((name) => ({
      name,
      value: body.style.getPropertyValue(name),
      priority: body.style.getPropertyPriority(name),
    }));
    body.style.position = "fixed";
    body.style.top = `${-scroll.y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    const sync = () => {
      panel.style.setProperty(
        "--cw-viewport-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
      panel.style.setProperty(
        "--cw-viewport-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
    };
    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      panel.style.removeProperty("--cw-viewport-top");
      panel.style.removeProperty("--cw-viewport-height");
      for (const { name, value, priority } of previous) {
        if (value) body.style.setProperty(name, value, priority);
        else body.style.removeProperty(name);
      }
      const restoreScroll = () => {
        if (body.style.position !== "fixed")
          window.scrollTo({
            left: scroll.x,
            top: scroll.y,
            behavior: "instant",
          });
      };
      restoreScroll();
      // Obnova po commite, keď prehliadač znovu vypočíta výšku stránky.
      window.requestAnimationFrame(restoreScroll);
    };
  }, [panelRef, open, embedded]);
}
