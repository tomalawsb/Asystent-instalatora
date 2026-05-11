Pomocnik Instalatora PWA v1.4.0

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


Zmiany v1.3.0:
- poprawiony parser dyktowania dla tekstu bez słowa „klient”, np. „Bogusław Biernacki ul. Szymanowskiego 48 montaż 4 kamer IP, 4 puszki montażowe pod kamery”,
- aplikacja rozpoznaje imię i nazwisko z początku zdania,
- adres nie gubi już numeru domu przed słowem „montaż”,
- poprawione rozpoznawanie odmian typu „kamer”, „kamery”, „puszki”,
- poprawiona kolejność dodawanych pozycji z dyktowania.


Zmiany v1.4.0:
- przebudowany parser dyktowania pod naturalne zdania montera, bez konieczności klikania po listach,
- poprawne rozpoznawanie przykładów z Bogusławem Biernackim, Mielcem i ul. Szymanowskiego 48,
- obsługa miasta przed ulicą i po ulicy, np. „Mielec ul Szymanowskiego 48” oraz „ul Szymanowskiego 48 miejscowość Mielec”,
- rozpoznawanie odmian liczebników: „czterech”, „dwóch”, „dwie”, „jednej” itd.,
- rozpoznawanie dojazdu: „dojazd 15 km 2 zł za kilometr”,
- obsługa „nie ma darmowego dojazdu” / „bez darmowych kilometrów” jako 0 km darmowych,
- obsługa ceny za komplet: „montaż jednej kamery i puszki to 200 zł netto”,
- obsługa „nauka obsługi aplikacji i instalacja aplikacji 50 zł”,
- rozróżnienie „puszki montażowe” i „puszki prądowe”, także przy kolejności typu „60 zł dwie puszki”,
- ograniczenie błędnego przypisywania ceny dojazdu albo kabla do kamery,
- podbity cache PWA do v1.4.0.

Sprawdzone testowo przykłady:
- Bogusław Biernacki Mielec ul Szymanowskiego 48 będę montował 4 kamery IP 4 puszki montażowe
- Bogusław Biernacki ul Szymanowskiego 48 miejscowość Mielec instalacja czterech kamer IP
- Bogusław Biernacki ul Szymanowskiego 48 miejscowość Mielec instalacja czterech kamer IP dojazd 15 km 2 zł za kilometr nie ma darmowego dojazdu
- Bogusław Biernacki ul Szymanowskiego 48 miejscowość Mielec instalacja czterech kamer IP dojazd 15 km 2 zł za kilometr nie ma darmowego dojazdu cena za montaż jednej kamery i puszki to 200 zł netto nauka obsługi aplikacji i instalacja aplikacji 50 zł puszki montażowe kosztują za sztukę 60 zł dwie puszki i prądowe 20 zł dwie puszki
