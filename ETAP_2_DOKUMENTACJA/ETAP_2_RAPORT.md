# Etap 2 — uporządkowanie kodu bez zmiany funkcji

**Pakiet roboczy:** ETAP 2 - 1206260716  
**Zakres:** rozdzielenie monolitycznego `app.js`, usunięcie nieaktywnych deklaracji i zachowanie dotychczasowego działania.

## Wykonane prace

1. Rozdzielono aktywne funkcje na moduły:
   - `js/storage.js` — ustawienia, localStorage, wyceny, kopie i reguły użytkownika,
   - `js/catalog.js` — cennik i ceny materiałów,
   - `js/quote.js` — stan i obliczenia wyceny,
   - `js/parser-local.js` — lokalny parser i reguły transkrypcji,
   - `js/parser-ai.js` — OpenAI i mapowanie odpowiedzi AI,
   - `js/sync.js` — synchronizacja oraz Dropbox,
   - `js/export.js` — SMS, TXT, materiały, PDF i drukowanie,
   - `js/ui.js` — inicjalizacja i renderowanie interfejsu,
   - `js/state.js` — globalne stałe i bieżący stan,
   - `js/patches.js` — aktywne nakładki zgodności w dotychczasowej kolejności,
   - `js/ai-runtime.js` — konfiguracja i podpięcie trybu AI.

2. `index.html` ładuje teraz powyższe moduły w kontrolowanej kolejności.

3. `app.js` pozostał jako **generowany pakiet zgodności**. Nie powinien być edytowany ręcznie.

4. Dodano generator:

```text
node tools/build-app-bundle.js
```

5. Usunięto z aktywnego kodu:
   - 26 wcześniejszych deklaracji funkcji,
   - dotyczących 21 powielonych nazw,
   - zachowując wyłącznie ostatnie definicje, które faktycznie obowiązywały w poprzednim pliku.

6. Zaktualizowano service worker:
   - dodano wszystkie moduły do cache,
   - zmieniono nazwę cache, aby po wdrożeniu pobrała się nowa struktura plików.

7. Testy z etapu 1 zostały dostosowane tak, aby uruchamiały dokładnie skrypty wskazane w `index.html`.

## Wyniki testów

### Test różnicowy starego i nowego kodu

- zgodne przypadki: **8**,
- wykryte różnice funkcjonalne: **0**.

Porównano między innymi:
- wszystkie przygotowane przypadki parsera,
- obliczenia VAT i dojazdu,
- scalanie cennika,
- SMS dla klienta,
- raport tekstowy.

### Testy bazowe po refaktoryzacji

- **PASS: 38**,
- **FAIL: 4**,
- **WARN: 3**.

Wynik funkcjonalny jest taki sam jak przed refaktoryzacją. Jedyna poprawa strukturalna w wyniku testów to usunięcie ostrzeżenia o ponownych deklaracjach funkcji.

## Celowo niezmienione problemy

Etap 2 nie naprawiał logiki parsera. Nadal pozostają cztery błędy wykryte w etapie 1:

- słowo „telefon” może błędnie dodać usługę podglądu zdalnego,
- nie jest rozpoznawane „pierwsze 20 km gratis”,
- niestabilne rozpoznawanie klienta i adresu,
- brak poprawnego dodania usług routera i Wi-Fi w przygotowanym przypadku testowym.

Nie zmieniono także niespójnego numeru wersji między `app-version.json` a stałą `APP_VERSION`. Jest to zakres etapu 3 — jedno źródło danych i wersji.

## Ograniczenia weryfikacji

Automatyczne testy składni, testy w środowisku JavaScript VM i test różnicowy zakończyły się prawidłowo. Bezpośredni test w lokalnym Chromium nie mógł zostać wykonany, ponieważ środowisko testowe blokuje otwieranie adresów lokalnych i plików przez politykę organizacji. Nie jest to błąd aplikacji.

## Pliki dodane

- katalog `js/` z 11 modułami,
- `tools/build-app-bundle.js`,
- `ETAP_2_DOKUMENTACJA/FUNCTION_MAP.json`,
- `ETAP_2_DOKUMENTACJA/REMOVED_DUPLICATE_DECLARATIONS.json`,
- `ETAP_2_DOKUMENTACJA/MODULE_LOAD_ORDER.json`,
- `ETAP_2_DOKUMENTACJA/run_differential_tests.js`,
- wyniki testu różnicowego.

## Pliki zmienione

- `app.js`,
- `index.html`,
- `service-worker.js`,
- `README.txt`,
- `ETAP_1_TESTY/run_baseline_tests.js`,
- wyniki testów bazowych.

## Następny etap

Etap 3 powinien objąć:
- jedno źródło numeru wersji,
- jedno źródło cennika,
- jedno źródło cen materiałów,
- usunięcie zbędnych plików dublujących dane,
- kontrolę migracji i zgodności danych użytkownika.
