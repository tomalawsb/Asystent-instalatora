Pomocnik Instalatora PWA
Wersja: 2.6 - 1205260925

Co dodano w 2.6:
- dodano bazę sugerowanych cen materiałów: material-prices.json i material-prices.js,
- dodano zakładkę „Ceny materiałów”,
- dodano przycisk „Zastosuj ceny w cenniku”,
- dodano przycisk „Aktualizuj z pliku online”, który pobiera aktualny material-prices.json z tej samej lokalizacji co aplikacja,
- dodano import/eksport bazy cen materiałów,
- parser przy braku ceny kamery dopisuje cenę sugerowaną z bazy zamiast 0 zł,
- program nadal oznacza ceny materiałów jako sugestię do sprawdzenia przed zatwierdzeniem oferty,
- uzupełniono cennik o sprzęt i materiały: kamery, rejestratory, dyski, switche PoE, zasilacze, puszki, przewody, złącza, anteny, routery, access pointy, domofony, alarmy, automatyka bram i uchwyty TV.

Jak działa aktualizacja cen:
1. Ceny domyślne są w plikach material-prices.js i material-prices.json.
2. Po wrzuceniu aplikacji na GitHub Pages przycisk „Aktualizuj z pliku online” pobiera material-prices.json z serwera z pominięciem cache.
3. Jeżeli później podmienisz sam plik material-prices.json w repozytorium, aplikacja może pobrać nowszą bazę bez przepisywania całego programu.
4. PWA nie skanuje sklepów automatycznie bezpośrednio z przeglądarki, bo strony sklepów często blokują takie pobieranie przez CORS. Dlatego moduł jest zrobiony jako bezpieczna baza cen + import/eksport + aktualizacja z pliku online.

Ważne:
- Wszystkie ceny są netto.
- Ceny sprzętu są sugestiami, nie gwarantowaną ceną zakupu.
- Przy droższych elementach, np. PTZ, NVR, router 5G, dysk CCTV, zawsze sprawdź konkretny model przed wysłaniem oferty.
