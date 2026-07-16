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

## Vloženie na iný web

Stabilný loader vytvorí izolovaný iframe a pri každom načítaní stránky si otvorí najnovší
GitHub Pages build. Hostiteľský web preto nemusí poznať hash JavaScript alebo CSS súborov.

```html
<script
  src="https://danielvendzur-code.github.io/moj.chatbot.backend/embed.js"
  defer
></script>
```

V embed režime je pozadie priehľadné, teaser sa nezobrazuje a iframe automaticky mení veľkosť
medzi launcherom a otvoreným panelom. Na mobile panel uzamkne scrollovanie hostiteľskej stránky
a vyplní viewport. Loader používa otvorený Shadow DOM s hostom
`#site-assistant-widget-host`; samotné UI zostáva v iframe `#site-assistant-frame`.

## Architektúra

- `src/components/widget/AssistantWidget.tsx` — launcher, teaser, okno, prepínanie režimov.
- `src/components/widget/BubbleLogo.tsx` — logo asistenta (chatová bublina, tri veľkosti).
- `src/components/widget/AssistantConversation.tsx` — konverzácia s rýchlymi čipmi.
- `src/components/widget/ToolCalculator.tsx` — 6-krokový konfigurátor: záujem → odvetvie → nasadenie → funkcie → objem dopytov → zhrnutie + kontakt (s poďakovaním).
- `src/lib/assistantFlow.ts` — dáta krokov, odporúčané funkcie podľa výberu, číslo návrhu.
- `src/lib/siteAssistant.ts` — verejné API a integračné udalosti.

## CTA API

```ts
openSiteAssistant({ entry: "builder" });
openSiteAssistant({ entry: "calculator", preset: "calculator" });
openSiteAssistant({ entry: "inquiry", preset: "inquiry" });
openSiteAssistant({ entry: "advisor", preset: "advisor" });
openSiteAssistant({ entry: "booking", preset: "booking" });
```

Funkcia je dostupná ako import aj cez `window.openSiteAssistant(options)`.

Loader prepojí rovnaké API aj z hostiteľskej stránky:

```js
window.openSiteAssistant({ entry: "builder" });
```

Podporuje aj udalosť `site-assistant:open`, takže existujúce CTA nemusia poznať iframe:

```js
window.dispatchEvent(
  new CustomEvent("site-assistant:open", {
    detail: { entry: "calculator", preset: "calculator" },
  }),
);
```

## Aktuálny rozsah

Prototyp nič neodosiela ani neukladá. Backend, e-mail, databáza, CRM, kalendár a reálne spracovanie formulára patria do ďalšej fázy.
