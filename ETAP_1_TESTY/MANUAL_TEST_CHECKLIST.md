# Ręczna lista kontrolna przed przebudową

Wykonać na kopii aplikacji, nie na jedynej wersji zawierającej dane użytkownika.

## 1. Uruchomienie i PWA

- [ ] Aplikacja otwiera się bez błędów w konsoli przeglądarki.
- [ ] Instalacja PWA jest dostępna.
- [ ] Po instalacji aplikacja uruchamia się z ikony.
- [ ] Po wyłączeniu Internetu aplikacja nadal się otwiera.
- [ ] Aktualizacja service workera nie usuwa zapisanych wycen.

## 2. Parser lokalny

Dla każdego przypadku z `fixtures/parser_cases.json`:

- [ ] Rozpoznaje klienta.
- [ ] Rozpoznaje telefon.
- [ ] Rozpoznaje adres.
- [ ] Rozpoznaje ilości i jednostki.
- [ ] Nie dodaje pozycji niewymienionych w tekście.
- [ ] Poprawnie rozpoznaje dojazd, stawkę i bezpłatne kilometry.
- [ ] Zatwierdzenie podglądu dopisuje dane tylko raz.
- [ ] Cofnięcie przywraca stan sprzed rozbicia.

## 3. Parser AI

Wymaga własnego klucza OpenAI i może naliczyć koszt zapytania.

- [ ] Zapis klucza działa po ponownym otwarciu aplikacji.
- [ ] Test połączenia zwraca prawidłowy wynik.
- [ ] Wybrany model jest faktycznie używany.
- [ ] AI nie dodaje elementów, których nie ma w tekście.
- [ ] Ceny pochodzą z lokalnego cennika, a nie z odpowiedzi AI.
- [ ] Przy błędzie API można nadal użyć parsera lokalnego.

## 4. Obliczenia

- [ ] Ilość × cena netto każdej pozycji jest poprawna.
- [ ] Dojazd liczy tylko kilometry ponad limit bezpłatny.
- [ ] Zmiana VAT aktualizuje netto, VAT i brutto.
- [ ] Usunięcie pozycji aktualizuje wszystkie podsumowania.
- [ ] Nie można uzyskać ujemnej opłaty za dojazd.

## 5. Zapis i odczyt

- [ ] Nowa wycena zapisuje się i pojawia w zapisanych.
- [ ] Wczytana wycena ma wszystkie dane i pozycje.
- [ ] Edycja nie tworzy niezamierzonego duplikatu.
- [ ] Usunięta wycena nie wraca po odświeżeniu.
- [ ] Eksport kopii JSON zawiera ustawienia, cennik i wyceny.
- [ ] Import kopii do czystej przeglądarki przywraca dane.

## 6. Eksport

- [ ] SMS zawiera właściwego klienta, zakres i kwotę.
- [ ] TXT zawiera wszystkie pozycje, VAT i dojazd.
- [ ] Oferta otwiera się do druku i można zapisać PDF.
- [ ] Lista materiałów nie zawiera robocizny.
- [ ] Nazwy pobieranych plików nie zawierają niedozwolonych znaków.

## 7. Dropbox

Wymaga prawdziwego tokenu użytkownika. Token pozostaje wyłącznie lokalnie.

- [ ] Test połączenia działa.
- [ ] Wysyłanie tworzy lub aktualizuje wskazany plik.
- [ ] Pobieranie nie usuwa nowszej lokalnej wyceny.
- [ ] Scalanie zachowuje nowszą wersję rekordu.
- [ ] Usunięta wycena nie wraca z drugiego urządzenia.
- [ ] Błędny lub wygasły token pokazuje czytelny komunikat.
- [ ] Brak Internetu nie powoduje utraty danych lokalnych.

## 8. Cennik

- [ ] Dodanie, edycja i usunięcie pozycji działa.
- [ ] Import cennika nie niszczy zapisanych wycen.
- [ ] Reset przywraca pełny cennik domyślny.
- [ ] `cennik.json` i `pricing-data.js` nie rozchodzą się po zmianie.
- [ ] `material-prices.json` i `material-prices.js` nie rozchodzą się po zmianie.
