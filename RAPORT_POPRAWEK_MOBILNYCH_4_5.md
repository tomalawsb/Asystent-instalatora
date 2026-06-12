# Pomocnik Instalatora — poprawki mobilne 4.5 - 1206260915

## Wykonane poprawki

1. Podmieniono ikonę programu:
   - `icon-192.png`
   - `icon-512.png`
   - dodano też użycie ikony w górnym nagłówku aplikacji.

2. Poprawiono mobilny nagłówek:
   - usunięto duży pusty odstęp nad przyciskiem „Nowa wycena”,
   - na telefonie nagłówek nie rozciąga się już pionowo przez `justify-content: space-between`.

3. Poprawiono przewijanie na telefonie:
   - przywrócono normalne przewijanie pionowe `body`,
   - dodano bezpieczne `touch-action: pan-y pinch-zoom`,
   - wzmocniono `overflow: visible` dla głównych kontenerów,
   - usunięto ryzyko pozostania strony w stanie blokady przewijania po menu.

4. Poprawiono dolny pasek kroków:
   - na telefonie pasek akcji zmieniono z `position: fixed` na `position: sticky`,
   - dzięki temu mniej zasłania ekran i mniej przeszkadza w przewijaniu.

5. Dodatkowe poprawki wygody:
   - większa spójność przycisków na telefonie,
   - pełna szerokość przycisku „Nowa wycena”,
   - lepsze zachowanie po powrocie do aplikacji / przełączeniu kart.

## Zmienione pliki

- `index.html`
- `style.css`
- `js/workflow.js`
- `app.js`
- `app-version.json`
- `README.txt`
- `icon-192.png`
- `icon-512.png`

## Wersja

**4.5 - 1206260915**
