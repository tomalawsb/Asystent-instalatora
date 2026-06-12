# Etap 1 — zabezpieczenie wersji i testy bazowe

Wykonano: **12.06.2026, 07:05 CEST**  
Zakres: zabezpieczenie wersji 3.8, przygotowanie powtarzalnych testów oraz sprawdzenie najważniejszych mechanizmów przed przebudową.

## Stan kodu produkcyjnego

Pliki aplikacji nie zostały zmienione. Do paczki dodano wyłącznie folder `ETAP_1_TESTY` z testami, wynikami i instrukcjami. Oryginalne archiwum zostało zachowane jako osobna kopia bezpieczeństwa.

## Wynik automatyczny

- **37 testów zaliczonych**
- **4 testy niezaliczone**
- **4 ostrzeżenia**

Pełne wyniki: `results/baseline-results.md`.

## Mechanizmy potwierdzone jako działające

- składnia pliku `app.js` i poprawność głównych plików JSON,
- kompletność plików zapisanych w cache service workera,
- zgodność `cennik.json` z `pricing-data.js`,
- zgodność `material-prices.json` z `material-prices.js`,
- obliczanie wartości netto, VAT i brutto,
- naliczanie płatnych kilometrów ponad limit bezpłatny,
- zabezpieczenie przed ujemną opłatą za dojazd,
- zapis, odczyt i oznaczanie wycen jako usunięte,
- wybieranie nowszego rekordu podczas scalania,
- odczyt starszego formatu kopii zapasowej,
- scalanie cenników z pierwszeństwem danych lokalnych,
- generowanie SMS, raportu TXT oraz oferty HTML/PDF,
- konwersja ustrukturyzowanej odpowiedzi AI do formatu wyceny.

## Usterki ujawnione przez testy

### 1. Samoczynne dodawanie „Uruchomienie podglądu zdalnego”

Pozycja jest dodawana również w tekstach niezwiązanych z kamerami. Bezpośrednia przyczyna znajduje się w poprawce `installerV351PatchExplicitCctvLabor`: warunek zawiera słowo `telefon`, więc zwykły numer telefonu klienta uruchamia dodawanie usługi podglądu zdalnego.

Skutek: błędna pozycja pojawiła się we wszystkich czterech przypadkach testowych, w tym przy antenie i konfiguracji Wi-Fi.

### 2. Niepełne rozpoznawanie bezpłatnych kilometrów

Parser rozpoznaje konstrukcję w rodzaju „bezpłatne 20 km”, ale nie rozpoznaje naturalnych zapisów:

- „20 km bezpłatne”,
- „pierwsze 20 km gratis”.

Skutek: `freeKm` pozostaje puste, mimo że informacja występuje w tekście.

### 3. Niestabilne rozpoznawanie imienia i nazwiska

Forma „Klient Jan Kowalski, telefon...” nie zawsze jest rozpoznawana, chociaż prostszy zapis „Jan Kowalski ulica...” działa. Problem zależy od kolejności pól, przecinków i słów oddzielających.

### 4. Błędy adresów bez klasycznego układu „ulica + numer + miasto”

Dla „adres Czermin 12” parser zbudował błędny adres z fragmentem imienia i telefonu. Dla formy „Mielec ulica Wolności 5” również może powstać nieprawidłowy ciąg.

### 5. Brak podstawowych pozycji dla zlecenia Wi-Fi

Tekst zawierający „Konfiguracja routera i test Wi-Fi” nie dodał oczekiwanych usług. Zamiast nich pojawiła się błędna pozycja podglądu zdalnego.

## Ostrzeżenia architektoniczne

### Niespójny numer wersji

- `app-version.json`, `index.html`, service worker i README: **3.8 - 0706261140 AI Lokalny**,
- `app.js`: **3.7 - 1605261805 AI Prosta**.

### Wielokrotne deklaracje funkcji

Wykryto powtarzające się deklaracje kluczowych funkcji, m.in.:

- `parseSmartCommand` — 3 razy,
- `parseClientName` — 3 razy,
- `parseClientAddress` — 3 razy,
- `renderParserPreview` — 3 razy,
- `detectMissingData` — 3 razy,
- wiele innych — 2 razy.

Testy potwierdzają, że ostatnie warstwy poprawek zmieniają działanie wcześniejszych funkcji. To należy uporządkować przed większą przebudową interfejsu.

## Czego nie testowano automatycznie

- prawdziwego połączenia Dropbox — wymagany prywatny token użytkownika,
- rzeczywistego zapytania OpenAI — wymagany klucz API i może powstać koszt,
- instalacji PWA na konkretnym telefonie,
- zachowania service workera po wdrożeniu na Firebase/hostingu,
- systemowego okna drukowania i zapisu PDF.

Procedury tych testów znajdują się w `MANUAL_TEST_CHECKLIST.md`.

## Decyzja po etapie 1

Kod obliczeń, zapisu i eksportu można traktować jako bazę do zachowania. Parser lokalny nie powinien być przenoszony bezpośrednio do nowych modułów bez wcześniejszego usunięcia opisanych regresji. Testy z tego folderu powinny być uruchamiane po każdej kolejnej zmianie.
