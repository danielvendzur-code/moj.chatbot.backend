# Widget review — 8 October 2026

Builds on PR #148 (e109ac5c0f7395f001b1fec84cc8ad5e7080ebb6). Changes here are limited to the shared brand stylesheet: balanced two-column option grids, equal-height options, immediate selected styling, shorter entry motion, clearer step headers and reduced-motion handling.

No API handler, payload, calculation, client logo, lead delivery or history code changed.

Validation: `pnpm check`, `pnpm test` (14 passed), `pnpm build`. The generated widget was also tested through the website in Chromium at 320, 390, 768, 1366 and 1920 px. Chat typing, draft preservation and keyboard-height composer passed. Full chatbot configuration passed at 320, 390 and 1366 px, through features, details, industry, timeline and contact. Lead requests were intercepted and validated; no real email was sent.

Production and external client integrations have not been deployed. Safari and physical-device performance remain unverified. Source review and a staging integration check are required before production release.
