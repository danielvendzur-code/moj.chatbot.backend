# Widget redesign — 4 October 2026

The quick builder card is removed from chat. The Configurator tab, site open events and legacy presets remain supported. Chat and configurator use the website's Geist typeface, white/graphite/lime palette and static outlined brand mark.

## Behavior

- Four standalone tools: chatbot, calculator, 3D configurator and interactive advisor. A combined solution adds “Ktoré riešenia chcete kombinovať?” with at least two selected tools.
- Add-on and detail choices are the deduplicated union of the chosen tools. A tool's core capability is not offered again as an optional add-on.
- Back navigation retains answers and contact data. Changing tools prunes incompatible choices. Single-choice steps keep the existing confirmation/auto-advance; multi-select steps require Continue.
- The existing lead API receives the chosen tool names, selected details, contact and enquiry reference. A provider failure shows the complete prepared email as an explicit link; it never opens automatically.
- Brand fonts are self-hosted under `public/fonts`, resolved relative to the embed script, with their licence. Vercel and local static previews permit cross-origin public font requests.
- Release marker: `premium-redesign-20261004-v16`. Pages artifact validation checks the new combination/advisor flow and font bundle rather than requiring the removed chat card.

## Checks

53 repository tests, TypeScript, standard build, Pages build and production dependency audit pass. Browser coverage includes the exact combined lead payload, two-tool minimum, back/forward preservation, incompatible-answer cleanup, standalone advisor/3D, invalid contacts and a 503 email fallback on a 360 px viewport. Existing chat, contact-sheet, launcher and touch tests also pass. API responses are intercepted in browser checks; no real notifications are sent.

New browser specifications: `tests/premium-flow.spec.mjs` and `tests/premium-host.spec.mjs`. The host specification expects the web preview on port 3000 and this widget on 4173. In this environment run them with the external Chromium configuration `/workspace/cloud-playwright.config.mjs`; existing browser tests use the same installed Playwright runner. Review screenshots and logs are in `/workspace/redesign-review`.

## Preview and deployment

Paired web branch: `codex/premium-redesign-oct4` in `vne-n`. Both changes must be reviewed together. A backend Vercel preview provides `/widget.js`, `/widget.css` and `/fonts/brand.css`; point the web preview's `VITE_ASSISTANT_EMBED_URL` to its widget script.

Both review branches were pushed successfully. GitHub API requests return Forbidden, so draft PR creation and retrieval of an external deployment URL are blocked. Branch: https://github.com/danielvendzur-code/moj.chatbot.backend/tree/codex/premium-widget-oct4 Production is unchanged. Merge/deploy requires the user's approval. On release, publish all widget and font assets before the website, and verify real lead/chat delivery with the production services configured.
