#!/usr/bin/env python3
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
RESULTS = []


def check(name, condition, details=''):
    RESULTS.append({'name': name, 'status': 'PASS' if condition else 'FAIL', 'details': details})


def read(path):
    return (ROOT / path).read_text(encoding='utf-8-sig')

required_files = [
    'index.html', 'style.css', 'manifest.json', 'service-worker.js',
    'app-version.json', 'cennik.json', 'material-prices.json', 'app.js',
    'js/bootstrap.js', 'js/workflow.js', 'upload_to_github.ps1'
]
for file_name in required_files:
    check(f'Istnieje {file_name}', (ROOT / file_name).is_file())

config = json.loads(read('app-version.json'))
version = str(config.get('version', ''))
check('Etap wersji równy 6', config.get('stage') == 6, str(config.get('stage')))
check('Wersja ma format 4.2 - DDMMRRHHMM', bool(re.fullmatch(r'4\.2 - \d{10}', version)), version)
check('Build etapu 6', 'etap-6' in str(config.get('build', '')), str(config.get('build', '')))

html = read('index.html')
ids = re.findall(r'\bid="([^"]+)"', html)
check('Brak zduplikowanych identyfikatorów HTML', len(ids) == len(set(ids)))
check('Cztery pozycje głównej nawigacji', len(re.findall(r'class="tab(?: active)?" data-tab=', html)) == 4)
check('Cztery etapy wyceny', len(re.findall(r'data-workflow-step="[1-4]"', html)) == 4)
check('Dodano mobilny przycisk główny', html.count('id="mobileWorkflowPrimaryBtn"') == 1)
check('Pasek etapów przechowuje aktywny krok', 'id="workflowActions"' in html and 'data-step="1"' in html)
check('Mobilny opis kroku ma aria-live', 'id="mobileWorkflowStepLabel"' in html and 'aria-live="polite"' in html)
check('Zachowano jeden przycisk analizy', html.count('id="analyzeVoiceBtn"') == 1 and 'id="analyzeVoiceAiBtn"' not in html)
check('Zachowano jedno menu udostępniania', html.count('id="shareMenu"') == 1)

workflow = read('js/workflow.js')
style = read('style.css')
app_bundle = read('app.js')
bootstrap = read('js/bootstrap.js')
service_worker = read('service-worker.js')
bundle_tool = read('tools/build-app-bundle.js')
ps1 = read('upload_to_github.ps1')

check('Workflow oznaczony jako etap 6', 'etap 6: proces wyceny i interfejs mobilny' in workflow)
check('Mobilny przycisk zapisuje na kroku 4', "mobilePrimary.dataset.action = normalized === 4 ? 'save' : 'next'" in workflow and "getElement('saveQuoteBtn')?.click();" in workflow)
check('Aktywny krok jest centrowany na średnich ekranach', 'function centerActiveWorkflowStep' in workflow and 'container.scrollTo' in workflow)
check('Obsługa klawiatury ekranowej', 'window.visualViewport' in workflow and '--mobile-keyboard-offset' in workflow)
check('Menu można zamknąć klawiszem Escape', "event.key !== 'Escape'" in workflow)
check('Otwarte mobilne menu blokuje przewijanie tła', 'action-menu-open' in workflow and 'body.action-menu-open' in style)
check('Mobilny pasek działań jest fixed', re.search(r'@media \(max-width: 850px\)[\s\S]*?\.workflow-actions\s*\{[\s\S]*?position:\s*fixed', style) is not None)
check('Pasek uwzględnia safe-area i klawiaturę', 'env(safe-area-inset-bottom)' in style and 'var(--mobile-keyboard-offset)' in style)
check('Etapy są siatką na małym telefonie', re.search(r'@media \(max-width: 620px\)[\s\S]*?\.workflow-steps\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4', style) is not None)
check('Minimalne pola dotykowe 44 px', 'min-height: 44px;' in style)
check('Pola formularza mają 16 px na telefonie', re.search(r'input:not\(\[type="checkbox"\]\)[\s\S]*?font-size:\s*16px', style) is not None)
check('Menu mobilne ma postać dolnego panelu', '.action-menu[open]::before' in style and 'max-height: min(58dvh, 470px)' in style)
check('Obsłużono bardzo wąskie telefony', '@media (max-width: 370px)' in style)
check('Obsłużono orientację poziomą', '@media (orientation: landscape)' in style)
check('Uwzględniono ograniczenie animacji', '@media (prefers-reduced-motion: reduce)' in style)
check('Reguła hidden pozostaje ostatnia', style.rstrip().endswith('[hidden] { display: none !important; }'))

check('Bootstrap ładuje workflow.js', "'js/workflow.js'" in bootstrap)
check('Service worker cacheuje workflow.js', "'./js/workflow.js'" in service_worker)
check('Generator pakietu uwzględnia workflow.js', "'workflow.js'" in bundle_tool)
check('Pakiet zgodności ma aktualną wersję', f'Wersja: {version}' in app_bundle)
check('Repozytorium GitHub w PS1 jest prawidłowe', 'https://github.com/tomalawsb/Asystent-instalatora.git' in ps1)
check('PS1 używa automatycznego opisu commita', '$DefaultCommitMessage' in ps1 and 'Read-Host' not in ps1)

check('Brak pricing-data.js', not (ROOT/'pricing-data.js').exists())
check('Brak material-prices.js', not (ROOT/'material-prices.js').exists())

js_files = sorted((ROOT/'js').glob('*.js')) + [ROOT/'service-worker.js', ROOT/'tools/build-app-bundle.js']
syntax_failures = []
for file_path in js_files:
    result = subprocess.run(['node', '--check', str(file_path)], capture_output=True, text=True)
    if result.returncode != 0:
        syntax_failures.append(f'{file_path.relative_to(ROOT)}: {result.stderr.strip()}')
check('Składnia wszystkich plików JavaScript', not syntax_failures, ' | '.join(syntax_failures))

static_refs = set()
for file_path in (ROOT/'js').glob('*.js'):
    source = file_path.read_text(encoding='utf-8-sig')
    static_refs.update(re.findall(r"\$\(['\"]([^'\"]+)['\"]\)", source))
    static_refs.update(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", source))
missing_static = sorted(static_refs - set(ids) - {'addPreviewItemBtn'})
check('Statyczne odwołania JS mają elementy HTML', not missing_static, ', '.join(missing_static))

summary = {
    'version': version,
    'pass': sum(item['status'] == 'PASS' for item in RESULTS),
    'fail': sum(item['status'] == 'FAIL' for item in RESULTS),
    'results': RESULTS
}
(ROOT/'ETAP_6_DOKUMENTACJA/validation-results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
lines = [f"Wersja: {version}", f"PASS: {summary['pass']} | FAIL: {summary['fail']}", '']
for item in RESULTS:
    line = f"{item['status']}: {item['name']}"
    if item['details']:
        line += f" — {item['details']}"
    lines.append(line)
(ROOT/'ETAP_6_DOKUMENTACJA/VALIDATION_RESULTS.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
sys.exit(1 if summary['fail'] else 0)
