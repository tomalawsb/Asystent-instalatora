#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT/'index.html').read_text(encoding='utf-8')
HTML = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', HTML)
HTML = re.sub(r'<script type="module" src="js/bootstrap\.js"></script>', '', HTML)
SCRIPT_ORDER = [
    'js/storage.js','js/catalog.js','js/quote.js','js/parser-local.js','js/parser-ai.js',
    'js/sync.js','js/export.js','js/ui.js','js/state.js','js/patches.js','js/ai-runtime.js','js/workflow.js'
]
CONFIG = json.loads((ROOT/'app-version.json').read_text(encoding='utf-8'))
CATALOG = json.loads((ROOT/'cennik.json').read_text(encoding='utf-8'))
MATERIALS = json.loads((ROOT/'material-prices.json').read_text(encoding='utf-8'))
RESULTS = []


def check(name, condition, details=''):
    RESULTS.append((name, bool(condition), details))


def prepare_page(page):
    page.set_content(HTML, wait_until='domcontentloaded')
    page.add_style_tag(path=str(ROOT/'style.css'))
    page.evaluate("""() => {
      const data = new Map();
      const storage = {
        getItem: key => data.has(String(key)) ? data.get(String(key)) : null,
        setItem: (key, value) => data.set(String(key), String(value)),
        removeItem: key => data.delete(String(key)),
        clear: () => data.clear(),
        key: index => Array.from(data.keys())[index] ?? null,
        get length() { return data.size; }
      };
      Object.defineProperty(window, 'localStorage', {value: storage, configurable: true});
      window.confirm = () => true;
    }""")
    page.evaluate("([config,catalog,materials]) => { window.APP_CONFIG=config; window.APP_VERSION=config.version; window.PRICE_CATALOG=catalog; window.MATERIAL_PRICE_DB=materials; }", [CONFIG, CATALOG, MATERIALS])
    for rel in SCRIPT_ORDER:
        page.add_script_tag(path=str(ROOT/rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded', {bubbles:true}))")
    page.evaluate("version => { document.getElementById('appVersionBadge').textContent = 'Wersja ' + version; document.getElementById('appVersionFooter').textContent = 'Wersja programu: ' + version; }", CONFIG['version'])
    page.wait_for_timeout(400)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('console', lambda msg: errors.append(f'console {msg.type}: {msg.text}') if msg.type == 'error' else None)
    page.on('pageerror', lambda exc: errors.append(f'pageerror: {exc}'))
    prepare_page(page)

    check('Brak błędów uruchomienia', not errors, '; '.join(errors))
    check('Jeden przycisk analizy', page.locator('#analyzeVoiceBtn').count() == 1 and page.locator('#analyzeVoiceAiBtn').count() == 0)
    check('Przycisk ma nazwę Analizuj wizytę', page.locator('#analyzeVoiceBtn').inner_text().strip() == 'Analizuj wizytę')
    check('Domyślny opis trybu lokalnego', 'parser lokalny' in page.locator('#analysisModeHint').inner_text().lower())

    page.locator('#voiceCommand').fill('Klient Jan Kowalski, Mielec. Montaż 2 kamer tubowych i 20 metrów przewodu.')
    page.locator('#analyzeVoiceBtn').click()
    page.wait_for_timeout(250)
    check('Jeden przycisk uruchamia parser lokalny', page.locator('#parserPreview').is_visible())
    check('Analiza otwiera etap weryfikacji', page.locator('[data-workflow-step="2"]').is_visible())
    page.locator('#acceptParserBtn').click()
    page.wait_for_timeout(220)
    check('Zatwierdzenie otwiera etap wyceny', page.locator('[data-workflow-step="3"]').is_visible())
    check('Pozycje zostały dodane', page.locator('#servicesBody tr').count() > 0 or page.locator('#serviceCards .service-card').count() > 0)

    # Automatyczne podglądy po zmianie danych.
    page.locator('[data-workflow-target="4"]').click()
    old_message = page.locator('#clientMessagePreview').input_value()
    page.locator('[data-workflow-target="2"]').click()
    page.locator('#clientAddress').fill('Adres Automatyczny 15')
    page.locator('[data-workflow-target="4"]').click()
    new_message = page.locator('#clientMessagePreview').input_value()
    check('Wiadomość odświeża się automatycznie', old_message != new_message and 'Adres Automatyczny 15' in new_message)
    check('Brak ręcznych przycisków Odśwież', page.locator('#refreshClientMessageBtn').count() == 0 and page.locator('#refreshMaterialsBtn').count() == 0)
    check('Lista materiałów jest widoczna', page.locator('#materialsPreview').inner_text().strip() != '')

    # Jedno menu udostępniania.
    check('Jedno menu Udostępnij', page.locator('#shareMenu').count() == 1)
    page.locator('#shareMenu > summary').click()
    check('Menu Udostępnij otwiera się', page.locator('#shareMenu').get_attribute('open') is not None)
    check('Menu zawiera siedem działań', page.locator('#shareMenu .action-menu-content button').count() == 7)
    check('Brak powielonych starych akcji', all(page.locator('#'+old_id).count() == 0 for old_id in [
        'copyClientSmsBtn','copyClientSmsPreviewBtn','offerPdfBtn','offerPdfPreviewBtn','exportTxtBtn','printBtn','copyMaterialsBtn','copyReportBtn'
    ]))
    page.locator('#shareSmsBtn').click()
    page.wait_for_timeout(100)
    check('Menu zamyka się po wybraniu działania', page.locator('#shareMenu').get_attribute('open') is None)

    # Jeden zapis ustawień.
    page.locator('[data-tab="moreTab"]').click()
    check('Jeden przycisk zapisu ustawień', page.locator('#saveSettingsBtn').count() == 1)
    check('Brak osobnego zapisu AI i Dropbox', page.locator('#saveAiSettingsBtn').count() == 0 and page.locator('#saveDropboxSettingsBtn').count() == 0)
    page.locator('#companyName').fill('Firma Etap 5')
    page.locator('[data-more-target="aiSettingsPanel"]').click()
    page.locator('#aiParserMode').select_option('local')
    page.locator('#saveSettingsBtn').click()
    saved_company = page.evaluate("JSON.parse(localStorage.getItem('pomocnik-instalatora-pwa-v1-settings') || '{}').companyName")
    check('Wspólny zapis zapisuje ustawienia', saved_company == 'Firma Etap 5', str(saved_company))

    # Zapisana wycena: Otwórz + Więcej.
    page.locator('[data-tab="quoteTab"]').click()
    page.locator('[data-workflow-target="4"]').click()
    page.locator('#saveQuoteBtn').click()
    page.wait_for_timeout(220)
    page.locator('[data-tab="savedTab"]').click()
    check('Zapisana wycena ma przycisk Otwórz', page.locator('#savedQuotes .load').first.inner_text().strip() == 'Otwórz')
    check('Zapisana wycena ma jedno menu Więcej', page.locator('#savedQuotes .saved-more-menu').count() >= 1)
    check('Akcje zapisanej wyceny są schowane w menu', page.locator('#savedQuotes .saved-more-menu .txt').count() >= 1 and page.locator('#savedQuotes > .saved-card > .saved-actions > .txt').count() == 0)

    page.screenshot(path=str(ROOT/'ETAP_5_DOKUMENTACJA/screenshot-desktop.png'), full_page=True)

    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile_errors = []
    mobile.on('console', lambda msg: mobile_errors.append(f'console {msg.type}: {msg.text}') if msg.type == 'error' else None)
    mobile.on('pageerror', lambda exc: mobile_errors.append(f'pageerror: {exc}'))
    prepare_page(mobile)
    mobile.locator('[data-workflow-target="4"]').click()
    mobile.locator('#shareMenu > summary').click()
    menu_position = mobile.locator('#shareMenu .action-menu-content').evaluate("el => getComputedStyle(el).position")
    check('Mobilne menu udostępniania jest stałe', menu_position == 'fixed', menu_position)
    check('Brak poziomego przepełnienia 390 px', mobile.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'))
    check('Brak błędów mobilnych', not mobile_errors, '; '.join(mobile_errors))
    mobile.screenshot(path=str(ROOT/'ETAP_5_DOKUMENTACJA/screenshot-mobile.png'), full_page=True)
    mobile.close()
    browser.close()

lines = [f"{'PASS' if ok else 'FAIL'} | {name}" + (f" | {details}" if details else '') for name, ok, details in RESULTS]
lines.append(f"SUMMARY {sum(ok for _,ok,_ in RESULTS)}/{len(RESULTS)}")
(ROOT/'ETAP_5_DOKUMENTACJA/UI_TEST_RESULTS.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
sys.exit(0 if all(ok for _,ok,_ in RESULTS) else 1)
