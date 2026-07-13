# Webový asistent s pixelovým zlatým chameleónom

Samostatný React/TypeScript widget s pixel-art maskotom a viac-krokovým konfigurátorom
inšpirovaným osvedčeným rozložením DERAT asistenta (výberové karty, krokovanie s bodkami,
hover výplne, kontaktný formulár so zhrnutím).

Verejná ukážka: <https://danielvendzur-code.github.io/moj.chatbot.backend/>

## Maskot

Maskot je ručne kreslený pixel-art zlatý chameleón (`src/components/widget/PixelMascot.tsx`)
— žiadne obrázky, čistý SVG z pixelovej mapy. Vie dýchať, žmurkať, sledovať muchu zreničkou
a chytiť ju vystreleným jazykom (fázy `idle → watching → feeding` riadi `useFlyCatch`).
Animácia sa spúšťa pri hoveri na bubline, pri zatvorení okna a náhodne v pokoji.

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
- `src/components/widget/PixelMascot.tsx` — pixel-art maskot s animáciou chytania muchy.
- `src/components/widget/AssistantConversation.tsx` — konverzácia s rýchlymi čipmi a kontaktnou lištou.
- `src/components/widget/ToolCalculator.tsx` — 6-krokový konfigurátor: záujem → odvetvie → nasadenie → funkcie → objem dopytov → zhrnutie + kontakt (s poďakovaním).
- `src/lib/assistantFlow.ts` — dáta krokov, odporúčané funkcie podľa výberu, číslo návrhu.
- `src/hooks/useFlyCatch.ts` — náhodné aj interaktívne načasovanie chytania muchy.
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

## Aktuálny rozsah

Prototyp nič neodosiela ani neukladá. Backend, e-mail, databáza, CRM, kalendár a reálne spracovanie formulára patria do ďalšej fázy.
