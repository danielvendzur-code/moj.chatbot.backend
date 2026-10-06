# Rozhovor identity

The widget launcher, header, typing indicator and lead-email header use the supplied two-part Rozhovor identity. The symbol keeps the handoff's original filled paths and uses transform-only movement. Reduced motion displays a static mark. Approved SVG, favicon and light/dark email assets are in `public`.

Build with `npm run build`. The generated `dist/widget.js`, `dist/widget.css` and `dist/fonts` must then be copied into the website repository with its `scripts/sync-assistant.mjs` script. Both repositories should release this revision together; the website serves the widget from its own origin.

Validated with the production build, TypeScript checks and all 14 backend regression tests and 13 desktop/mobile browser tests. Existing conversation, lead and mail delivery behavior is preserved.
