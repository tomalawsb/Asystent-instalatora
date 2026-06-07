# Backend AI dla Pomocnika Instalatora

Ten katalog zawiera Cloudflare Worker, który trzyma klucz OpenAI po stronie backendu. Aplikacja na GitHub Pages wysyła do niego tekst wizyty i dostaje uporządkowany JSON.

## Wdrożenie

1. Zainstaluj Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Zaloguj się:
   ```bash
   wrangler login
   ```

3. W katalogu `ai-backend-cloudflare-worker` ustaw sekret OpenAI:
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

4. Opcjonalnie ustaw prosty token dostępu do proxy:
   ```bash
   wrangler secret put PROXY_TOKEN
   ```

5. W `wrangler.toml` ustaw `ALLOWED_ORIGIN` na adres Twojej strony GitHub Pages, np.:
   ```toml
   ALLOWED_ORIGIN = "https://tomalawsb.github.io"
   ```

6. Wdróż Worker:
   ```bash
   wrangler deploy
   ```

7. Skopiuj adres Workera, np. `https://pomocnik-instalatora-ai-parser.twoja-nazwa.workers.dev`.

8. W aplikacji wejdź w `Ustawienia → Parser AI przez backend`, wpisz adres backendu, ewentualny token proxy i kliknij `Test backendu`.

## Ważne

- Klucza OpenAI nie wpisuj do `index.html`, `app.js` ani do repozytorium GitHub.
- Ceny nadal liczy aplikacja lokalnie z Twojego cennika. AI tylko rozpoznaje strukturę tekstu.
- Parser lokalny nadal działa jako awaryjny/offline.
