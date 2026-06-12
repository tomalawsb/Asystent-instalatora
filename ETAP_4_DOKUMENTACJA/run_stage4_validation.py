#!/usr/bin/env python3
from pathlib import Path
import hashlib
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
check('Etap wersji równy 4', config.get('stage') == 4, str(config.get('stage')))
check('Wersja ma format 4.0 - DDMMRRHHMM', bool(re.fullmatch(r'4\.0 - \d{10}', version)), version)
check('Build etapu 4', 'etap-4' in str(config.get('build', '')), str(config.get('build', '')))

html = read('index.html')
ids = re.findall(r'\bid="([^"]+)"', html)
check('Brak zduplikowanych identyfikatorów HTML', len(ids) == len(set(ids)))
check('Cztery pozycje głównej nawigacji', len(re.findall(r'class="tab(?: active)?" data-tab=', html)) == 4)
check('Cztery etapy wyceny', len(re.findall(r'data-workflow-step="[1-4]"', html)) == 4)
check('Cztery przyciski etapów', len(re.findall(r'data-workflow-target="[1-4]"', html)) == 4)
for expected in ['quoteTab', 'savedTab', 'catalogTab', 'moreTab']:
    check(f'Główna zakładka {expected}', f'data-tab="{expected}"' in html)
for expected in ['settingsTab', 'aiSettingsPanel', 'syncSettingsPanel', 'advancedSettingsPanel', 'helpTab']:
    check(f'Sekcja Więcej {expected}', f'id="{expected}"' in html)

old_required_ids = {
    'voiceCommand','voiceBtn','analyzeVoiceBtn','analyzeVoiceAiBtn','loadTextFileBtn',
    'parserPreview','parserPreviewContent','acceptParserBtn','rejectParserBtn',
    'clientName','clientPhone','clientAddress','visitDate','jobType','notes',
    'categorySelect','serviceSelect','qtyInput','priceInput','addServiceBtn',
    'servicesBody','serviceCards','sumNet','sumVat','sumGross','distanceKm',
    'distanceRate','freeKm','saveQuoteBtn','exportTxtBtn','copyClientSmsBtn',
    'offerPdfBtn','printBtn','savedQuotes','catalogView','companyName','vatRate',
    'uiTheme','storageMode','dropboxPath','dropboxToken','aiParserMode','aiModel'
}
missing_ids = sorted(old_required_ids - set(ids))
check('Zachowano kluczowe identyfikatory starego interfejsu', not missing_ids, ', '.join(missing_ids))

bootstrap = read('js/bootstrap.js')
service_worker = read('service-worker.js')
bundle_tool = read('tools/build-app-bundle.js')
workflow = read('js/workflow.js')
style = read('style.css')
app_bundle = read('app.js')
ps1 = read('upload_to_github.ps1')

check('Bootstrap ładuje workflow.js', "'js/workflow.js'" in bootstrap)
check('Service worker cacheuje workflow.js', "'./js/workflow.js'" in service_worker)
check('Generator pakietu uwzględnia workflow.js', "'workflow.js'" in bundle_tool)
check('Pakiet zgodności ma aktualną wersję', f'Wersja: {version}' in app_bundle)
check('Pakiet zgodności zawiera sterowanie etapami', 'function setWorkflowStep' in app_bundle)
check('Mobilna nawigacja używa position fixed', re.search(r'@media \(max-width: 850px\)[\s\S]*?\.main-navigation\.tabs\s*\{[\s\S]*?position:\s*fixed', style) is not None)
check('Reguła hidden nie jest nadpisywana', '[hidden] { display: none !important; }' in style)
check('Workflow nie zmienia funkcji parsera', 'parseSmartCommand =' not in workflow and 'function parseSmartCommand' not in workflow)
check('Repozytorium GitHub w PS1 jest prawidłowe', 'https://github.com/tomalawsb/Asystent-instalatora.git' in ps1)
check('PS1 wymaga modułu workflow', 'js\\workflow.js' in ps1)
check('PS1 używa automatycznego opisu commita', '$DefaultCommitMessage' in ps1 and 'Read-Host' not in ps1)

check('Brak pricing-data.js', not (ROOT/'pricing-data.js').exists())
check('Brak material-prices.js', not (ROOT/'material-prices.js').exists())
check('Jedynym źródłem cennika jest cennik.json', (ROOT/'cennik.json').is_file())
check('Jedynym źródłem cen materiałów jest material-prices.json', (ROOT/'material-prices.json').is_file())

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
(ROOT/'ETAP_4_DOKUMENTACJA/validation-results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
lines = [f"Wersja: {version}", f"PASS: {summary['pass']} | FAIL: {summary['fail']}", '']
for item in RESULTS:
    line = f"{item['status']}: {item['name']}"
    if item['details']:
        line += f" — {item['details']}"
    lines.append(line)
(ROOT/'ETAP_4_DOKUMENTACJA/VALIDATION_RESULTS.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
sys.exit(1 if summary['fail'] else 0)
