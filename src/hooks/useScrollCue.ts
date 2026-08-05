import { useCallback, useEffect, useState, type RefObject } from "react";

/* Below this the remaining content is a sliver of padding, not something the
   visitor needs to be told about. */
const REMAINING_THRESHOLD_PX = 12;

/**
 * Tracks whether a scroll container still has content below the fold.
 *
 * A step that overflows gives the visitor no signal that anything follows —
 * the cut-off card at the bottom edge is easy to read as the end of the list.
 * This drives a visible cue, and returns the scroller that moves it on.
 */
export function useScrollCue(ref: RefObject<HTMLElement>): {
  hasMore: boolean;
  scrollOn: () => void;
} {
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const remaining =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      setHasMore(remaining > REMAINING_THRESHOLD_PX);
    };

    measure();
    element.addEventListener("scroll", measure, { passive: true });

    /* The scroller's own border box never changes — it is a fixed-height flex
       child — so watching only it reports nothing. What changes is the content:
       a step swaps for a differently sized one, or a reply streams in. React
       replaces those nodes outright, so a ResizeObserver bound to the children
       present at mount goes stale immediately; the mutation observer re-binds
       it every time the subtree changes. */
    const sizes = new ResizeObserver(measure);
    const observeChildren = () => {
      sizes.disconnect();
      sizes.observe(element);
      for (const child of Array.from(element.children)) sizes.observe(child);
      measure();
    };
    observeChildren();

    const mutations = new MutationObserver(observeChildren);
    mutations.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      element.removeEventListener("scroll", measure);
      sizes.disconnect();
      mutations.disconnect();
    };
  }, [ref]);

  const scrollOn = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({
      top: Math.round(element.clientHeight * 0.8),
      behavior: reduced ? "auto" : "smooth",
    });
  }, [ref]);

  return { hasMore, scrollOn };
}
