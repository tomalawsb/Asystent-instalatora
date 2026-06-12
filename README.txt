Pomocnik Instalatora PWA
Wersja: 4.0 - 1206260737

ETAP 4 — NOWY INTERFEJS PROCESOWY

Najważniejsze zmiany:
- nowa główna nawigacja: Wycena, Zapisane, Cennik, Więcej,
- na telefonie główna nawigacja znajduje się na dole ekranu,
- na komputerze główna nawigacja znajduje się w bocznym panelu,
- tworzenie wyceny podzielono na cztery etapy:
  1. Opis wizyty,
  2. Weryfikacja danych,
  3. Pozycje i ceny,
  4. Finalizacja,
- ustawienia podzielono na: Podstawowe, Analiza tekstu, Synchronizacja, Zaawansowane i Pomoc,
- cennik oraz zarządzanie bazami otrzymały czytelniejszy układ,
- zachowano wszystkie funkcje, identyfikatory pól i zgodność z danymi z wersji 3.9,
- nie zmieniano parsera lokalnego, parsera AI, obliczeń, zapisu wycen ani synchronizacji Dropbox.

Uruchomienie lokalne:
- aplikację należy otwierać przez serwer HTTP, a nie bezpośrednio jako plik file://,
- przykładowo: python -m http.server 8000
- następnie: http://localhost:8000

Wysyłka na GitHub:
- uruchom plik upload_to_github.ps1 w głównym katalogu programu,
- repozytorium: https://github.com/tomalawsb/Asystent-instalatora.git

Uwaga dotycząca OpenAI:
Klucz API jest zapisywany lokalnie w przeglądarce/PWA. Nie jest umieszczany w plikach programu ani w repozytorium GitHub.
