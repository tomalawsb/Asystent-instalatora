Pomocnik Instalatora PWA
Wersja programu: 2.5 - 1205260850

Zakres tej paczki:
- dodany parser długich transkrypcji z wizyt u klienta,
- czyszczenie nagłówków transkrypcji, znaczników czasu i linii technicznych,
- rozpoznawanie adresu z nazwy pliku i pierwszego wpisu transkrypcji, np. „Sielska 37 przez 1” → „ul. Sielska 37/1”,
- rozpoznawanie faktów z rozmowy: podgląd w telefonie, internet/router, zasilanie, strych, podbitka, puszki rolet, przewierty, korytka/listwy, rynna,
- rozpoznawanie wariantów: kamery obrotowe, tubowe/statyczne, solarne, prowadzenie przewodów po listwie/korytku, przez strych/podbitkę,
- kamery solarne wykrywane jako odrzucone, jeśli klient mówi „nie solarnych”, „nie chcę”, itp.,
- program nie dolicza kamer automatycznie z transkrypcji, jeśli ilość nie jest jednoznaczna,
- długie transkrypcje są zapisywane w notatkach jako krótka analiza, a nie cały ogromny tekst,
- podgląd rozbicia jest bardziej zwarty: sekcje rozwijane, łatwiejsze poprawki, przyciski zatwierdzania przyklejone na dole panelu,
- utrzymane samouczenie z poprawek w podglądzie i po zatwierdzeniu.

Po wrzuceniu na GitHub Pages kliknij w aplikacji „Odśwież cache”.


2.4 - 1205260816
- Dodano wzorce z archiwum transkrypcji usług.
- Dodano parser długich transkrypcji: czyszczenie nagłówków, wykrywanie typu zlecenia, wariantów i rzeczy do sprawdzenia.
- Dodano kategorie: TV / Montaż, Komputery / Telefony, Prace drobne.
- Dodano panel 'Wzorce z archiwum transkrypcji' w ustawieniach.


2.5 - 1205260850
- poprawiono wykrywanie klienta po frazie „klient … trzeba zamontować”
- poprawiono rozbicie 4 kamer: tubowe + obrotowa, bez błędnego traktowania „2 kamerą” jako ilości PTZ
- dodano pozycje materiałowe kamer z ceną 0 zł do uzupełnienia, żeby wycena nie ukrywała kosztu sprzętu
- poprawiono puszki oryginalne 60 zł, puszkę prądową 15 zł, przewiert oraz przewód 10 m 2×0,5
- dodano dane uczące do cache service workera
