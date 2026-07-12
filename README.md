# Chameleon AI widget

Samostatný React/TypeScript widget inšpirovaný rozložením DERAT asistenta. Obsahuje 80 px chameleónovú bublinu, veľký preview text, AI konverzáciu, prepínanie na kalkulačku návrhu, viac-krokový výber, súhrn a animáciu chytania muchy.

Verejná ukážka: <https://danielvendzur-code.github.io/moj.chatbot.backend/>

## Spustenie

```bash
pnpm install
pnpm dev
```

Produkčná kontrola:

```bash
pnpm check
pnpm build
```

Push do vetvy `main` automaticky spustí workflow `.github/workflows/deploy-pages.yml`, ktorý vytvorí produkčný Vite build a nasadí priečinok `dist` na GitHub Pages.

## Architektúra

- `src/components/widget/` — launcher, konverzácia, kalkulačka, ikony a sprite maskota.
- `src/hooks/useFlyCatch.ts` — náhodné aj interaktívne načasovanie chytania muchy.
- `src/lib/assistantFlow.ts` — možnosti a lokálne súhrny kalkulačky.
- `src/lib/siteAssistant.ts` — verejné API a integračné udalosti.
- `public/chameleon-sprite.png` — dodaný chameleónový sprite použitý bez generovania nového dizajnu.

## CTA API

```ts
openSiteAssistant({ entry: "builder" });
openSiteAssistant({ entry: "calculator", preset: "calculator" });
openSiteAssistant({ entry: "inquiry", preset: "inquiry" });
openSiteAssistant({ entry: "advisor", preset: "advisor" });
openSiteAssistant({ entry: "booking", preset: "booking" });
```

Funkcia je dostupná ako import aj cez `window.openSiteAssistant(options)`.

## Aktuálny rozsah

Prototyp nič neodosiela ani neukladá. Backend, e-mail, databáza, CRM, kalendár a reálne spracovanie formulára patria do ďalšej fázy.
