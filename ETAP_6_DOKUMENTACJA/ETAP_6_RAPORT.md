# Etap 6 — dopracowanie interfejsu mobilnego

**Wersja:** 4.2 - 1206260811  
**Repozytorium:** `https://github.com/tomalawsb/Asystent-instalatora.git`

## Zakres wykonanych prac

1. Na telefonach dodano stały pasek działań umieszczony nad dolną nawigacją aplikacji.
2. Pasek zmienia główną akcję zależnie od aktualnego etapu:
   - kroki 1–2: **Dalej**,
   - krok 3: **Finalizacja**,
   - krok 4: **Zapisz wycenę**.
3. Przycisk zapisu z mobilnego paska wywołuje ten sam mechanizm zapisu co dotychczasowy przycisk `saveQuoteBtn`.
4. Na telefonie ukryto powielony przycisk „Zapisz wycenę” w karcie finalizacji. W karcie pozostaje menu „Udostępnij”.
5. Cztery etapy wyceny na ekranach do 620 px są wyświetlane jednocześnie w zwartej siatce 4-kolumnowej. Nie wymagają przewijania poziomego.
6. Na ekranach 621–850 px pasek etapów może się przewijać, a aktywny etap jest automatycznie centrowany.
7. Zwiększono minimalną wysokość elementów dotykowych do 44 px.
8. Pola tekstowe na telefonie używają czcionki minimum 16 px, aby ograniczyć automatyczne powiększanie formularza w przeglądarkach mobilnych.
9. Menu „Udostępnij” i pozostałe menu działań na telefonie działają jako dolny panel typu bottom sheet:
   - stała pozycja,
   - przyciemnione tło,
   - blokada przewijania strony,
   - zamknięcie po wyborze działania, kliknięciu poza panelem lub naciśnięciu Escape.
10. Dodano odstępy uwzględniające `safe-area-inset-bottom` dla telefonów z paskiem gestów i wycięciami ekranu.
11. Dodano obsługę `visualViewport`, aby pasek działań i menu reagowały na klawiaturę ekranową.
12. Dopracowano widoki dla szerokości 360 px, 390 px i 412 px oraz orientacji poziomej.
13. Dodano wariant dla bardzo wąskich ekranów do 370 px.
14. Ustawiono większy dolny margines zawartości, dzięki czemu stały pasek działań i dolna nawigacja nie zasłaniają formularza.
15. Dodano obsługę `prefers-reduced-motion` dla użytkowników ograniczających animacje systemowe.

## Zgodność działania

Nie zmieniano:
- parsera lokalnego,
- parsera AI i formatu odpowiedzi OpenAI,
- obliczeń netto, VAT, brutto i dojazdu,
- formatu zapisywanych wycen,
- synchronizacji Dropbox,
- cennika i bazy cen materiałów,
- mechanizmów eksportu TXT, PDF, SMS i drukowania.

Test różnicowy względem etapu 5: **8/8 zgodnych wyników**.

## Wyniki testów

- Walidacja statyczna i techniczna: **48/48 PASS**.
- Testy interfejsu Chromium/Playwright: **68/68 PASS**.
- Testy wykonano dla:
  - desktopu 1440 × 1000,
  - telefonu 360 × 800,
  - telefonu 390 × 844,
  - telefonu 412 × 915,
  - orientacji poziomej 844 × 390.
- Test różnicowy logiki względem etapu 5: **8/8 PASS**.
- Testy bazowe: **44 PASS, 4 znane błędy parsera, 2 ostrzeżenia**.

Znane błędy parsera pozostały takie same jak w poprzednich etapach:
- samo słowo „telefon” może błędnie dodać usługę podglądu zdalnego,
- część form klienta i adresu nie jest rozpoznawana prawidłowo,
- zwrot „pierwsze 20 km gratis” nie jest prawidłowo interpretowany,
- test routera/Wi-Fi nie tworzy oczekiwanych pozycji.

## Testy niewykonane automatycznie

- rzeczywiste połączenie z Dropbox — brak prywatnego tokenu,
- płatne zapytanie do OpenAI — brak prywatnego klucza i świadomej zgody na koszt,
- pełne uruchomienie aplikacji przez lokalny adres HTTP było blokowane przez politykę przeglądarki w środowisku testowym; wszystkie pliki produkcyjne uruchomiono bezpośrednio w Chromium i nie wykryto błędów JavaScript.

## GitHub

W głównym katalogu pozostaje `upload_to_github.ps1`. Skrypt:
- używa repozytorium `tomalawsb/Asystent-instalatora`,
- pobiera numer wersji z `app-version.json`,
- tworzy automatyczny opis commita,
- nie pyta o treść commita,
- wykonuje `git push origin main`.
