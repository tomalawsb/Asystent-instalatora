# Etap 3 — jedno zrodlo danych i wersji

Wersja: **3.9 - 1206260723**  
Build: **1206260723-etap-3-single-source**

## Wykonane zmiany

1. `app-version.json` jest jedynym recznie edytowanym zrodlem numeru wersji.
2. `cennik.json` jest jedynym zrodlem domyslnego cennika uslug.
3. `material-prices.json` jest jedynym zrodlem bazy cen materialow.
4. Usunieto `pricing-data.js` i `material-prices.js`.
5. Dodano `js/bootstrap.js`, ktory przed uruchomieniem aplikacji wczytuje trzy pliki JSON, waliduje je i ustawia dane globalne wymagane przez istniejace moduly.
6. `index.html` nie zawiera juz wpisanego numeru wersji ani listy wszystkich modulow.
7. `service-worker.js` wylicza nazwe cache na podstawie `build` z `app-version.json`.
8. `js/state.js` nie zawiera recznie wpisanego numeru wersji.
9. Generator `tools/build-app-bundle.js` pobiera wersje automatycznie z `app-version.json`.
10. Dodano `upload_to_github.ps1` dla repozytorium `tomalawsb/Asystent-instalatora`.

## Wazne zachowanie

- Aplikacja musi byc uruchamiana przez HTTP/HTTPS. Bezposrednie otwarcie `index.html` jako `file://` nie jest wspierane, poniewaz przegladarki blokuja pobieranie lokalnych plikow JSON.
- `app.js` pozostaje wygenerowanym pakietem zgodnosci, lecz strona uruchamia aplikacje przez `js/bootstrap.js`.
- Etap 3 nie zmienia algorytmow parsera, wyliczen, eksportu ani synchronizacji Dropbox.

## Walidacja

- Kontrole etapu 3: **30 PASS, 0 FAIL**.
- Test uruchomienia `js/bootstrap.js`: poprawnie wczytano wersję, 13 kategorii cennika, 79 pozycji materiałowych i 11 modułów aplikacji.
- Test różnicowy względem etapu 2: **8/8 wyników zgodnych**.
- Testy bazowe całej aplikacji: **44 PASS, 4 znane błędy parsera lokalnego, 2 ostrzeżenia dotyczące testów wymagających prywatnych kluczy**.
- Nie wykryto nowych błędów w obliczeniach, zapisie danych, eksporcie, synchronizacji rekordów ani konwersji odpowiedzi AI.

## Znane problemy pozostawione bez zmian

Etap 3 nie naprawia parsera. Nadal występują wcześniej wykryte problemy:
- słowo „telefon” może błędnie dodać usługę podglądu zdalnego,
- nierozpoznawanie części zapisów o bezpłatnych kilometrach,
- niestabilne rozpoznawanie klienta i adresu,
- brak części usług routera/Wi-Fi.

## GitHub

Plik `upload_to_github.ps1`:
- ma wpisane repozytorium `https://github.com/tomalawsb/Asystent-instalatora.git`,
- automatycznie pobiera opis wersji z `app-version.json`,
- nie pyta o treść commita,
- usuwa z repozytorium stare kopie `pricing-data.js` i `material-prices.js`,
- wykonuje commit i `git push origin main`.
