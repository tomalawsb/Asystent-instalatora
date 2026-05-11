Pomocnik Instalatora PWA v1.8.0 / paczka v10

Zmiany w tej paczce:
1. Etap 7: edycja cennika z poziomu aplikacji.
   - Dodawanie nowych pozycji.
   - Edycja nazw, jednostek i cen netto.
   - Usuwanie pozycji.
   - Import i eksport cennika JSON.
   - Przywracanie domyślnego cennika.

2. Etap 8: synchronizacja Dropbox.
   - Tryb lokalny albo Dropbox.
   - Jeden plik JSON w Dropboxie dla telefonu i komputera.
   - Scalanie rekordów po updatedAt/version.
   - Usunięcia zapisywane jako tombstone/deletedAt, żeby wpis nie wracał po synchronizacji z drugiego urządzenia.
   - Opcjonalna automatyczna synchronizacja po zapisie/usunięciu wyceny.

3. Cache PWA podbity do wersji pomocnik-instalatora-pwa-v1-8-0.

Po wrzuceniu na GitHub Pages użyj przycisku „Odśwież cache”.
