import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  dragged: boolean;
};

export function useHorizontalDrag<T extends HTMLElement>() {
  const dragRef = useRef<DragState | null>(null);
  const suppressClickUntilRef = useRef(0);

  const onPointerDown = useCallback((event: ReactPointerEvent<T>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const element = event.currentTarget;
    if (element.scrollWidth <= element.clientWidth + 2) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: element.scrollLeft,
      dragged: false,
    };
    element.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<T>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.dragged) {
      if (Math.abs(deltaX) <= 6 || Math.abs(deltaX) <= Math.abs(deltaY) + 2) return;
      drag.dragged = true;
      event.currentTarget.dataset.dragging = "true";
    }

    event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft - deltaX;
  }, []);

  const finish = useCallback((event: ReactPointerEvent<T>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.dragged && !cancelled) suppressClickUntilRef.current = performance.now() + 90;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<T>) => {
      finish(event);
    },
    [finish],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<T>) => {
      finish(event, true);
    },
    [finish],
  );

  const onClickCapture = useCallback((event: ReactMouseEvent<T>) => {
    if (performance.now() >= suppressClickUntilRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    "data-horizontal-drag": "true",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  } as const;
}
