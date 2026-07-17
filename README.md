# Webový asistent — konfigurátor riešenia

Samostatný React/TypeScript widget s viac-krokovým konfigurátorom inšpirovaným osvedčeným
rozložením DERAT asistenta (výberové karty, krokovanie s bodkami, kontaktný formulár so
zhrnutím). Vizuál „Aurora Fresh — liquid glass": svetlé mliečne sklo (backdrop-filter) nad
jemným aurora gradientom mint → cyan → limetka, prepínač režimov ako iOS segmented control
s pružinovým sklom a chipy/tlačidlá so sekvenciou „border sa obkreslí tenkou čiarkou →
celý prvok sa rozsvieti".

Verejná ukážka: <https://danielvendzur-code.github.io/moj.chatbot.backend/>

## Logo

Logom je čistá chatová bublina s tromi zlatými bodkami (`src/components/widget/BubbleLogo.tsx`)
v troch veľkostiach — launcher, hlavička a avatar pri správach. (Skorší pixel-art maskot
chameleóna zostáva dostupný v git histórii, keby sa hodil neskôr.)

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

- `src/components/widget/AssistantWidget.tsx` — launcher, teaser, okno, prepínanie režimov.
- `src/components/widget/BubbleLogo.tsx` — logo asistenta (chatová bublina, tri veľkosti).
- `src/components/widget/AssistantConversation.tsx` — konverzácia s rýchlymi čipmi.
- `src/components/widget/ToolCalculator.tsx` — 6-krokový konfigurátor: záujem → odvetvie → nasadenie → funkcie → objem dopytov → zhrnutie + kontakt (s poďakovaním).
- `src/lib/assistantFlow.ts` — dáta krokov, odporúčané funkcie podľa výberu, číslo návrhu.
- `src/lib/siteAssistant.ts` — verejné API a integračné udalosti.

## Vloženie na web

Jeden riadok pred `</body>`:

```html
<script src="https://danielvendzur-code.github.io/moj.chatbot.backend/widget.js" defer></script>
```

Skript si sám pripojí štýly (`widget.css`), vytvorí widget v pravom dolnom rohu
a prevezme font hostiteľskej stránky, takže vyzerá ako natívna súčasť webu.

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
