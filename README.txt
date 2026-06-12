Pomocnik Instalatora PWA
Wersja: 4.3 - 1206260820

WERSJA KOŃCOWA PO PRZEBUDOWIE INTERFEJSU

Najważniejsze funkcje:
- czteroetapowy proces: opis wizyty, weryfikacja danych, wycena i finalizacja,
- jeden przycisk „Analizuj wizytę” dla parsera lokalnego lub AI,
- jedno menu „Udostępnij” z SMS, opisem, TXT, PDF, drukowaniem, materiałami i raportem,
- zapisane wyceny, własny cennik, baza materiałów i synchronizacja Dropbox,
- interfejs dostosowany do telefonu, tabletu i komputera,
- działanie PWA i praca offline po pierwszym pełnym uruchomieniu online.

Końcowe poprawki wersji 4.3:
- usunięto fałszywe dodawanie podglądu zdalnego po samym słowie „telefon”,
- poprawiono rozpoznawanie bezpłatnych kilometrów i stawki za dojazd,
- poprawiono rozpoznawanie klienta oraz adresu w naturalnym zapisie,
- dodano pewne rozpoznawanie konfiguracji routera i testu Wi-Fi,
- usunięto stare raporty, testy, zrzuty ekranów i nieużywane pliki szkoleniowe,
- dodano ikony PNG 192×192 i 512×512 dla instalacji PWA.

Uruchomienie lokalne:
1. Otwórz terminal w folderze programu.
2. Uruchom: python -m http.server 8000
3. Otwórz: http://localhost:8000

Wysyłka na GitHub:
- uruchom upload_to_github.ps1 w głównym folderze programu,
- skrypt automatycznie pobierze repozytorium, wyczyści stare pliki, utworzy commit i wykona push,
- repozytorium: https://github.com/tomalawsb/Asystent-instalatora.git

Bezpieczeństwo:
Klucze OpenAI i Dropbox są przechowywane wyłącznie lokalnie w przeglądarce/PWA. Nie są zapisane w paczce ani wysyłane do repozytorium przez skrypt.
