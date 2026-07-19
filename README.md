# Webový asistent — konfigurátor riešenia

Samostatný React/TypeScript widget s viac-krokovým konfigurátorom (výberové karty,
krokovanie s bodkami, kontaktný formulár so zhrnutím). Vizuál „Forest Night": tmavé
lesné pozadie (near-black green), teplá ivory typografia a akcenty starej mosadze
(logá, progress), šalvie (aktívne voľby a focus) a medi (hlavné CTA). Liquid glass
sa používa striedmo — panel, prepínač režimov a bubliny odpovedí — s fallbackom pre
prehliadače bez `backdrop-filter`. Prepínač režimov je iOS segmented control a pod
chipmi aj kartami konfigurátora sa pružinovo presúva šalviová sklenená pilulka.
Animuje sa iba `transform` a `opacity`, s rešpektom k `prefers-reduced-motion`.

Verejná ukážka: <https://danielvendzur-code.github.io/moj.chatbot.backend/>

## Logo

Logom je čistá chatová bublina v starej mosadzi s tromi tmavými bodkami (`src/components/widget/BubbleLogo.tsx`)
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

## Reálny AI chat (Claude cez Vercel)

Režim „Poradiť sa" odpovedá naozaj cez Claude (model **Haiku 4.5**). Keďže GitHub Pages je
statický, API kľúč nesmie ísť do prehliadača — chat prechádza cez malú serverless funkciu
`api/chat.ts` nasadenú na **Vercel**.

Nastavenie:

1. Prepojte tento repozitár s Vercel projektom (Vercel autodetekuje `api/chat.ts`).
2. V *Project Settings → Environment Variables* pridajte `ANTHROPIC_API_KEY` (Anthropic API kľúč).
   Kľúč zostáva len na serveri — nikde v repe ani v klientovi.
3. URL nasadenej funkcie (napr. `https://<projekt>.vercel.app/api/chat`) vložte do
   `src/lib/assistantApi.ts` (konštanta `DEFAULT_ENDPOINT`) alebo ju nastavte za behu bez
   rebuildu: `window.__DV_ASSISTANT_ENDPOINT__ = "https://…/api/chat";` (napr. z embed skriptu).

Kým endpoint nie je nastavený, chat elegantne padne na fallback hlášku a widget (vrátane
konfigurátora) ostáva plne funkčný. Funkcia obmedzuje vstup (počet a dĺžku správ), drží nízke
`max_tokens` a system prompt, ktorý ostáva pri téme Danielových služieb. Odporúčané ďalšie
zlepšenie: rate-limiting cez Vercel KV/Upstash.

## Analytika lievika

Widget dispatchne `CustomEvent("site-assistant:analytics", { detail: { event, props, ts } })`
a ak je na stránke GA4 (`window.dataLayer`), pushne aj `{ event: "dv_assistant_<event>", ...props }`.
Sledované udalosti: `widget_open`, `widget_close`, `mode_switch`, `chat_message_sent`,
`chat_reply_received`, `chat_error`, `config_step_view`, `config_interest_select`, `lead_submit`.

Príklad odchytenia na hostiteľskej stránke:

```js
window.addEventListener("site-assistant:analytics", (e) => {
  console.log(e.detail.event, e.detail.props);
});
```

## Aktuálny rozsah

Chat odpovedá reálne (po nastavení Vercel proxy). Kontaktný formulár konfigurátora zatiaľ nič
neodosiela ani neukladá — e-mail, databáza, CRM a kalendár patria do ďalšej fázy.
