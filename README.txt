Pomocnik Instalatora PWA
Wersja: 4.7 - 1206261049

Poprawka krytyczna uruchamiania:
- naprawiono brak reakcji przycisków i funkcji,
- aplikacja uruchamia kod w poprawnej kolejności,
- działa po wdrożeniu na serwerze oraz po bezpośrednim otwarciu index.html z dysku,
- app-version.json, cennik.json i material-prices.json pozostają źródłami danych,
- runtime-data.js i app.js są plikami generowanymi automatycznie.

Wysyłka na GitHub:
Uruchom upload_to_github.ps1 w głównym folderze programu. Skrypt automatycznie odbuduje pliki generowane przed wysłaniem.


Zmiany 4.6:
- dodano 6 skórek układu interfejsu,
- kolorystyka i układ są wybierane niezależnie,
- skórki mogą zmieniać położenie nawigacji i etapów pracy,
- wybór zapisuje się w ustawieniach i kopii danych.


Zmiany 4.7:
- AI OpenAI jest głównym silnikiem analizy; parser lokalny działa wyłącznie awaryjnie.
- opcjonalne wyszukiwanie brakujących cen w internecie przez web_search.
- ceny AI mogą pozostać tylko w wycenie, zostać zapisane po zatwierdzeniu albo automatycznie.
- obsługa wariantów ofert i źródeł cen.
