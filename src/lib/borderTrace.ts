const timers = new WeakMap<HTMLElement, number>();

/** Replays the click-only border trace, then leaves enough time for the centre fill. */
export function replayBorderTrace(element: HTMLElement): void {
  const previousTimer = timers.get(element);
  if (previousTimer) window.clearTimeout(previousTimer);

  element.classList.remove("is-border-tracing");
  void element.offsetWidth;
  element.classList.add("is-border-tracing");

  timers.set(
    element,
    window.setTimeout(() => {
      element.classList.remove("is-border-tracing");
      timers.delete(element);
    }, 1420),
  );
}
