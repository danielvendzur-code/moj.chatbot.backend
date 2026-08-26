import { useEffect } from "react";

const tabButtonFromPoint = (event: PointerEvent): HTMLElement | null => {
  const direct =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(".cw-tabs > button")
      : null;
  if (direct) return direct;

  const pointed = document.elementFromPoint(event.clientX, event.clientY);
  return pointed?.closest<HTMLElement>(".cw-tabs > button") ?? null;
};

/**
 * Keeps ordinary Chatbot/Konfigurátor taps authoritative even when an older
 * swipe rail temporarily captures the pointer. Releasing capture is the normal
 * path; the pointer-up fallback covers browsers where the eventual click would
 * otherwise be retargeted to the tab rail instead of the button under it.
 */
export function LaunchReadyRuntime(): null {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const button = tabButtonFromPoint(event);
      if (!button) return;
      const tabs = button.closest<HTMLElement>(".cw-tabs");
      if (!tabs) return;
      const pointerId = event.pointerId;

      queueMicrotask(() => {
        try {
          if (tabs.hasPointerCapture(pointerId))
            tabs.releasePointerCapture(pointerId);
        } catch {
          // Pointer capture is optional; pointer-up fallback remains available.
        }
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      const button = tabButtonFromPoint(event);
      if (!button) return;

      const directTarget =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".cw-tabs > button")
          : null;
      if (directTarget === button) return;

      queueMicrotask(() => button.click());
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
    };
  }, []);

  useEffect(() => {
    type SurfaceTone = "light" | "dark";
    const toneColour: Record<SurfaceTone, string> = {
      dark: "#c8f06a",
      light: "#12382d",
    };

    const applyTone = (
      tone: SurfaceTone,
      topTone: SurfaceTone = tone,
      bottomTone: SurfaceTone = tone,
      boundary = 50,
    ) => {
      const launcher = document.querySelector<HTMLElement>(".cw-launcher");
      if (!launcher) return;
      launcher.dataset.surfaceTone = tone;

      const stops = launcher.querySelectorAll<SVGStopElement>(".bl__surface-stop");
      if (stops.length !== 4) return;
      const transition = topTone === bottomTone ? 0 : 3.5;
      const topOffset = Math.max(0, Math.min(100, boundary - transition));
      const bottomOffset = Math.max(0, Math.min(100, boundary + transition));
      const offsets = [0, topOffset, bottomOffset, 100];
      const colours = [toneColour[topTone], toneColour[topTone], toneColour[bottomTone], toneColour[bottomTone]];
      stops.forEach((stop, index) => {
        stop.setAttribute("offset", `${offsets[index]}%`);
        stop.style.stopColor = colours[index];
      });
    };

    const onMessage = (event: MessageEvent) => {
      if (window.parent !== window && event.source !== window.parent) return;
      const data = event.data as {
        source?: string;
        type?: string;
        tone?: string;
        topTone?: string;
        bottomTone?: string;
        boundary?: number;
      } | null;
      if (
        data?.source !== "site-assistant-parent" ||
        data.type !== "surface-tone"
      )
        return;
      if (data.tone === "light" || data.tone === "dark") {
        const topTone = data.topTone === "light" || data.topTone === "dark" ? data.topTone : data.tone;
        const bottomTone =
          data.bottomTone === "light" || data.bottomTone === "dark" ? data.bottomTone : data.tone;
        applyTone(data.tone, topTone, bottomTone, Number.isFinite(data.boundary) ? data.boundary : 50);
      }
    };

    const toneFromBackground = (value: string): "light" | "dark" | null => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      if (channels.length < 3 || (channels.length > 3 && channels[3] < 0.18))
        return null;
      const [red, green, blue] = channels.slice(0, 3).map((channel) => {
        const normalized = Math.max(0, Math.min(255, channel)) / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : Math.pow((normalized + 0.055) / 1.055, 2.4);
      });
      return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 0.5
        ? "light"
        : "dark";
    };

    const toneAtPoint = (x: number, y: number): SurfaceTone => {
      const stack = document.elementsFromPoint(x, y);
      const surface = stack.find(
        (element) =>
          !element.closest(".cw-widget") &&
          element.id !== "dv-assistant-root" &&
          element.id !== "site-assistant-widget-host",
      );
      const declared =
        surface?.closest<HTMLElement>("[data-nav-tone]")?.dataset.navTone;
      if (declared === "light" || declared === "dark") {
        return declared;
      }

      let current: Element | null | undefined = surface;
      while (current instanceof Element) {
        const tone = toneFromBackground(
          window.getComputedStyle(current).backgroundColor,
        );
        if (tone) {
          return tone;
        }
        current = current.parentElement;
      }
      return "light";
    };

    let frame = 0;
    const detectDirectSurface = () => {
      frame = 0;
      const launcher = document.querySelector<HTMLElement>(".cw-launcher");
      if (!launcher) return;
      const mark = launcher.querySelector<HTMLElement>(".bl--launcher") ?? launcher;
      const rect = mark.getBoundingClientRect();
      const x = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
      const sampleCount = 13;
      const tones = Array.from({ length: sampleCount }, (_, index) => {
        const ratio = index / (sampleCount - 1);
        const y = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height * ratio));
        return toneAtPoint(x, y);
      });
      const topTone = tones[0];
      const bottomTone = tones[tones.length - 1];
      const centreTone = tones[Math.floor(tones.length / 2)];
      let boundary = 50;

      if (topTone !== bottomTone) {
        const transitionIndex = tones.findIndex((tone) => tone !== topTone);
        if (transitionIndex > 0)
          boundary = ((transitionIndex - 0.5) / (sampleCount - 1)) * 100;
      }

      applyTone(centreTone, topTone, bottomTone, boundary);
    };

    const scheduleDirectSurface = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(detectDirectSurface);
    };

    const settleTimers: number[] = [];
    if (window.parent === window) {
      scheduleDirectSurface();
      [80, 360, 1_100].forEach((delay) => {
        settleTimers.push(window.setTimeout(scheduleDirectSurface, delay));
      });
      window.addEventListener("scroll", scheduleDirectSurface, {
        passive: true,
      });
      window.addEventListener("resize", scheduleDirectSurface, {
        passive: true,
      });
    } else {
      applyTone("dark");
    }

    window.addEventListener("message", onMessage);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", scheduleDirectSurface);
      window.removeEventListener("resize", scheduleDirectSurface);
    };
  }, []);

  return null;
}
