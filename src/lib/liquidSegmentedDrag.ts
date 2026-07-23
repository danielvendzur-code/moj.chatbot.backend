const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type DragState = {
  root: HTMLElement;
  pointerId: number;
  startX: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
};

const buttonsFor = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>(":scope > button"));

const activeIndex = (root: HTMLElement) => {
  const buttons = buttonsFor(root);
  const index = buttons.findIndex((button) => button.dataset.active === "true");
  return index < 0 ? 0 : index;
};

const geometry = (root: HTMLElement) => {
  const rect = root.getBoundingClientRect();
  const padding = 6;
  const gap = 6;
  const width = Math.max(0, (rect.width - padding * 2 - gap) / 2);
  return { rect, padding, width, travel: width + gap };
};

const setIndicator = (root: HTMLElement, x: number, stretch = 1) => {
  root.style.setProperty("--cw-segment-x", `${x}px`);
  root.style.setProperty("--cw-segment-stretch", stretch.toFixed(3));
};

const settle = (root: HTMLElement, index: number, direction = 0) => {
  const { travel } = geometry(root);
  const target = index * travel;
  root.dataset.liquidSettling = "true";
  setIndicator(root, target + direction * 9, 1.055);
  window.setTimeout(() => setIndicator(root, target - direction * 3, 0.988), 105);
  window.setTimeout(() => setIndicator(root, target, 1), 235);
  window.setTimeout(() => {
    delete root.dataset.liquidSettling;
  }, 720);
};

export function installLiquidSegmentedDrag(): () => void {
  let drag: DragState | null = null;

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || event.pointerType === "touch") return;
    const root = event.target instanceof Element ? event.target.closest<HTMLElement>(".cw-tabs") : null;
    if (!root) return;

    const { travel } = geometry(root);
    setIndicator(root, activeIndex(root) * travel, 1);
    root.dataset.liquidDragging = "true";
    root.setPointerCapture?.(event.pointerId);
    drag = {
      root,
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const deltaTime = Math.max(8, now - drag.lastTime);
    drag.velocity = (event.clientX - drag.lastX) / deltaTime;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    drag.moved ||= Math.abs(event.clientX - drag.startX) > 4;

    const { rect, padding, width, travel } = geometry(drag.root);
    const x = clamp(event.clientX - rect.left - padding - width / 2, 0, travel);
    const stretch = 1 + Math.min(0.085, Math.abs(drag.velocity) * 0.24);
    setIndicator(drag.root, x, stretch);
    if (drag.moved) event.preventDefault();
  };

  const finish = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    drag = null;
    delete current.root.dataset.liquidDragging;
    current.root.releasePointerCapture?.(event.pointerId);

    const { rect } = geometry(current.root);
    const nextIndex = event.clientX >= rect.left + rect.width / 2 ? 1 : 0;
    const previousIndex = activeIndex(current.root);
    const direction = nextIndex === previousIndex ? Math.sign(current.velocity) : nextIndex > previousIndex ? 1 : -1;
    const buttons = buttonsFor(current.root);

    if (current.moved && buttons[nextIndex] && nextIndex !== previousIndex) {
      buttons[nextIndex].click();
    }
    settle(current.root, nextIndex, direction);
  };

  const onClick = (event: MouseEvent) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".cw-tabs > button") : null;
    const root = button?.parentElement;
    if (!button || !(root instanceof HTMLElement)) return;
    const index = buttonsFor(root).indexOf(button);
    window.requestAnimationFrame(() => settle(root, Math.max(0, index), index ? 1 : -1));
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
  document.addEventListener("pointerup", finish, true);
  document.addEventListener("pointercancel", finish, true);
  document.addEventListener("click", onClick, true);

  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", finish, true);
    document.removeEventListener("pointercancel", finish, true);
    document.removeEventListener("click", onClick, true);
  };
}
