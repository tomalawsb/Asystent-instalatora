Pomocnik Instalatora PWA
Wersja: 4.2 - 1206260811

ETAP 5 — KONSOLIDACJA FUNKCJI I PRZYCISKÓW

Najważniejsze zmiany:
- jeden przycisk „Analizuj wizytę”; program używa trybu lokalnego albo AI wybranego w ustawieniach,
- jedno menu „Udostępnij” zawierające SMS, opis wyceny, TXT, PDF, drukowanie, materiały i raport analizy,
- podgląd wiadomości oraz lista materiałów aktualizują się automatycznie — usunięto ręczne przyciski „Odśwież”,
- zapisane wyceny mają tylko przycisk „Otwórz” i menu „Więcej”,
- cennik, baza materiałów i Dropbox mają najczęstsze działanie na wierzchu, a operacje dodatkowe w menu „Więcej”,
- wszystkie ustawienia zapisuje jeden przycisk „Zapisz wszystkie ustawienia”,
- zmiana motywu daje podgląd, ale zapis następuje dopiero po użyciu wspólnego przycisku,
- usunięto powielony nagłówek „Więcej opcji”,
- nie zmieniano parsera lokalnego, reguł AI, obliczeń, formatu danych ani synchronizacji wycen.

Uruchomienie lokalne:
- aplikację należy otwierać przez serwer HTTP, a nie bezpośrednio jako plik file://,
- przykładowo: python -m http.server 8000
- następnie: http://localhost:8000

Wysyłka na GitHub:
- uruchom plik upload_to_github.ps1 w głównym katalogu programu,
- repozytorium: https://github.com/tomalawsb/Asystent-instalatora.git

Uwaga dotycząca OpenAI:
Klucz API jest zapisywany lokalnie w przeglądarce/PWA. Nie jest umieszczany w plikach programu ani w repozytorium GitHub.

Zmiany w etapie 6:
- dopracowano interfejs dla telefonów 360–412 px,
- dodano stały dolny pasek Wstecz / Dalej / Zapisz,
- cztery etapy wyceny mieszczą się na ekranie bez przewijania poziomego,
- zwiększono pola dotykowe i rozmiar pól formularzy,
- menu Udostępnij i Więcej działa na telefonie jako dolny panel,
- poprawiono bezpieczne odstępy PWA i obsługę klawiatury ekranowej.

