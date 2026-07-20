const selector = ".cw-rows, .cw-grid";

export function installWidgetRailDrag(): () => void {
  const cleanups = new Map<HTMLElement, () => void>();

  const install = (element: HTMLElement) => {
    if (cleanups.has(element)) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let dragged = false;
    let suppressClickUntil = 0;

    element.dataset.widgetDragReady = "true";

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      if (element.scrollWidth <= element.clientWidth + 2) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startScrollLeft = element.scrollLeft;
      dragged = false;
      element.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (!dragged) {
        if (Math.abs(deltaX) <= 6 || Math.abs(deltaX) <= Math.abs(deltaY) + 2) return;
        dragged = true;
        element.dataset.dragging = "true";
      }

      event.preventDefault();
      element.scrollLeft = startScrollLeft - deltaX;
    };

    const finish = (event: PointerEvent, cancelled = false) => {
      if (pointerId !== event.pointerId) return;
      if (dragged && !cancelled) suppressClickUntil = performance.now() + 90;
      delete element.dataset.dragging;
      if (element.hasPointerCapture?.(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
      pointerId = null;
      dragged = false;
    };

    const onPointerUp = (event: PointerEvent) => finish(event);
    const onPointerCancel = (event: PointerEvent) => finish(event, true);
    const onClickCapture = (event: MouseEvent) => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove, { passive: false });
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("click", onClickCapture, true);

    cleanups.set(element, () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("click", onClickCapture, true);
      delete element.dataset.widgetDragReady;
      delete element.dataset.dragging;
    });
  };

  const scan = (root: ParentNode = document) => {
    root.querySelectorAll<HTMLElement>(selector).forEach(install);
  };

  scan();
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches(selector)) install(node);
        scan(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    cleanups.clear();
  };
}
