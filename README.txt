Pomocnik Instalatora PWA
Wersja: 3.3 - 1605261610

Zmiany w tej paczce:
- dodano stos parserów strukturalnych: Excel/TSV, CSV/średniki, Markdown, lista cenowa, sekcje Materiały/Robocizna oraz JSON z pozycjami,
- parser gotowych tabel przenosi pełną listę pozycji do wyceny zamiast zostawiać ją jako zwykły tekst,
- dodano rozróżnianie itemKind: materiał / robocizna, dzięki czemu dysk, puszki, RJ45 i podobne pozycje nie wypadają z klasyfikacji,
- dodano raport parsera w podglądzie: liczba pozycji, suma materiałów, suma robocizny i suma razem,
- dodano kontrolę niespójności: ilość × cena jednostkowa kontra kolumna Razem,
- przetestowano na tabeli CCTV: 24 pozycje, materiały 3 359,90 zł, robocizna 3 070,00 zł, razem 6 429,90 zł netto,
- dodano przycisk „Wgraj JSON” w zakładce Zapisane, obok „Kopia JSON”,
- import kopii JSON wczytuje ustawienia, cennik, słownik korekt, reguły parsera oraz zapisane wyceny z klientami,
- zapisane wyceny są scalane z obecnymi, a nie kasowane na ślepo,
- po imporcie odświeżany jest formularz, cennik, zapisane wyceny i ustawienia,
- podbito wersję programu i cache PWA, żeby przeglądarka nie trzymała starego app.js,
- dodano brakujący komunikat statusu przy imporcie/odświeżaniu bazy cen materiałów.

Zmiany z poprzedniej paczki:
- naprawiono błędne rozpoznawanie adresu z tekstu typu „5 kamer Hikvision 5 Mpix”,
- rozdzielono kamery przewodowe i kamerę Wi‑Fi,
- poprawiono liczenie RJ45 przy połączeniu kabli strych–parter,
- dodano automatyczne beczki / łączniki RJ45 dla łączenia przewodów,
- dodano materiał: rejestrator NVR 8 kanałów przy zleceniu na 5 kamer,
- dodano pozycję montażu / podłączenia rejestratora NVR,
- usunięto zgadywanie 1 mb skrętki albo 10 mb przewodu zasilającego bez podanej długości,
- ukryto dopłatę za przewiert, jeżeli przewiert jest już dodany jako normalna pozycja,
- dodano ostrzeżenia do sprawdzenia: zasilanie kamery Wi‑Fi, dysk NVR, materiały kamer, wariant RJ45 8/12 szt.

Wgraj wszystkie pliki z paczki na GitHub Pages i po otwarciu kliknij Ustawienia → Aktualizuj aplikację, jeżeli przeglądarka trzyma starą wersję.
