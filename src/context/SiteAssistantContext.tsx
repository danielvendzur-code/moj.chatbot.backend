import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChameleonMachine } from "../hooks/useChameleonMachine";
import {
  installSiteAssistantGlobal,
  SITE_ASSISTANT_OPEN_EVENT,
  SITE_OVERLAY_EVENT,
} from "../lib/siteAssistant";
import type {
  ChameleonState,
  OpenSiteAssistantOptions,
} from "../types/assistant";

type AssistantContextValue = {
  isOpen: boolean;
  blocked: boolean;
  request: OpenSiteAssistantOptions;
  requestId: number;
  chameleonState: ChameleonState;
  reducedMotion: boolean;
  flyVisible: boolean;
  promptVisible: boolean;
  sceneVisible: boolean;
  launcherReady: boolean;
  open: (options: OpenSiteAssistantOptions) => void;
  close: () => void;
  minimize: () => void;
  dismissPrompt: () => void;
  notifyActivity: () => void;
};

const SiteAssistantContext = createContext<AssistantContextValue | null>(null);

function pageHasBlockingOverlay(): boolean {
  const body = document.body;
  return body.dataset.siteOverlayOpen === "true" || body.hasAttribute("data-site-overlay-open");
}

export function SiteAssistantProvider({ children }: PropsWithChildren): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [request, setRequest] = useState<OpenSiteAssistantOptions>({ entry: "builder" });
  const [requestId, setRequestId] = useState(0);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const blockedRef = useRef(false);
  const machine = useChameleonMachine({ isOpen, blocked });

  const open = useCallback(
    (options: OpenSiteAssistantOptions) => {
      if (blockedRef.current || pageHasBlockingOverlay()) return;
      returnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setRequest(options);
      setRequestId((value) => value + 1);
      setIsOpen(true);
    },
    [],
  );

  const restoreFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      const target = returnFocusRef.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
      else document.getElementById("site-assistant-launcher")?.focus({ preventScroll: true });
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    restoreFocus();
  }, [restoreFocus]);

  const minimize = useCallback(() => {
    setIsOpen(false);
    restoreFocus();
  }, [restoreFocus]);

  useEffect(() => installSiteAssistantGlobal(), []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenSiteAssistantOptions>).detail;
      if (detail?.entry) open(detail);
    };
    window.addEventListener(SITE_ASSISTANT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SITE_ASSISTANT_OPEN_EVENT, onOpen);
  }, [open]);

  useEffect(() => {
    const updateBlocked = (nextBlocked: boolean) => {
      blockedRef.current = nextBlocked;
      setBlocked(nextBlocked);
    };
    const sync = () => updateBlocked(pageHasBlockingOverlay());
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-site-overlay-open"],
    });
    const onOverlay = (event: Event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      if (typeof detail?.open === "boolean") updateBlocked(detail.open);
      else sync();
    };
    window.addEventListener(SITE_OVERLAY_EVENT, onOverlay);
    sync();
    return () => {
      observer.disconnect();
      window.removeEventListener(SITE_OVERLAY_EVENT, onOverlay);
    };
  }, []);

  useEffect(() => {
    if (blocked && isOpen) close();
  }, [blocked, close, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };
    document.documentElement.dataset.assistantOpen = "true";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      delete document.documentElement.dataset.assistantOpen;
      Object.assign(document.body.style, previous);
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [isOpen]);

  useEffect(() => {
    window.__siteAssistantDebug = {
      getState: () => machine.state,
      triggerFly: machine.triggerFly,
    };
    return () => {
      delete window.__siteAssistantDebug;
    };
  }, [machine.state, machine.triggerFly]);

  const value = useMemo<AssistantContextValue>(
    () => ({
      isOpen,
      blocked,
      request,
      requestId,
      chameleonState: machine.state,
      reducedMotion: machine.reducedMotion,
      flyVisible: machine.flyVisible,
      promptVisible: machine.promptVisible,
      sceneVisible: machine.sceneVisible,
      launcherReady: machine.launcherReady,
      open,
      close,
      minimize,
      dismissPrompt: machine.dismissPrompt,
      notifyActivity: machine.notifyActivity,
    }),
    [blocked, close, isOpen, machine, minimize, open, request, requestId],
  );

  return <SiteAssistantContext.Provider value={value}>{children}</SiteAssistantContext.Provider>;
}

export function useSiteAssistant(): AssistantContextValue {
  const context = useContext(SiteAssistantContext);
  if (!context) throw new Error("useSiteAssistant must be used inside SiteAssistantProvider");
  return context;
}
