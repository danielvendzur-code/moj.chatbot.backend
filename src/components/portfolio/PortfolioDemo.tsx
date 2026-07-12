import { useCallback, useEffect, useState } from "react";
import { openSiteAssistant, setSiteOverlayOpen } from "../../lib/siteAssistant";
import type { AssistantPreset } from "../../types/assistant";
import { DemoViewer } from "./DemoViewer";

const SERVICES: Array<{
  number: string;
  title: string;
  description: string;
  preset: AssistantPreset;
  tag: string;
}> = [
  {
    number: "01",
    title: "Cenové kalkulačky",
    description: "Okamžitý orientačný výpočet, ktorý pracuje s reálnymi premennými vášho produktu.",
    preset: "calculator",
    tag: "výpočet",
  },
  {
    number: "02",
    title: "Dopytoví asistenti",
    description: "Premyslené otázky pripravia podklady skôr, než dopyt pristane vo vašom e-maile.",
    preset: "inquiry",
    tag: "kvalifikácia",
  },
  {
    number: "03",
    title: "Produktoví poradcovia",
    description: "Pomáhajú návštevníkovi vybrať si bez tlaku a bez nekonečného porovnávania.",
    preset: "advisor",
    tag: "odporúčanie",
  },
  {
    number: "04",
    title: "Rezervačné flow",
    description: "Termín prichádza až vo chvíli, keď máte potrebný kontext aj očakávania.",
    preset: "booking",
    tag: "rezervácia",
  },
];

export function PortfolioDemo(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const overlayOpen = menuOpen || demoOpen;

  useEffect(() => {
    setSiteOverlayOpen(overlayOpen);
    return () => setSiteOverlayOpen(false);
  }, [overlayOpen]);

  const closeDemo = useCallback(() => setDemoOpen(false), []);

  return (
    <div className="portfolio-page">
      <header className={`site-header${menuOpen ? " site-header--menu-open" : ""}`}>
        <a className="site-logo" href="#top" aria-label="Daniel Vendzur — domov">
          <span>DV</span>
          <small>digitálne nástroje</small>
        </a>
        <nav className="desktop-nav" aria-label="Hlavná navigácia">
          <a href="#pristup">Prístup</a>
          <a href="#nastroje">Nástroje</a>
          <a href="#kontakt">Kontakt</a>
        </nav>
        <button
          className="header-cta"
          type="button"
          onClick={() => openSiteAssistant({ entry: "recommend" })}
        >
          Prebrať nápad <span aria-hidden="true">↗</span>
        </button>
        <button
          className="mobile-menu-button"
          data-testid="mobile-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">{menuOpen ? "Zavrieť menu" : "Otvoriť menu"}</span>
          <i /><i />
        </button>
      </header>

      {menuOpen ? (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobilná navigácia">
          <a href="#pristup" onClick={() => setMenuOpen(false)}>Prístup</a>
          <a href="#nastroje" onClick={() => setMenuOpen(false)}>Nástroje</a>
          <a href="#kontakt" onClick={() => setMenuOpen(false)}>Kontakt</a>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSiteOverlayOpen(false);
              window.setTimeout(() => openSiteAssistant({ entry: "builder" }), 0);
            }}
          >
            Vyskladať nástroj <span aria-hidden="true">↗</span>
          </button>
        </nav>
      ) : null}

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="section-kicker"><span /> Weby, ktoré pokračujú ďalej</p>
            <h1>
              Digitálne nástroje,
              <span>ktoré pomáhajú rozhodnúť sa.</span>
            </h1>
            <p className="hero-lead">
              Navrhujem kalkulačky, dopytových asistentov a produktové flow, ktoré premieňajú
              návštevu webu na konkrétny ďalší krok.
            </p>
            <div className="hero-actions">
              <button className="page-primary" type="button" onClick={() => openSiteAssistant({ entry: "builder" })}>
                Vyskladať vlastný nástroj <span aria-hidden="true">↗</span>
              </button>
              <button className="page-secondary" data-testid="demo-open" type="button" onClick={() => setDemoOpen(true)}>
                Pozrieť princíp <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="hero-proof" aria-label="Kľúčové vlastnosti">
              <span><b>01</b> Zrozumiteľné</span>
              <span><b>02</b> Merateľné</span>
              <span><b>03</b> Na mieru</span>
            </div>
          </div>

          <div className="hero-stage" aria-hidden="true">
            <div className="hero-stage__grid" />
            <article className="stage-card stage-card--main">
              <header><span>Konfigurátor projektu</span><i>•••</i></header>
              <div className="stage-card__question">Čo má nový nástroj vyriešiť?</div>
              <div className="stage-card__option stage-card__option--selected"><span>✓</span> Presnejšie dopyty</div>
              <div className="stage-card__option"><span /> Rýchlejší výber</div>
              <div className="stage-card__footer"><span>01 / 03</span><b>Pokračovať →</b></div>
            </article>
            <article className="stage-card stage-card--metric">
              <small>Pripravené podklady</small>
              <strong>91<sup>%</sup></strong>
              <span>bez ďalšieho telefonátu</span>
            </article>
            <div className="stage-note">premyslené flow <span>↗</span></div>
          </div>
        </section>

        <section id="pristup" className="approach-section">
          <div className="section-heading">
            <p className="section-kicker"><span /> Ako nad tým premýšľam</p>
            <h2>Web nemá byť katalóg.<br />Má pomôcť urobiť ďalší krok.</h2>
          </div>
          <div className="approach-copy">
            <p>
              Návštevník nepotrebuje viac možností. Potrebuje správnu otázku v správnej chvíli
              a istotu, že výsledok dáva zmysel.
            </p>
            <button type="button" onClick={() => openSiteAssistant({ entry: "recommend" })}>
              Nájsť vhodný formát <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>

        <section id="nastroje" className="services-section">
          <header className="services-header">
            <div>
              <p className="section-kicker section-kicker--light"><span /> Čo môžeme postaviť</p>
              <h2>Štyri užitočné začiatky.</h2>
            </div>
            <p>Každý nástroj začína procesom, nie technológiou.</p>
          </header>
          <div className="services-grid">
            {SERVICES.map((service) => (
              <article className="service-card" key={service.number}>
                <div className="service-card__top"><span>{service.number}</span><small>{service.tag}</small></div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <button
                  type="button"
                  data-testid={`preset-${service.preset}`}
                  onClick={() => openSiteAssistant({ entry: service.preset, preset: service.preset })}
                >
                  Nastaviť ukážku <span aria-hidden="true">↗</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="process-section">
          <p className="section-kicker"><span /> Od problému k nástroju</p>
          <div className="process-grid">
            <article><span>01</span><h3>Pochopiť rozhodnutie</h3><p>Čo návštevník potrebuje vedieť, aby mohol pokračovať?</p></article>
            <article><span>02</span><h3>Zjednodušiť vstupy</h3><p>Vyberieme iba otázky, ktoré ovplyvnia výsledok.</p></article>
            <article><span>03</span><h3>Ukázať ďalší krok</h3><p>Výsledok musí byť konkrétny, zrozumiteľný a použiteľný.</p></article>
          </div>
        </section>

        <section id="kontakt" className="contact-section">
          <div>
            <p className="section-kicker section-kicker--light"><span /> Máte proces, ktorý sa opakuje?</p>
            <h2>Možno z neho vieme spraviť nástroj.</h2>
          </div>
          <button type="button" onClick={() => openSiteAssistant({ entry: "builder" })}>
            Začať krátkym výberom <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>

      <footer className="site-footer">
        <a className="site-logo site-logo--footer" href="#top"><span>DV</span><small>digitálne nástroje</small></a>
        <p>Vizuálny prototyp · Žiadne údaje sa neodosielajú.</p>
        <a href="#top">Späť hore ↑</a>
      </footer>

      <DemoViewer open={demoOpen} onClose={closeDemo} />
    </div>
  );
}
