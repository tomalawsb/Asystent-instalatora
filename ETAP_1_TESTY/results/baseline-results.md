# Wyniki automatycznych testów bazowych

Data UTC: 2026-06-12T05:19:31.147Z

- PASS: 38
- FAIL: 4
- WARN: 3

## Pliki i spójność

- **PASS** — Istnieje index.html
- **PASS** — Istnieje style.css
- **PASS** — Istnieje app.js
- **PASS** — Istnieje manifest.json
- **PASS** — Istnieje service-worker.js
- **PASS** — Istnieje app-version.json
- **PASS** — Istnieje cennik.json
- **PASS** — Istnieje material-prices.json
- **PASS** — Poprawny JSON: manifest.json
- **PASS** — Poprawny JSON: app-version.json
- **PASS** — Poprawny JSON: cennik.json
- **PASS** — Poprawny JSON: material-prices.json
- **PASS** — Poprawny JSON: dane_uczace_transkrypcji.json
- **PASS** — Składnia modułów JavaScript i pakietu app.js
- **WARN** — Jedna wersja programu we wszystkich plikach — app-version.json: 3.8 - 0706261140 AI Lokalny; app.js: 3.7 - 1605261805 AI Prosta
- **PASS** — Brak ponownych deklaracji funkcji
- **PASS** — Unikalne identyfikatory HTML
- **PASS** — Statyczne odwołania JS mają elementy HTML
- **PASS** — Pliki cache service workera istnieją
- **PASS** — cennik.json jest zgodny z pricing-data.js
- **PASS** — material-prices.json jest zgodny z material-prices.js
## Obliczenia wyceny

- **PASS** — Dwie usługi po 100 zł netto — {"servicesNet":200,"billedKm":30,"distanceNet":60,"net":260,"vat":59.8,"gross":319.8}
- **PASS** — Dojazd: 50 km - 20 km bezpłatne — {"servicesNet":200,"billedKm":30,"distanceNet":60,"net":260,"vat":59.8,"gross":319.8}
- **PASS** — VAT 23% — {"servicesNet":200,"billedKm":30,"distanceNet":60,"net":260,"vat":59.8,"gross":319.8}
- **PASS** — Kwota brutto — {"servicesNet":200,"billedKm":30,"distanceNet":60,"net":260,"vat":59.8,"gross":319.8}
- **PASS** — Brak ujemnej opłaty za dojazd — {"servicesNet":0,"billedKm":0,"distanceNet":0,"net":0,"vat":0,"gross":0}
- **PASS** — Zmiana VAT na 8% — {"servicesNet":100,"billedKm":0,"distanceNet":0,"net":100,"vat":8,"gross":108}
## Zapis i synchronizacja danych

- **PASS** — Scalanie wybiera nowszą wycenę — [{"id":"q1","createdAt":"2026-01-01T10:00:00Z","clientName":"Nowa","clientPhone":"","clientAddress":"","visitDate":"","jobType":"Kamery CCTV","notes":"","distanceKm":0,"distanceRate":2,"freeKm":20,"services":[],"updatedAt":"2026-01-02T10:00:00Z","version":2,"deletedAt":null,"deviceId":"11ea310b-ffee-44ce-b212-0bdb30efd804"}]
- **PASS** — Zapis i odczyt aktywnej wyceny — [{"id":"q2","createdAt":"2026-01-01T10:00:00Z","clientName":"Test","clientPhone":"","clientAddress":"","visitDate":"","jobType":"Kamery CCTV","notes":"","distanceKm":0,"distanceRate":2,"freeKm":20,"services":[],"updatedAt":"2026-01-01T10:00:00Z","version":1,"deletedAt":null,"deviceId":"11ea310b-ffee-44ce-b212-0bdb30efd804"}]
- **PASS** — Usunięta wycena znika z aktywnych — []
- **PASS** — Znacznik usunięcia pozostaje do synchronizacji — [{"id":"q2","createdAt":"2026-01-01T10:00:00Z","clientName":"Test","clientPhone":"","clientAddress":"","visitDate":"","jobType":"Kamery CCTV","notes":"","distanceKm":0,"distanceRate":2,"freeKm":20,"services":[],"updatedAt":"2026-06-12T05:19:28.487Z","version":2,"deletedAt":"2026-06-12T05:19:28.487Z","deviceId":"11ea310b-ffee-44ce-b212-0bdb30efd804"}]
- **PASS** — Normalizacja ścieżki Dropbox — /folder/dane.json
- **PASS** — Ładunek synchronizacji ma schemat i rekordy — {"schema":2,"records":1,"deviceId":"11ea310b-ffee-44ce-b212-0bdb30efd804"}
- **PASS** — Odczyt rekordów ze starszego formatu kopii — [{"id":"backup1","createdAt":"2026-01-01T10:00:00Z","clientName":"Z kopii","clientPhone":"","clientAddress":"","visitDate":"","jobType":"Kamery CCTV","notes":"","distanceKm":0,"distanceRate":2,"freeKm":20,"services":[],"updatedAt":"2026-01-01T10:00:00Z","deletedAt":null,"deviceId":"11ea310b-ffee-44ce-b212-0bdb30efd804","version":0}]
- **PASS** — Scalanie cennika zachowuje lokalną cenę i dopisuje pozycję — [{"name":"Pozycja","unit":"szt","price_net":20},{"name":"Nowa","unit":"szt","price_net":5}]
- **WARN** — Połączenie z prawdziwym Dropbox — Nie wykonano bez tokenu użytkownika. Procedura ręczna jest w MANUAL_TEST_CHECKLIST.md.
## Eksport i komunikacja

- **PASS** — SMS zawiera zakres i kwotę brutto — Dzień dobry, wycena montażu monitoringu: 2 kamery IP. Razem: 295,20 zł brutto (240,00 zł netto). Adres: Mielec. Dojazd: 40,00 zł netto. Termin: 15.06.2026.
- **PASS** — Raport TXT zawiera dane klienta, VAT i dojazd — Firma Testowa POMOCNIK INSTALATORA — WYCENA Klient: Jan Kowalski Telefon: 501222333 Adres: Mielec Data wizyty: 2026-06-15 Typ zlecenia: Kamery CCTV USŁUGI: 1. Montaż kamery — 2 szt × 100,00 zł = 200,00 zł netto Dojazd: 20 km płatne × 2,00 zł = 40,
- **PASS** — Oferta HTML zawiera dane i polecenie drukowania — <!doctype html> <html lang="pl"> <head> <meta charset="utf-8"> <title>Oferta Jan Kowalski</title> <style> *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;marg
## Parser lokalny

- **FAIL** — CCTV_01: Pełne dane klienta, dwie kamery, przewód i dojazd — bezpłatne km: null; błędnie dodano „Uruchomienie podglądu zdalnego”
- **FAIL** — CCTV_02: Naturalna forma z etykietą Klient i osobnymi materiałami — klient: oczekiwano „Jan Kowalski”, jest „-”; stawka/km: null; bezpłatne km: null; błędnie dodano „Uruchomienie podglądu zdalnego”
- **FAIL** — ANTENA_01: Antena, przewód RG6 i złącza F — adres nie zawiera „12”: Anna Nowak Telefon 600700800, Czermin; błędnie dodano „Uruchomienie podglądu zdalnego”
- **FAIL** — WIFI_01: Konfiguracja routera bez elementów CCTV — klient: oczekiwano „Piotr Test”, jest „-”; brak pozycji „router” × 1; brak pozycji „Wi-Fi” × 1; błędnie dodano „Uruchomienie podglądu zdalnego”
## Parser AI

- **PASS** — Konwersja odpowiedzi AI do formatu aplikacji — [{"id":"5416e4a7-1ba3-4d1a-9584-dce0578f02e2","category":"Kamery CCTV","name":"Montaż kamery IP zewnętrznej","unit":"szt","quantity":2,"priceNet":260,"_voiceKey":"ai_camera_mount","itemKind":"labor","parserSource":"ai","parserKey":"ai_camera_mount","learningSignature":"ai|montaz kamery ip zewnetrznej|szt|260"}]
- **WARN** — Rzeczywiste zapytanie do OpenAI — Nie wykonano bez klucza API i świadomego użycia płatnego zapytania. Procedura ręczna jest w MANUAL_TEST_CHECKLIST.md.
