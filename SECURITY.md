# Bezpečnosť chatbota

## Nahlásenie zraniteľnosti

Bezpečnostný problém neposielajte ako verejný GitHub issue. Pošlite ho súkromne na **daniel@vendzur.sk** s predmetom `SECURITY — chatbot`.

Uveďte dotknutú URL alebo endpoint, postup reprodukcie, možné následky a neškodný dôkaz. Neposielajte skutočné API kľúče, heslá ani osobné údaje tretích strán a nevykonávajte záťažové testy proti verejnému endpointu.

## Podporovaná verzia

Bezpečnostné opravy sa aplikujú na aktuálnu vetvu `main`, GitHub Pages embed build a aktuálnu Vercel API funkciu.

## Aktuálne ochrany

- API kľúč je iba v serverovom prostredí,
- presne povolené originy namiesto wildcard CORS,
- POST/OPTIONS a `application/json` enforcement,
- limit veľkosti tela, počtu správ a dĺžky textu,
- rate limit s `Retry-After`,
- upstream timeout cez `AbortController`,
- `no-store`, `nosniff` a referrer bezpečnostné hlavičky,
- ochrana systémového promptu a odmietnutie prompt-injection pokusov,
- lokálny bezpečný fallback pri nedostupnom API,
- produkčný audit závislostí, TypeScript check, kontraktné testy a live smoke test pred nasadením,
- týždenné Dependabot kontroly npm a GitHub Actions.
