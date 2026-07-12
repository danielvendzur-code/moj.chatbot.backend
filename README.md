# Portfóliový asistent s pixelovým chameleónom

Vizuálny React/TypeScript prototyp asistenta pre portfóliovú stránku. Funguje kompletne lokálne: otváranie, presety, viac-krokový výber, súhrn, animovaný maskot, responzívny panel a ochrana pred konfliktmi s ostatnými prekryvmi.

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

## Architektúra

- `src/components/assistant/` — vizuálne komponenty asistenta, launchera, maskota, výzvy a muchy.
- `src/hooks/useChameleonMachine.ts` — centrálne časovanie a stavový automat chameleóna.
- `src/lib/assistantFlow.ts` — otázky, možnosti a lokálne súhrny jednotlivých flow.
- `src/context/SiteAssistantContext.tsx` — otvorenie/zatvorenie, scroll lock, konflikt prekryvov a obnovenie focusu.
- `src/lib/siteAssistant.ts` — verejné API a integračné udalosti.

## CTA API

```ts
openSiteAssistant({ entry: "builder" });
openSiteAssistant({ entry: "calculator", preset: "calculator" });
openSiteAssistant({ entry: "inquiry", preset: "inquiry" });
openSiteAssistant({ entry: "advisor", preset: "advisor" });
openSiteAssistant({ entry: "booking", preset: "booking" });
```

Funkcia je dostupná ako import aj cez `window.openSiteAssistant(options)`. Blokujúci modal alebo menu môže použiť `setSiteOverlayOpen(true | false)`, prípadne atribút `data-site-overlay-open` na `<body>` a udalosť `site:overlay-change`.

## Aktuálny rozsah

Prototyp nič neodosiela ani neukladá. Backend, e-mail, databáza, CRM, kalendár a reálne spracovanie formulára patria do ďalšej fázy.
