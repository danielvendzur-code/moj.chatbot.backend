# Môj Chatbot — widget pre web

Samostatný React/TypeScript widget: chat, ktorý odpovedá zákazníkom, a štvor-otázkový
tok, ktorý spočíta odhad ceny a odošle dopyt. Vizuál je zelený („#16c47f" na
takmer čiernom „#0b110f"), s jednou krivkou pohybu `cubic-bezier(0.16, 1, 0.3, 1)`
zhodnou s webom, písmom Inter Tight a jedinou farbou hraníc.

Pravidlá, ktoré widget drží a testy ich strážia:

- **Nový krok nikdy neprichádza s vybraným čipom.** Nič nie je predvolené,
  žiadny čip nedrží `:focus` ani `:hover` z predchádzajúceho kroku a `key`
  každej možnosti obsahuje aj číslo kroku, takže React nerecykluje DOM prvok
  medzi krokmi.
- **Pohyb je len pri príchode.** Nič sa nehýbe pri ukázaní myšou, pri kliknutí
  ani pri scrollovaní. Všetky animácie sú v
  `@media (prefers-reduced-motion: no-preference)`; kto má pohyb vypnutý, vidí
  rovnaký obsah bez pohybu.
- **Na zelenej je vždy tmavý text `#04140d`.** Kontrast každého textu voči
  skutočne vykreslenému pozadiu je nad 4,5 : 1 — vrátane prípadov, kde je
  pozadie súrodenec (jazdec prepínača), kde sa farba odčítava z pixelov snímky.
- **Plocha na klik je aspoň 44 × 44 px**, aj keď je ovládací prvok vizuálne
  nižší. `touch-action: manipulation` je len na ovládacích prvkoch, nikdy na
  paneli ani na scrollovacej oblasti, aby zostalo priblíženie prstami.
- **`overflow: hidden` nie je na `html` ani `body`.** Vodorovný presah rieši
  `overflow-x: clip` na vnútornom kontajneri, takže scrollovanie a zoom fungujú
  aj po vyskočení klávesnice na mobile.
- **Texty sú bez odborných slov.** Žiadny „konfigurátor", „parametre",
  „špecifikácia" ani „kvalifikácia dopytu"; každá otázka je jedna veta.

Verejná ukážka: <https://danielvendzur-code.github.io/moj.chatbot.backend/>

## Logo

Logom je čistá chatová bublina v zelenej s tromi tmavými bodkami (`src/components/widget/BubbleLogo.tsx`)
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
pnpm test
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
- `src/components/widget/ToolCalculator.tsx` — päť krokov: čo má web robiť → typ firmy → čo má zvládnuť (tu sa počíta odhad ceny) → kedy → kontakt (s poďakovaním).
- `src/lib/assistantFlow.ts` — dáta krokov, odporúčania podľa výberu, cenník (`BASE_PRICE`, `priceOf`), číslo dopytu.
- `src/green-motion-final.css` — posledná vrstva štýlov: zelená paleta, geometria, plochy na klik a všetky animácie.
- `src/hooks/useCountUp.ts` — odpočítanie ceny nahor za 900 ms; pri vypnutom pohybe vráti finálne číslo hneď.
- `src/hooks/useStepTransition.ts` — prechod medzi krokmi, ktorý drží výšku panela, takže nič nepodskočí.
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
krokový tok) ostáva plne funkčný. Funkcia obmedzuje vstup (počet a dĺžku správ), drží nízke
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

Chat odpovedá reálne (po nastavení Vercel proxy). Kontaktný formulár posiela dopyt cez
`api/lead.ts`; databáza, CRM a kalendár patria do ďalšej fázy.

Odhad ceny je orientačný: `BASE_PRICE` (350 €) plus cena za každú vybranú schopnosť
v `FEATURES`. Widget to takto aj hovorí — presnú cenu potvrdzuje Daniel.
