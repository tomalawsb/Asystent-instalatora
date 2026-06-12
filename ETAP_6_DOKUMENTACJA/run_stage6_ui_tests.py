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
      window.alert = () => {};
      navigator.clipboard = { writeText: async () => {} };
    }""")
    page.evaluate("([config,catalog,materials]) => { window.APP_CONFIG=config; window.APP_VERSION=config.version; window.PRICE_CATALOG=catalog; window.MATERIAL_PRICE_DB=materials; }", [CONFIG, CATALOG, MATERIALS])
    for rel in SCRIPT_ORDER:
        page.add_script_tag(path=str(ROOT/rel))
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded', {bubbles:true}))")
    page.evaluate("version => { document.getElementById('appVersionBadge').textContent = 'Wersja ' + version; document.getElementById('appVersionFooter').textContent = 'Wersja programu: ' + version; }", CONFIG['version'])
    page.wait_for_timeout(450)


def collect_errors(page):
    errors = []
    page.on('console', lambda msg: errors.append(f'console {msg.type}: {msg.text}') if msg.type == 'error' else None)
    page.on('pageerror', lambda exc: errors.append(f'pageerror: {exc}'))
    return errors


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])

    desktop = browser.new_page(viewport={'width': 1440, 'height': 1000})
    desktop_errors = collect_errors(desktop)
    prepare_page(desktop)
    check('Desktop uruchamia się bez błędów', not desktop_errors, '; '.join(desktop_errors))
    check('Mobilny przycisk jest ukryty na desktopie', desktop.locator('#mobileWorkflowPrimaryBtn').evaluate("el => getComputedStyle(el).display") == 'none')
    check('Desktopowy przycisk Dalej jest widoczny', desktop.locator('#workflowNextBtn').is_visible())
    check('Pasek etapów desktopu pozostaje sticky', desktop.locator('#workflowActions').evaluate("el => getComputedStyle(el).position") == 'sticky')
    desktop.locator('[data-workflow-target="4"]').click()
    check('Desktopowy przycisk Dalej znika na finalizacji', desktop.locator('#workflowNextBtn').get_attribute('hidden') is not None)
    check('Karta zapisu pozostaje widoczna na desktopie', desktop.locator('#saveQuoteBtn').is_visible())
    desktop.screenshot(path=str(ROOT/'ETAP_6_DOKUMENTACJA/screenshot-desktop.png'), full_page=False)
    desktop.close()

    for width, height in [(360, 800), (390, 844), (412, 915)]:
        mobile = browser.new_page(viewport={'width': width, 'height': height})
        mobile_errors = collect_errors(mobile)
        prepare_page(mobile)
        prefix = f'Mobile {width}px'

        overflow = mobile.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
        check(f'{prefix}: brak poziomego przepełnienia', overflow <= 0, str(overflow))

        steps_box = mobile.locator('.workflow-steps').bounding_box()
        step_boxes = [mobile.locator('.workflow-step').nth(i).bounding_box() for i in range(4)]
        all_steps_inside = all(box and steps_box and box['x'] >= steps_box['x'] - 1 and box['x'] + box['width'] <= steps_box['x'] + steps_box['width'] + 1 for box in step_boxes)
        check(f'{prefix}: cztery etapy mieszczą się bez przewijania', all_steps_inside, str(step_boxes))
        check(f'{prefix}: pasek etapów nie przewija się poziomo', mobile.locator('.workflow-steps').evaluate('el => el.scrollWidth <= el.clientWidth'))

        action_pos = mobile.locator('#workflowActions').evaluate("el => getComputedStyle(el).position")
        check(f'{prefix}: pasek działań jest stały', action_pos == 'fixed', action_pos)
        mobile_primary_display = mobile.locator('#mobileWorkflowPrimaryBtn').evaluate("el => getComputedStyle(el).display")
        check(f'{prefix}: mobilny przycisk główny jest widoczny', mobile_primary_display != 'none', mobile_primary_display)
        check(f'{prefix}: desktopowy przycisk jest ukryty', mobile.locator('#workflowNextBtn').evaluate("el => getComputedStyle(el).display") == 'none')

        nav_box = mobile.locator('.main-navigation').bounding_box()
        action_box = mobile.locator('#workflowActions').bounding_box()
        no_overlap = bool(nav_box and action_box and action_box['y'] + action_box['height'] <= nav_box['y'] + 1)
        check(f'{prefix}: pasek działań nie nachodzi na nawigację', no_overlap, f'action={action_box}, nav={nav_box}')

        prev_height = mobile.locator('#workflowPrevBtn').bounding_box()['height']
        next_height = mobile.locator('#mobileWorkflowPrimaryBtn').bounding_box()['height']
        input_height = mobile.locator('#clientName').evaluate("el => { const old=el.closest('[data-workflow-step]').hidden; return getComputedStyle(el).minHeight; }")
        check(f'{prefix}: przyciski dotykowe mają min. 44 px', prev_height >= 44 and next_height >= 44, f'{prev_height}/{next_height}')
        check(f'{prefix}: pola formularza mają 16 px', mobile.locator('#voiceCommand').evaluate("el => parseFloat(getComputedStyle(el).fontSize)") >= 16)

        mobile.locator('#mobileWorkflowPrimaryBtn').click()
        check(f'{prefix}: mobilne Dalej przechodzi do kroku 2', mobile.locator('[data-workflow-step="2"]').is_visible())
        check(f'{prefix}: pasek zapisuje numer kroku', mobile.locator('#workflowActions').get_attribute('data-step') == '2')
        mobile.locator('[data-workflow-target="4"]').click()
        check(f'{prefix}: na finalizacji przycisk zmienia się na Zapisz', mobile.locator('#mobileWorkflowPrimaryBtn').inner_text().strip() == 'Zapisz wycenę')
        check(f'{prefix}: finalizacja ma akcję save', mobile.locator('#mobileWorkflowPrimaryBtn').get_attribute('data-action') == 'save')

        mobile.locator('#shareMenu > summary').click()
        mobile.wait_for_timeout(80)
        menu_pos = mobile.locator('#shareMenu .action-menu-content').evaluate("el => getComputedStyle(el).position")
        body_locked = mobile.locator('body').evaluate("el => el.classList.contains('action-menu-open')")
        backdrop_style = mobile.locator('#shareMenu').evaluate("el => { const s=getComputedStyle(el, '::before'); return {content:s.content, background:s.backgroundColor, position:s.position}; }")
        menu_box = mobile.locator('#shareMenu .action-menu-content').bounding_box()
        check(f'{prefix}: menu udostępniania jest dolnym panelem', menu_pos == 'fixed', menu_pos)
        check(f'{prefix}: menu blokuje przewijanie tła', body_locked)
        check(f'{prefix}: menu ma przyciemnione tło', backdrop_style['position'] == 'fixed' and backdrop_style['background'] not in ('rgba(0, 0, 0, 0)', 'transparent'), str(backdrop_style))
        check(f'{prefix}: menu mieści się w widoku', bool(menu_box and menu_box['y'] >= 0 and menu_box['y'] + menu_box['height'] <= height + 1), str(menu_box))
        mobile.keyboard.press('Escape')
        mobile.wait_for_timeout(50)
        check(f'{prefix}: Escape zamyka menu', mobile.locator('#shareMenu').get_attribute('open') is None)

        if width == 390:
            mobile.locator('[data-workflow-target="2"]').click()
            mobile.locator('#clientName').fill('Test mobilnego zapisu')
            mobile.locator('[data-workflow-target="4"]').click()
            mobile.locator('#mobileWorkflowPrimaryBtn').click()
            mobile.wait_for_timeout(100)
            saved_count = mobile.evaluate("JSON.parse(localStorage.getItem('pomocnik-instalatora-pwa-v1-quotes') || '[]').length")
            check('Mobile 390px: stały przycisk faktycznie zapisuje wycenę', saved_count >= 1, str(saved_count))

        check(f'{prefix}: brak błędów JavaScript', not mobile_errors, '; '.join(mobile_errors))
        if width == 390:
            mobile.screenshot(path=str(ROOT/'ETAP_6_DOKUMENTACJA/screenshot-mobile-390.png'), full_page=False)
        mobile.close()

    landscape = browser.new_page(viewport={'width': 844, 'height': 390})
    landscape_errors = collect_errors(landscape)
    prepare_page(landscape)
    check('Poziomo: brak przepełnienia', landscape.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'))
    check('Poziomo: nawigacja ma obniżoną wysokość', landscape.locator('.main-navigation .tab').first.bounding_box()['height'] <= 52)
    check('Poziomo: pasek działań pozostaje nad nawigacją', landscape.locator('#workflowActions').bounding_box()['y'] + landscape.locator('#workflowActions').bounding_box()['height'] <= landscape.locator('.main-navigation').bounding_box()['y'] + 1)
    check('Poziomo: brak błędów JavaScript', not landscape_errors, '; '.join(landscape_errors))
    landscape.screenshot(path=str(ROOT/'ETAP_6_DOKUMENTACJA/screenshot-mobile-landscape.png'), full_page=False)
    landscape.close()

    browser.close()

lines = [f"{'PASS' if ok else 'FAIL'} | {name}" + (f" | {details}" if details else '') for name, ok, details in RESULTS]
lines.append(f"SUMMARY {sum(ok for _,ok,_ in RESULTS)}/{len(RESULTS)}")
(ROOT/'ETAP_6_DOKUMENTACJA/UI_TEST_RESULTS.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
sys.exit(0 if all(ok for _,ok,_ in RESULTS) else 1)
