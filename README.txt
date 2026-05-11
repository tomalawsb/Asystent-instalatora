Pomocnik Instalatora PWA v1.2.0

Wersja webowa/PWA działająca bez serwera.

Nowe w v1.1.0:
- pole „Dyktowanie wizyty i wyceny”,
- przycisk „Dyktuj wizytę”,
- ręczne testowanie tekstu przyciskiem „Rozbij tekst”,
- lokalny parser usług i materiałów,
- rozpoznawanie przykładów typu:
  * 5 kamer za 200 zł
  * kabel 10 m po 2 zł za metr
  * dojazd 35 km po 2 zł
  * robocizna 3 godziny po 100 zł
- automatyczne dodawanie wykrytych pozycji do tabeli wyceny,
- dopisywanie dyktowanego tekstu do notatek.

Uruchomienie lokalne:
1. Rozpakuj paczkę.
2. Otwórz index.html w Chrome.
3. Do pełnego działania PWA i cache najlepiej uruchomić przez GitHub Pages albo lokalny serwer HTTP.

Uwaga:
Rozpoznawanie mowy zależy od przeglądarki. Jeżeli mikrofon nie działa, wpisz tekst ręcznie w pole dyktowania i kliknij „Rozbij tekst”.

Wrzucenie na GitHub Pages:
Wgraj wszystkie pliki z tej paczki do głównego katalogu repozytorium i włącz Pages dla branch main oraz /root.


Zmiany v1.2.0:
- dyktowanie rozpoznaje dane klienta: imię i nazwisko, telefon, adres/ulicę i miejscowość,
- jedno pole dyktowania może zawierać dane klienta i pozycje wyceny naraz,
- przykład: klient Jan Kowalski, ulica Szymanowskiego 48 Mielec, telefon 501 222 333, 5 kamer po 200 zł, kabel 10 m po 2 zł,
- po rozbiciu tekstu aplikacja automatycznie wpisuje wykryte dane do formularza i dodaje pozycje do wyceny.
