Pomocnik Instalatora PWA
Wersja: 3.8 - 0706261140 AI Lokalny

Zmiany w tej paczce:
- AI działa bez backendu i bez serwera pośredniego,
- klucz OpenAI wpisujesz bezpośrednio w ustawieniach aplikacji,
- klucz zapisuje się lokalnie w przeglądarce/PWA przez localStorage,
- dodano wybór modelu z listy,
- dodano test klucza OpenAI,
- przycisk „Rozbij AI” używa zapisanego klucza i wybranego modelu,
- parser lokalny zostaje jako tryb awaryjny/offline,
- ceny nadal pochodzą z lokalnego cennika aplikacji.

Uwaga techniczna:
Klucz OpenAI nie jest zapisany w plikach programu ani w repozytorium GitHub. Jest zapamiętywany lokalnie w konkretnej przeglądarce/PWA. Przy takim założeniu nie ma backendu, ale osoba mająca dostęp do urządzenia albo złośliwe rozszerzenie przeglądarki mogłoby potencjalnie odczytać localStorage.
