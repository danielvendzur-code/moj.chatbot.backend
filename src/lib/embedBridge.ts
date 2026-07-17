import type { OpenSiteAssistantOptions } from "../types/assistant";

const WIDGET_MESSAGE_SOURCE = "site-assistant-widget";
const PARENT_MESSAGE_SOURCE = "site-assistant-parent";

type EmbedViewport = "desktop" | "mobile";

type EmbedBridgeHandlers = {
  open: (options: OpenSiteAssistantOptions) => void;
  close: () => void;
};

const entries = new Set<OpenSiteAssistantOptions["entry"]>([
  "recommend",
  "builder",
  "calculator",
  "inquiry",
  "advisor",
  "booking",
]);

const presets = new Set<NonNullable<OpenSiteAssistantOptions["preset"]>>([
  "calculator",
  "inquiry",
  "advisor",
  "booking",
]);

function getParentOrigin(): string | null {
  if (!document.referrer) return null;

  try {
    const origin = new URL(document.referrer).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

function normalizeOptions(value: unknown): OpenSiteAssistantOptions {
  if (!value || typeof value !== "object") return { entry: "builder" };

  const candidate = value as Partial<OpenSiteAssistantOptions>;
  const entry = candidate.entry && entries.has(candidate.entry) ? candidate.entry : "builder";
  const preset = candidate.preset && presets.has(candidate.preset) ? candidate.preset : undefined;

  return preset ? { entry, preset } : { entry };
}

function postToParent(type: "ready" | "state", open: boolean): void {
  if (!isEmbedMode() || window.parent === window) return;

  window.parent.postMessage(
    {
      source: WIDGET_MESSAGE_SOURCE,
      type,
      open,
    },
    getParentOrigin() ?? "*",
  );
}

export function isEmbedMode(): boolean {
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

export function getInitialEmbedViewport(): EmbedViewport {
  return new URLSearchParams(window.location.search).get("viewport") === "mobile"
    ? "mobile"
    : "desktop";
}

export function installEmbedBridge({ open, close }: EmbedBridgeHandlers): () => void {
  if (!isEmbedMode() || window.parent === window) return () => undefined;

  const parentOrigin = getParentOrigin();
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    if (parentOrigin && event.origin !== parentOrigin) return;
    if (!event.data || event.data.source !== PARENT_MESSAGE_SOURCE) return;

    if (event.data.type === "open") {
      open(normalizeOptions(event.data.options));
      return;
    }

    if (event.data.type === "close") {
      close();
      return;
    }

    if (event.data.type === "viewport") {
      const viewport: EmbedViewport = event.data.mobile === true ? "mobile" : "desktop";
      document.documentElement.dataset.embedViewport = viewport;
    }
  };

  window.addEventListener("message", onMessage);
  postToParent("ready", false);

  return () => window.removeEventListener("message", onMessage);
}

export function announceEmbedState(open: boolean): void {
  postToParent("state", open);
}
