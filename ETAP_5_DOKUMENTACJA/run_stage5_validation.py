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
check('Etap wersji równy 5', config.get('stage') == 5, str(config.get('stage')))
check('Wersja ma format 4.1 - DDMMRRHHMM', bool(re.fullmatch(r'4\.1 - \d{10}', version)), version)
check('Build etapu 5', 'etap-5' in str(config.get('build', '')), str(config.get('build', '')))

html = read('index.html')
ids = re.findall(r'\bid="([^"]+)"', html)
check('Brak zduplikowanych identyfikatorów HTML', len(ids) == len(set(ids)))
check('Cztery pozycje głównej nawigacji', len(re.findall(r'class="tab(?: active)?" data-tab=', html)) == 4)
check('Cztery etapy wyceny', len(re.findall(r'data-workflow-step="[1-4]"', html)) == 4)
check('Jeden przycisk analizy wizyty', html.count('id="analyzeVoiceBtn"') == 1 and 'id="analyzeVoiceAiBtn"' not in html)
check('Jedno menu udostępniania', html.count('id="shareMenu"') == 1)
for share_id in ['shareSmsBtn','shareDescriptionBtn','shareTxtBtn','sharePdfBtn','sharePrintBtn','shareMaterialsBtn','shareReportBtn']:
    check(f'Akcja udostępniania {share_id}', f'id="{share_id}"' in html)

removed_ids = [
    'refreshClientMessageBtn','refreshMaterialsBtn','copyClientSmsPreviewBtn','copyClientSmsBtn',
    'offerPdfPreviewBtn','offerPdfBtn','exportTxtBtn','printBtn','copyClientDescriptionBtn',
    'copyMaterialsBtn','copyReportBtn','saveAiSettingsBtn','saveDropboxSettingsBtn','suggestBtn'
]
for old_id in removed_ids:
    check(f'Usunięto powielony element {old_id}', f'id="{old_id}"' not in html)

check('Jeden przycisk zapisu ustawień', html.count('id="saveSettingsBtn"') == 1)
check('Zapisane wyceny mają Otwórz i Więcej', '>Otwórz</button>' in html and 'class="action-menu saved-more-menu"' in html)
check('Brak podwójnego nagłówka Więcej opcji', html.count('<h2>Więcej opcji</h2>') == 1)
check('Podglądy oznaczone jako automatyczne', html.count('Aktualizacja automatyczna') == 2)

bootstrap = read('js/bootstrap.js')
service_worker = read('service-worker.js')
bundle_tool = read('tools/build-app-bundle.js')
workflow = read('js/workflow.js')
style = read('style.css')
app_bundle = read('app.js')
ui = read('js/ui.js')
parser_ai = read('js/parser-ai.js')
storage = read('js/storage.js')
ps1 = read('upload_to_github.ps1')

check('Bootstrap ładuje workflow.js', "'js/workflow.js'" in bootstrap)
check('Service worker cacheuje workflow.js', "'./js/workflow.js'" in service_worker)
check('Generator pakietu uwzględnia workflow.js', "'workflow.js'" in bundle_tool)
check('Pakiet zgodności ma aktualną wersję', f'Wersja: {version}' in app_bundle)
check('Jeden handler analizuje według ustawień', "addEventListener('click', analyzeVoiceCommandUsingSelectedMode)" in ui)
check('Tryb analizy wybiera lokalny lub AI', 'async function analyzeVoiceCommandUsingSelectedMode' in parser_ai and "normalizeAiParserMode(settings.aiParserMode) === 'ai'" in parser_ai)
check('Notatki mogą być użyte przez wspólną analizę', 'Użyto notatek z wizyty jako tekstu do analizy.' in parser_ai)
check('Wspólny zapis odświeża AI i Dropbox', 'renderDropboxStatus();' in storage and 'renderAiParserStatus();' in storage and 'renderAnalysisModeHint(settings);' in storage)
check('Podglądy są aktualizowane w renderSummary', 'renderClientMessagePreview();' in ui and 'renderMaterialsPreview();' in ui)
check('Menu działa również dla dynamicznych wycen', "document.addEventListener('toggle'" in workflow and "details.action-menu button" in workflow)
check('CSS ma skonsolidowane menu działań', '.action-menu-content' in style and '.settings-navigation-row' in style)
check('Mobilne menu działań jest stałe', re.search(r'@media \(max-width: 850px\)[\s\S]*?\.action-menu-content\s*\{[\s\S]*?position:\s*fixed', style) is not None)
check('Reguła hidden pozostaje ostatnia', style.rstrip().endswith('[hidden] { display: none !important; }'))

check('Repozytorium GitHub w PS1 jest prawidłowe', 'https://github.com/tomalawsb/Asystent-instalatora.git' in ps1)
check('PS1 używa automatycznego opisu commita', '$DefaultCommitMessage' in ps1 and 'Read-Host' not in ps1)
check('PS1 wymaga workflow.js', 'js\\workflow.js' in ps1)

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

obsolete_functions = ['saveAiSettingsFromForm','saveDropboxSettingsFromForm','suggestFromNotes']
for function_name in obsolete_functions:
    check(f'Usunięto nieużywaną funkcję {function_name}', function_name not in ''.join(read(f'js/{p.name}') for p in (ROOT/'js').glob('*.js')))

summary = {
    'version': version,
    'pass': sum(item['status'] == 'PASS' for item in RESULTS),
    'fail': sum(item['status'] == 'FAIL' for item in RESULTS),
    'results': RESULTS
}
(ROOT/'ETAP_5_DOKUMENTACJA/validation-results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
lines = [f"Wersja: {version}", f"PASS: {summary['pass']} | FAIL: {summary['fail']}", '']
for item in RESULTS:
    line = f"{item['status']}: {item['name']}"
    if item['details']:
        line += f" — {item['details']}"
    lines.append(line)
(ROOT/'ETAP_5_DOKUMENTACJA/VALIDATION_RESULTS.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
sys.exit(1 if summary['fail'] else 0)
