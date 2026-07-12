import { useEffect, useRef } from "react";

type DemoViewerProps = {
  open: boolean;
  onClose: () => void;
};

export function DemoViewer({ open, onClose }: DemoViewerProps): JSX.Element | null {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus({ preventScroll: true });
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="demo-viewer-layer">
      <button className="demo-viewer-scrim" type="button" aria-label="Zavrieť ukážku" onClick={onClose} />
      <section className="demo-viewer" role="dialog" aria-modal="true" aria-labelledby="demo-viewer-title">
        <header>
          <div>
            <span>Ukážka systému</span>
            <h2 id="demo-viewer-title">Dopyt, ktorý má jasnú štruktúru</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Zavrieť ukážku">×</button>
        </header>
        <div className="demo-viewer__canvas">
          <aside>
            <span className="demo-viewer__brand">DV.</span>
            <span className="demo-viewer__nav-line demo-viewer__nav-line--active" />
            <span className="demo-viewer__nav-line" />
            <span className="demo-viewer__nav-line" />
          </aside>
          <main>
            <div className="demo-viewer__topline"><span /><span /></div>
            <div className="demo-viewer__metrics">
              <article><small>Nové dopyty</small><strong>24</strong><em>+18 %</em></article>
              <article><small>Kompletné údaje</small><strong>91 %</strong><em>tento mesiac</em></article>
              <article><small>Čas spracovania</small><strong>−32 %</strong><em>oproti formuláru</em></article>
            </div>
            <div className="demo-viewer__rows">
              {["Kalkulácia terasy", "Výber tienenia", "Rezervácia obhliadky"].map((label, index) => (
                <div key={label}>
                  <span className="demo-viewer__avatar">0{index + 1}</span>
                  <p><strong>{label}</strong><small>Kompletné podklady pripravené</small></p>
                  <em>Nové</em>
                </div>
              ))}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
