const pulseIndicator = (root: HTMLElement, direction: number) => {
  root.dataset.liquidSettling = "true";
  root.style.setProperty("--cw-segment-stretch", direction === 0 ? "1.02" : "1.045");

  window.requestAnimationFrame(() => {
    root.style.setProperty("--cw-segment-stretch", "0.992");
    window.setTimeout(() => {
      root.style.setProperty("--cw-segment-stretch", "1");
      delete root.dataset.liquidSettling;
    }, 170);
  });
};

export function installLiquidSegmentedDrag(): () => void {
  const onClick = (event: MouseEvent) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>(".cw-tabs > button")
        : null;
    const root = button?.parentElement;
    if (!button || !(root instanceof HTMLElement)) return;

    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>(":scope > button"));
    const nextIndex = buttons.indexOf(button);
    const previousIndex = buttons.findIndex((item) => item.dataset.active === "true");
    const direction = previousIndex < 0 || nextIndex === previousIndex ? 0 : nextIndex > previousIndex ? 1 : -1;

    window.requestAnimationFrame(() => pulseIndicator(root, direction));
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
