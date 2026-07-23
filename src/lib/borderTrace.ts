const timers = new WeakMap<HTMLElement, number>();

/** Replays the click-only border trace without leaving an idle animation behind. */
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
    }, 980),
  );
}
