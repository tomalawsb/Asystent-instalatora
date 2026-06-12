# Etap 1 — zabezpieczenie i testy bazowe

Ten folder nie zmienia działania aplikacji. Zawiera testy, dane kontrolne i checklistę potrzebne przed przebudową interfejsu oraz kodu.

## Uruchomienie automatyczne

Windows:

1. Uruchom `run_tests.bat` albo `run_tests.ps1`.
2. Wyniki znajdziesz w `results/baseline-results.md` i `results/baseline-results.json`.

Wymagany jest Node.js LTS. Testy nie instalują bibliotek i nie łączą się z Internetem.

## Znaczenie wyników

- `PASS` — mechanizm przeszedł test.
- `FAIL` — obecne działanie nie spełnia ustalonego wyniku oczekiwanego.
- `WARN` — ryzyko albo funkcja wymagająca sprawdzenia ręcznego.

Nie należy zmieniać oczekiwanych rezultatów w `fixtures/parser_cases.json` tylko po to, aby testy przeszły. Są one punktem odniesienia dla kolejnych etapów.
