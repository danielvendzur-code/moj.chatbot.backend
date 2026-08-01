(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.src) return;

  var HOST_ID = "site-assistant-widget-host";
  var WIDGET_SOURCE = "site-assistant-widget";
  var PARENT_SOURCE = "site-assistant-parent";
  var OPEN_EVENT = "site-assistant:open";
  var MOBILE_QUERY = "(max-width: 560px)";
  var FOCUS_RESTORE_MS = 320;
  var scriptUrl = new URL(script.src, document.baseURI);
  var baseUrl = new URL("./", scriptUrl);
  var widgetOrigin = baseUrl.origin;

  function boot() {
    if (document.getElementById(HOST_ID)) return;

    var host = document.createElement("div");
    host.id = HOST_ID;
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("inset", "0", "important");
    host.style.setProperty("width", "100vw", "important");
    host.style.setProperty("height", "100vh", "important");
    host.style.setProperty("height", "100dvh", "important");
    host.style.setProperty("z-index", "2147483000", "important");
    host.style.setProperty("pointer-events", "none", "important");
    host.style.setProperty("overflow", "visible", "important");
    host.style.setProperty("background", "transparent", "important");

    var shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = [
      "<style>",
      ":host,*{box-sizing:border-box}",
      "#site-assistant-frame{position:absolute;right:0;bottom:0;width:120px;height:120px;max-width:100vw;max-height:100dvh;border:0;margin:0;padding:0;background:transparent;color-scheme:normal;display:block;opacity:0;visibility:hidden;pointer-events:none;transform:translateZ(0);backface-visibility:hidden;transition:width .28s cubic-bezier(.2,.8,.2,1),height .28s cubic-bezier(.2,.8,.2,1),opacity .18s ease;}",
      "#site-assistant-frame.is-ready{opacity:1;visibility:visible;pointer-events:auto}",
      "#site-assistant-frame.is-open{width:min(470px,calc(100vw - 12px));height:min(760px,calc(100dvh - 12px));}",
      "@media(max-width:560px){#site-assistant-frame.is-open{top:var(--site-assistant-vv-top,0px);right:auto;bottom:auto;left:var(--site-assistant-vv-left,0px);width:100vw;width:var(--site-assistant-vv-width,100vw);height:100vh;height:var(--site-assistant-vv-height,100dvh);max-width:none;max-height:none;}}",
      "@media(prefers-reduced-motion:reduce){#site-assistant-frame{transition:opacity .01ms linear;}}",
      "</style>",
      '<iframe id="site-assistant-frame" title="Chat — navrhne riešenie a odpovie na otázky" scrolling="no" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-write" allowtransparency="true"></iframe>',
    ].join("");

    document.body.appendChild(host);

    var frame = shadow.getElementById("site-assistant-frame");
    var mobileMedia = window.matchMedia(MOBILE_QUERY);
    var visualViewport = window.visualViewport;
    var visualViewportFrame = 0;
    var ready = false;
    var open = false;
    var pendingOpen = null;
    var returnFocusElement = null;
    var returnFocusTimer = 0;
    var pageLocked = false;
    var savedHtmlOverflow = "";
    var savedBodyOverflow = "";
    var savedScrollX = 0;
    var savedScrollY = 0;

    function isMobile() {
      return mobileMedia.matches;
    }

    function viewportPixels(value, minimum) {
      var safe = Number.isFinite(value) ? value : minimum;
      return Math.max(minimum, Math.round(safe * 100) / 100) + "px";
    }

    function clearVisualViewportSize() {
      frame.style.removeProperty("--site-assistant-vv-top");
      frame.style.removeProperty("--site-assistant-vv-left");
      frame.style.removeProperty("--site-assistant-vv-width");
      frame.style.removeProperty("--site-assistant-vv-height");
    }

    /* On iOS the layout viewport can stay full-height while the visual viewport
       shrinks above the software keyboard. Size and offset the open iframe to
       that actually visible rectangle so the composer never sits underneath
       the keyboard. The CSS fallbacks still cover browsers without this API. */
    function syncVisualViewport() {
      if (!isMobile() || !visualViewport) {
        clearVisualViewportSize();
        return;
      }

      frame.style.setProperty(
        "--site-assistant-vv-top",
        viewportPixels(visualViewport.offsetTop, 0),
      );
      frame.style.setProperty(
        "--site-assistant-vv-left",
        viewportPixels(visualViewport.offsetLeft, 0),
      );
      frame.style.setProperty(
        "--site-assistant-vv-width",
        viewportPixels(visualViewport.width, 1),
      );
      frame.style.setProperty(
        "--site-assistant-vv-height",
        viewportPixels(visualViewport.height, 1),
      );
    }

    function scheduleVisualViewportSync() {
      if (visualViewportFrame) return;
      visualViewportFrame = window.requestAnimationFrame(function () {
        visualViewportFrame = 0;
        syncVisualViewport();
      });
    }

    function normalizeOptions(value) {
      var validEntries = [
        "recommend",
        "builder",
        "calculator",
        "inquiry",
        "advisor",
        "booking",
      ];
      var validPresets = ["calculator", "inquiry", "advisor", "booking"];
      var entry =
        value && validEntries.indexOf(value.entry) >= 0
          ? value.entry
          : "builder";
      var preset =
        value && validPresets.indexOf(value.preset) >= 0
          ? value.preset
          : undefined;
      return preset ? { entry: entry, preset: preset } : { entry: entry };
    }

    function cancelFocusRestore() {
      if (!returnFocusTimer) return;
      window.clearTimeout(returnFocusTimer);
      returnFocusTimer = 0;
    }

    function rememberReturnFocus() {
      cancelFocusRestore();
      var candidate = document.activeElement;
      if (
        !(candidate instanceof HTMLElement) ||
        candidate === document.body ||
        candidate === document.documentElement ||
        candidate === host ||
        candidate === frame
      ) {
        returnFocusElement = null;
        return;
      }
      returnFocusElement = candidate;
    }

    function restoreReturnFocusAfterExit() {
      cancelFocusRestore();
      var candidate = returnFocusElement;
      returnFocusElement = null;
      if (!candidate) return;

      var delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : FOCUS_RESTORE_MS;
      returnFocusTimer = window.setTimeout(function () {
        returnFocusTimer = 0;
        if (
          !candidate.isConnected ||
          candidate.matches(":disabled, [aria-disabled='true']") ||
          candidate.getClientRects().length === 0
        )
          return;
        var style = window.getComputedStyle(candidate);
        if (style.display === "none" || style.visibility === "hidden") return;
        try {
          candidate.focus({ preventScroll: true });
        } catch {
          /* Focus restoration is an enhancement; never move the page as a fallback. */
        }
      }, delay);
    }

    function postToWidget(type, extra) {
      if (!frame.contentWindow) return;
      var message = { source: PARENT_SOURCE, type: type };
      if (extra) {
        Object.keys(extra).forEach(function (key) {
          message[key] = extra[key];
        });
      }
      frame.contentWindow.postMessage(message, widgetOrigin);
    }

    function lockParentPage() {
      if (pageLocked || !isMobile()) return;
      pageLocked = true;
      savedScrollX = window.scrollX || window.pageXOffset || 0;
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      savedHtmlOverflow = document.documentElement.style.overflow;
      savedBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }

    function unlockParentPage() {
      if (!pageLocked) return;
      pageLocked = false;
      document.documentElement.style.overflow = savedHtmlOverflow;
      document.body.style.overflow = savedBodyOverflow;
      window.requestAnimationFrame(function () {
        window.scrollTo(savedScrollX, savedScrollY);
      });
    }

    function applyOpenState(nextOpen) {
      open = Boolean(nextOpen);
      frame.classList.toggle("is-open", open);
      syncVisualViewport();
      if (open) lockParentPage();
      else unlockParentPage();
    }

    function sendViewport() {
      if (!ready) return;
      postToWidget("viewport", { mobile: isMobile() });
    }

    function sendPendingOpen() {
      if (
        !ready ||
        !pendingOpen ||
        document.body.dataset.siteMenuOpen === "true"
      )
        return;
      var options = pendingOpen;
      pendingOpen = null;
      postToWidget("open", { options: options });
    }

    function requestOpen(options) {
      if (!open && !pendingOpen) rememberReturnFocus();
      pendingOpen = normalizeOptions(options);
      sendPendingOpen();
    }

    function publicOpen(options) {
      requestOpen(options);
    }
    publicOpen.__siteAssistantEmbed = true;
    window.openSiteAssistant = publicOpen;

    function onOpenEvent(event) {
      requestOpen(event && event.detail);
    }

    function onMessage(event) {
      if (event.source !== frame.contentWindow || event.origin !== widgetOrigin)
        return;
      var data = event.data || {};
      if (data.source !== WIDGET_SOURCE) return;

      if (data.type === "ready") {
        ready = true;
        frame.classList.add("is-ready");
        applyOpenState(data.open === true);
        sendViewport();
        sendPendingOpen();
        return;
      }

      if (data.type === "state") {
        var wasOpen = open;
        applyOpenState(data.open === true);
        if (wasOpen && data.open !== true) restoreReturnFocusAfterExit();
      }
    }

    function onViewportChange() {
      if (open) {
        unlockParentPage();
        if (isMobile()) lockParentPage();
      }
      syncVisualViewport();
      sendViewport();
    }

    function syncSiteMenu() {
      var menuOpen = document.body.dataset.siteMenuOpen === "true";
      host.style.setProperty(
        "visibility",
        menuOpen ? "hidden" : "visible",
        "important",
      );

      if (menuOpen) {
        cancelFocusRestore();
        returnFocusElement = null;
      }

      if (menuOpen && open) {
        postToWidget("close");
        applyOpenState(false);
      }

      if (!menuOpen) sendPendingOpen();
    }

    var menuObserver = new MutationObserver(syncSiteMenu);
    menuObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-site-menu-open"],
    });
    syncSiteMenu();

    window.addEventListener(OPEN_EVENT, onOpenEvent);
    window.addEventListener("message", onMessage);
    if (visualViewport) {
      visualViewport.addEventListener("resize", scheduleVisualViewportSync, {
        passive: true,
      });
      visualViewport.addEventListener("scroll", scheduleVisualViewportSync, {
        passive: true,
      });
    }

    function onPageHide() {
      menuObserver.disconnect();
      unlockParentPage();
      cancelFocusRestore();
      returnFocusElement = null;
      if (visualViewportFrame) window.cancelAnimationFrame(visualViewportFrame);
      visualViewportFrame = 0;
      if (visualViewport) {
        visualViewport.removeEventListener(
          "resize",
          scheduleVisualViewportSync,
        );
        visualViewport.removeEventListener(
          "scroll",
          scheduleVisualViewportSync,
        );
      }
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
      window.removeEventListener("message", onMessage);
      if (typeof mobileMedia.removeEventListener === "function") {
        mobileMedia.removeEventListener("change", onViewportChange);
      } else if (typeof mobileMedia.removeListener === "function") {
        mobileMedia.removeListener(onViewportChange);
      }
      if (window.openSiteAssistant === publicOpen)
        delete window.openSiteAssistant;
    }
    window.addEventListener("pagehide", onPageHide, { once: true });
    if (typeof mobileMedia.addEventListener === "function") {
      mobileMedia.addEventListener("change", onViewportChange);
    } else if (typeof mobileMedia.addListener === "function") {
      mobileMedia.addListener(onViewportChange);
    }
    syncVisualViewport();

    var widgetUrl = new URL(baseUrl.href);
    widgetUrl.searchParams.set("embed", "1");
    widgetUrl.searchParams.set("viewport", isMobile() ? "mobile" : "desktop");
    // The HTML is tiny; a fresh URL makes every page load resolve the newest hashed build.
    widgetUrl.searchParams.set("build", Date.now().toString(36));
    frame.src = widgetUrl.href;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
