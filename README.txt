Pomocnik Instalatora PWA
Aktualna wersja programu jest zapisana w pliku app-version.json.

Etap 3 — jedno zrodlo danych i wersji:
- numer wersji jest pobierany wylacznie z app-version.json,
- cennik uslug jest przechowywany wylacznie w cennik.json,
- ceny materialow sa przechowywane wylacznie w material-prices.json,
- usunieto powielone pliki pricing-data.js oraz material-prices.js,
- js/bootstrap.js wczytuje konfiguracje i dane przed uruchomieniem pozostalych modulow,
- service worker tworzy nazwe cache automatycznie na podstawie app-version.json,
- app.js nadal jest generowanym pakietem zgodnosci i nie jest glownym punktem uruchamiania,
- dodano upload_to_github.ps1 do automatycznej synchronizacji z repozytorium.

Repozytorium:
https://github.com/tomalawsb/Asystent-instalatora

Uruchamianie:
Aplikacje nalezy otwierac przez serwer HTTP/HTTPS. Tryb PWA i ladowanie plikow JSON nie dzialaja poprawnie po bezposrednim otwarciu index.html jako file://.
