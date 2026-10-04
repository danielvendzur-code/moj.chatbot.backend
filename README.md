# Môj Chatbot — widget pre web

Samostatný React/TypeScript widget s AI chatom, kontaktným formulárom a konfigurátorom riešenia. Vzhľad „Espresso a karamel“ používa spoločné tokeny s webom `vne-n`: atrament `#1C1612`, orech `#5B3A26`, karamel `#C8925E`, krém `#F5EFE6` a papier `#FFFCF7`. Písmo Geist a Geist Mono sa načítava lokálne.

Panel má tmavú hlavičku, krémovú konverzáciu, dve akcie „Vyskladať riešenie“ a „Kontakt“ a kapsulové možnosti konfigurátora. Zachováva pôvodné dáta, validáciu, históriu, streaming a API. Nový krok nemá predvolený výber; návrat späť zachováva odpovede. Teaser je vypnutý a panel sa otvára kliknutím. Pohyb rešpektuje `prefers-reduced-motion`.

`npm test` overuje históriu, kontakty a regresie odosielania. Staré testy predchádzajúcich dizajnov sú archivované v `tests/design-archive/`; ich požiadavky na zelenú farbu, prepínače a reset už neplatia.

Verejná ukážka: <https://danielvendzur-code.github.io/moj.chatbot.backend/>

## Logo

Logo je spoločný `BrandMark` s pôvodnou geometriou ťahu, 24 vrstvami tieňovania a karamelovou animáciou pera. `BubbleLogo` určuje veľkosť pre launcher, hlavičku a avatar. GIF varianty pre e-mail sú v `public/email-assets/`.

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

- `src/components/widget/AssistantWidget.tsx` — launcher, okno, otvorenie chatu alebo konfigurátora.
- `src/components/widget/BubbleLogo.tsx` — logo asistenta (chatová bublina, tri veľkosti).
- `src/components/widget/AssistantConversation.tsx` — konverzácia s rýchlymi čipmi.
- `src/components/widget/ToolCalculator.tsx` — konfigurátor: riešenie → funkcie → podrobnosti → odvetvie → termín → kontakt (kombinované riešenia pridávajú svoj krok).
- `src/lib/assistantFlow.ts` — dáta krokov, schopnosti, odporúčania podľa výberu a číslo dopytu.
- `src/brand-tokens.css` a `src/brand-system.css` — spoločné farby a autoritatívny vzhľad widgetu; poradie importov drží `src/launch-ready-styles.ts`.
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

Chat odpovedá naozaj cez Claude (model **Haiku 4.5**). Keďže GitHub Pages je
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

Odpoveď sa **streamuje**: keď klient pošle `Accept: text/event-stream`, funkcia posiela text
po kúskoch a prvé slová sú na obrazovke asi za sekundu. Klienti bez SSE dostanú JSON ako
predtým.

## História chatov pre vás (`api/transcripts.ts`)

Kde si prečítate, čo návštevníci naozaj písali. Ukladá sa do **Upstash Redis**
cez jeho REST API (jediná podoba Redisu, ktorá dáva zmysel v serverless funkcii
— žiadny connection pool, len `fetch`).

| Premenná | Načo je |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Z upstash.com → Redis databáza → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Tamtiež |
| `CHAT_LOG_TOKEN` | Heslo do prehliadača transkriptov. **Minimálne 24 znakov** — kratšie funkcia odmietne obsluhovať. |

Otvorte `https://<projekt>.vercel.app/api/transcripts?token=<CHAT_LOG_TOKEN>`.
Uvidíte zoznam konverzácií od najnovšej, kliknutím sa rozbalí celý priebeh.
Po prvom otvorení sa token uloží do `HttpOnly` cookie na 8 hodín, takže sa už
neobjavuje v odkazoch ani v zdroji stránky. `Accept: application/json` vráti
to isté ako JSON.

Bez týchto premenných sa nič neloguje a chat funguje presne ako predtým.
Zapisuje sa až **po** tom, čo návštevník dostal odpoveď, a nikdy sa naň nečaká
— pomalý alebo nedostupný log nemôže spomaliť ani pokaziť odpoveď.

> **Ochrana údajov.** Sú to konverzácie vašich návštevníkov, takže ste ich
> správcom. Transkripty **samy expirujú po 90 dňoch**, neukladá sa IP ani nič,
> čím by sa dal človek identifikovať — len text a čas. Ak v chate zbierate
> osobné údaje, spomeňte to v zásadách ochrany súkromia.

## Doručovanie dopytov (`api/lead.ts`)

| Premenná | Povinná | Načo je |
| --- | --- | --- |
| `RESEND_API_KEY` | áno (ak chcete e-maily) | Kľúč z resend.com. Bez neho funkcia vráti `delivery-not-configured` a widget otvorí rozpísaný mail v klientovi. |
| `LEAD_FROM_EMAIL` | nie | Odosielateľ. Default `Môj Chatbot <info@mojchatbot.sk>` — vyžaduje overenú doménu `mojchatbot.sk`. |
| `LEAD_TO_EMAIL` | nie | Kam chodia dopyty. Default `info@mojchatbot.sk`. |
| `LEAD_CC_EMAIL` | nie | Druhý kontakt v kópii. Default `daniel@vendzur.sk`; prázdny reťazec ho vypne. |
| `LEAD_WEBHOOK_URL` | nie | Záloha, keď e-mail zlyhá — dostane `{ subject, text, recipient }`. |
| `ALLOWED_ORIGINS` | nie | Ďalšie domény, z ktorých smie widget volať (čiarkou oddelené). |

> **Najčastejšia príčina „dopyt neprišiel".** Resend odošle len z domény, ktorú máte overenú.
> Kým `mojchatbot.sk` nie je overená na [resend.com/domains](https://resend.com/domains),
> vráti 403 a dopyt nikam nedôjde. To isté platí pre zdieľaný `onboarding@resend.dev` —
> ten doručí **len na adresu, ktorou ste si Resend účet založili**. V oboch prípadoch je
> presný dôvod v logu funkcie aj v odpovedi.

Keď doručenie zlyhá, dôvod od Resendu ide do logu funkcie (`lead-delivery-failed …`) aj do
odpovede ako pole `reason`, takže je vidno v Network tabe. Kľúč sa neposiela nikdy. Ak je
nastavený `LEAD_WEBHOOK_URL`, skúsi sa aj vtedy, keď e-mail odmietne — jeden odmietnutý kanál
už nepreskočí ostatné.

Okrem dopytu pre vás odchádza aj **potvrdenie zákazníkovi** (ak nechal e-mail), s číslom
dopytu a `reply_to` na vás. Je to zdvorilosť navyše — keď zlyhá, len sa zaloguje, dopyt je
u vás tak či tak.

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

Chat odpovedá reálne (po nastavení Vercel proxy). Kontaktný formulár posiela zadanie cez
`api/lead.ts`; databáza, CRM a kalendár patria do ďalšej fázy. Widget vymenuje potrebné
schopnosti, ale cenu projektu neodhaduje.
