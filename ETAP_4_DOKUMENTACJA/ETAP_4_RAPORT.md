# Etap 4 — przebudowa interfejsu

**Wersja:** 4.0 - 1206260737  
**Zakres:** nowa konstrukcja interfejsu bez zmiany logiki parsera, obliczeń i danych.

## Wykonane zmiany

### 1. Nowa nawigacja główna
Interfejs ma cztery główne sekcje:

- Wycena,
- Zapisane,
- Cennik,
- Więcej.

Na komputerze nawigacja jest bocznym panelem. Na telefonie jest stałym paskiem u dołu ekranu.

### 2. Czteroetapowy proces przygotowania wyceny
Zakładka Wycena została podzielona na etapy:

1. **Opis wizyty** — dyktowanie, wklejanie tekstu i wczytywanie TXT.
2. **Weryfikacja** — wynik parsera oraz dane klienta.
3. **Wycena** — pozycje, ceny, VAT i dojazd.
4. **Finalizacja** — wiadomość, materiały, checklista, zapis i dokumenty.

Dodano przyciski Wstecz/Dalej, licznik etapu oraz automatyczne przechodzenie:

- do weryfikacji po pojawieniu się wyniku parsera,
- do wyceny po zatwierdzeniu rozbicia,
- do wyceny po wczytaniu zapisanej oferty lub dodaniu pozycji z cennika.

### 3. Uporządkowanie ustawień
Sekcja Więcej została podzielona na:

- Podstawowe,
- Analiza tekstu,
- Synchronizacja,
- Zaawansowane,
- Pomoc.

Funkcje techniczne parsera są domyślnie schowane w rozwijanych panelach.

### 4. Zachowanie zgodności
Zachowano wszystkie dotychczasowe identyfikatory elementów wymagane przez istniejący JavaScript. Nowy moduł `js/workflow.js` steruje wyłącznie interfejsem i nie nadpisuje funkcji parsera.

### 5. PWA i pakiet zgodności

- `workflow.js` dodano do `js/bootstrap.js`,
- `workflow.js` dodano do cache service workera,
- generator `app.js` uwzględnia 12 modułów,
- `app.js` został odbudowany dla wersji 4.0.

### 6. GitHub
Plik `upload_to_github.ps1` nadal używa repozytorium:

`https://github.com/tomalawsb/Asystent-instalatora.git`

Skrypt automatycznie pobiera numer wersji z `app-version.json`, tworzy opis commita i wysyła gałąź `main`. Dodano kontrolę obecności `js/workflow.js`.

## Walidacja

- walidacja statyczna: **45 PASS, 0 FAIL**,
- test interfejsu Chromium: **19 PASS, 0 FAIL**,
- test różnicowy logiki względem etapu 1: **8 PASS, 0 FAIL**,
- test bazowy: **44 PASS, 4 znane błędy parsera, 2 ostrzeżenia środowiskowe**.

Cztery błędy bazowe są tymi samymi problemami parsera wykrytymi w etapie 1. Etap 4 ich nie zmieniał.

## Ograniczenia testu

Rzeczywiste połączenie Dropbox i płatne zapytanie OpenAI nie zostały wykonane bez prywatnych kluczy użytkownika. Skrypt PowerShell został zweryfikowany statycznie; środowisko robocze nie zawiera PowerShella do jego uruchomienia.
