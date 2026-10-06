import { useEffect, useState, type RefObject } from "react";

export type LauncherSurface = "light" | "dark";

/** Read the visible page behind the launcher, ignoring the widget itself. */
function pageSurface(x: number, y: number): LauncherSurface {
  const behind = document
    .elementsFromPoint(x, y)
    .find(
      (element) =>
        !element.closest(
          ".cw-widget, .cw-launcher-dock, #dv-assistant-root, #site-assistant-widget-host",
        ),
    );
  for (
    let element = behind;
    element;
    element = element.parentElement ?? undefined
  ) {
    const color = getComputedStyle(element)
      .backgroundColor.match(/[\d.]+/g)
      ?.map(Number);
    if (!color || color.length < 3 || (color[3] ?? 1) < 0.5) continue;
    const [r, g, b] = color.slice(0, 3).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35 ? "dark" : "light";
  }
  return "light";
}

export function useLauncherSurface(
  ref: RefObject<HTMLButtonElement>,
  open: boolean,
): LauncherSurface {
  const [surface, setSurface] = useState<LauncherSurface>("light");
  useEffect(() => {
    if (open) return;
    // In an iframe, only the parent page can sample its background.
    const embedded = window.parent !== window;
    let frame = 0;
    const sample = () => {
      frame = 0;
      const rect = ref.current?.getBoundingClientRect();
      if (rect && !embedded)
        setSurface(
          pageSurface(
            Math.max(
              0,
              Math.min(window.innerWidth - 1, rect.x + rect.width / 2),
            ),
            Math.max(
              0,
              Math.min(window.innerHeight - 1, rect.y + rect.height / 2),
            ),
          ),
        );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sample);
    };
    const parentSurface = (event: Event) => {
      const value = (event as CustomEvent).detail;
      if (value === "dark" || value === "light") setSurface(value);
    };
    window.addEventListener("scroll", schedule, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", schedule);
    document.addEventListener("animationend", schedule, true);
    window.addEventListener("site-assistant:surface", parentSurface);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    // Consent dialogs and route content may disappear without a body resize.
    const content = new MutationObserver(schedule);
    content.observe(document.body, { childList: true, subtree: true });
    // The entrance can start outside the viewport. Sample again as it arrives.
    const visibility = new IntersectionObserver(schedule, {
      threshold: [0, 0.5, 1],
    });
    if (ref.current) visibility.observe(ref.current);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      content.disconnect();
      visibility.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("animationend", schedule, true);
      window.removeEventListener("site-assistant:surface", parentSurface);
    };
  }, [ref, open]);
  return surface;
}
