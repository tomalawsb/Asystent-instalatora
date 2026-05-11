Pomocnik Instalatora PWA v11 / aplikacja 1.9.0

Dodane w tej wersji:
- osobna kategoria cennika: Przewody / Okablowanie,
- materiały: RG6 CU, skrętka Cat 5e/Cat 6 zwykła i żelowana, przewody prądowe YDYp,
- robocizna za prowadzenie przewodu: łatwe, standardowe, trudne, peszel, listwa, ziemia,
- parser rozpoznaje teksty typu: „30 metrów kabla Cat 6 żelowanego trudne prowadzenie”,
- parser rozbija przewód na dwie pozycje: materiał + prowadzenie przewodu,
- nowy cennik jest domyślnie scalany ze starym lokalnym cennikiem, żeby po aktualizacji nie trzeba było ręcznie resetować cennika.

Po wrzuceniu na GitHub Pages kliknij w aplikacji „Odśwież cache”.
bo lokalny serwer HTTP.

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
