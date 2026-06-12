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
    check('Aktywny krok 1', page.locator('[data-workflow-step="1"]').is_visible())
    check('Tylko jeden aktywny etap', page.locator('.workflow-panel.active').count() == 1)
    check('Cztery kroki procesu', page.locator('.workflow-step').count() == 4)
    check('Cztery pozycje nawigacji głównej', page.locator('.main-navigation .tab').count() == 4)

    page.locator('[data-workflow-target="2"]').click()
    check('Przejście do kroku 2', page.locator('[data-workflow-step="2"]').is_visible())
    page.locator('#workflowNextBtn').click()
    check('Przejście Dalej do kroku 3', page.locator('[data-workflow-step="3"]').is_visible())
    page.locator('#workflowPrevBtn').click()
    check('Przejście Wstecz do kroku 2', page.locator('[data-workflow-step="2"]').is_visible())

    page.locator('[data-tab="moreTab"]').click()
    check('Otwarcie zakładki Więcej', page.locator('#moreTab').is_visible())
    page.locator('[data-more-target="syncSettingsPanel"]').click()
    check('Otwarcie synchronizacji', page.locator('#syncSettingsPanel').is_visible())
    page.locator('[data-more-target="advancedSettingsPanel"]').click()
    check('Otwarcie ustawień zaawansowanych', page.locator('#advancedSettingsPanel').is_visible())

    page.locator('[data-tab="quoteTab"]').click()
    page.locator('[data-workflow-target="1"]').click()
    page.locator('#voiceCommand').fill('Klient Jan Kowalski, adres Mielec. Montaż 2 kamer tubowych i 20 metrów przewodu.')
    page.locator('#analyzeVoiceBtn').click()
    page.wait_for_timeout(300)
    check('Analiza otwiera krok 2', page.locator('[data-workflow-step="2"]').is_visible())
    check('Podgląd parsera jest widoczny', page.locator('#parserPreview').is_visible())
    page.locator('#acceptParserBtn').click()
    page.wait_for_timeout(200)
    check('Zatwierdzenie otwiera krok 3', page.locator('[data-workflow-step="3"]').is_visible())
    check('Pozycje zostały dodane', page.locator('#servicesBody tr').count() > 0 or page.locator('#serviceCards .service-card').count() > 0)
    page.screenshot(path=str(ROOT/'ETAP_4_DOKUMENTACJA/screenshot-desktop.png'), full_page=True)

    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile_errors = []
    mobile.on('console', lambda msg: mobile_errors.append(f'console {msg.type}: {msg.text}') if msg.type == 'error' else None)
    mobile.on('pageerror', lambda exc: mobile_errors.append(f'pageerror: {exc}'))
    prepare_page(mobile)
    nav_position = mobile.locator('.main-navigation').evaluate("el => getComputedStyle(el).position")
    nav_bottom = mobile.locator('.main-navigation').evaluate("el => getComputedStyle(el).bottom")
    check('Mobilna nawigacja jest przyklejona', nav_position == 'fixed', f'position={nav_position}')
    check('Mobilna nawigacja jest na dole', nav_bottom != 'auto', f'bottom={nav_bottom}')
    check('Brak poziomego przepełnienia 390 px', mobile.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'))
    check('Brak błędów mobilnych', not mobile_errors, '; '.join(mobile_errors))
    mobile.screenshot(path=str(ROOT/'ETAP_4_DOKUMENTACJA/screenshot-mobile.png'), full_page=True)
    mobile.close()
    browser.close()

lines = [f"{'PASS' if ok else 'FAIL'} | {name}" + (f" | {details}" if details else '') for name, ok, details in RESULTS]
lines.append(f"SUMMARY {sum(ok for _,ok,_ in RESULTS)}/{len(RESULTS)}")
(ROOT/'ETAP_4_DOKUMENTACJA/UI_TEST_RESULTS.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
sys.exit(0 if all(ok for _,ok,_ in RESULTS) else 1)
