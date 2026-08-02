# História chatov

Súkromný dashboard je dostupný na `/historia`.

V projekte `moj-chatbot-backend` musia byť vo Verceli nastavené tieto premenné:

- `ADMIN_KEY` — heslo do dashboardu, minimálne 24 znakov
- `KV_REST_API_URL` — rovnaká hodnota ako v projekte MôjPlot
- `KV_REST_API_TOKEN` — rovnaká hodnota ako v projekte MôjPlot

Alternatívne názvy `UPSTASH_REDIS_REST_URL` a `UPSTASH_REDIS_REST_TOKEN` sú tiež podporované.

Môj Chatbot používa kľúče `chat:conv:*` a `chat:index`. MôjPlot používa `convo:*` a `convo:index`, preto môžu oba projekty bezpečne zdieľať jednu Redis databázu.

Po prihlásení sa uloží iba odvodený session identifikátor v `HttpOnly`, `Secure`, `SameSite=Strict` cookie na 8 hodín. Heslo sa neposiela v URL ani neukladá do localStorage.
