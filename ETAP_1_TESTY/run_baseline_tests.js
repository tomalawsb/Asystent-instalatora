'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const childProcess = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(__dirname, 'results');
const MODULE_FILES = ['storage.js','catalog.js','quote.js','parser-local.js','parser-ai.js','sync.js','export.js','ui.js','state.js','patches.js','ai-runtime.js'];
fs.mkdirSync(RESULTS_DIR, { recursive: true });

const results = [];
function addResult(group, name, status, details = '') {
  results.push({ group, name, status, details });
}
function pass(group, name, details = '') { addResult(group, name, 'PASS', details); }
function fail(group, name, details = '') { addResult(group, name, 'FAIL', details); }
function warn(group, name, details = '') { addResult(group, name, 'WARN', details); }
function assert(group, name, condition, details = '') {
  condition ? pass(group, name, details) : fail(group, name, details);
}
function normalizeDigits(value) { return String(value || '').replace(/\D/g, ''); }
function norm(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function closeEnough(a, b, epsilon = 0.001) { return Math.abs(Number(a) - Number(b)) <= epsilon; }

function makeElement() {
  const noop = () => {};
  return {
    addEventListener: noop,
    removeEventListener: noop,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    appendChild: noop,
    remove: noop,
    click: noop,
    focus: noop,
    setSelectionRange: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    style: {}, dataset: {}, hidden: false, value: '', checked: false,
    textContent: '', innerHTML: '', files: [], selectionStart: 0, selectionEnd: 0
  };
}

function createAppContext() {
  const storageMap = new Map();
  const noop = () => {};
  const localStorage = {
    getItem: key => storageMap.has(key) ? storageMap.get(key) : null,
    setItem: (key, value) => storageMap.set(key, String(value)),
    removeItem: key => storageMap.delete(key),
    clear: () => storageMap.clear()
  };
  const document = {
    addEventListener: noop,
    removeEventListener: noop,
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => makeElement(),
    createElement: () => makeElement(),
    body: makeElement(),
    documentElement: makeElement()
  };
  const context = {
    console,
    localStorage,
    document,
    window: {
      addEventListener: noop,
      removeEventListener: noop,
      matchMedia: () => ({ matches: false, addEventListener: noop }),
      print: noop,
      open: () => null,
      setTimeout,
      clearTimeout
    },
    navigator: {},
    location: { protocol: 'file:', reload: noop },
    crypto: crypto.webcrypto,
    structuredClone: global.structuredClone,
    Blob: global.Blob,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: noop },
    fetch: async () => { throw new Error('Sieć jest wyłączona w testach bazowych.'); },
    confirm: () => true,
    alert: noop,
    setTimeout,
    clearTimeout,
    TextEncoder,
    TextDecoder
  };
  const versionConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-version.json'), 'utf8'));
  context.window.APP_CONFIG = versionConfig;
  context.window.APP_VERSION = versionConfig.version;
  context.window.PRICE_CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'cennik.json'), 'utf8'));
  context.window.MATERIAL_PRICE_DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'material-prices.json'), 'utf8'));
  context.globalThis = context;
  vm.createContext(context);
  for (const name of MODULE_FILES) {
    const script = `js/${name}`;
    const code = fs.readFileSync(path.join(ROOT, script), 'utf8');
    vm.runInContext(code, context, { filename: script });
  }
  return { context, storageMap };
}

function evalIn(context, expression) {
  return vm.runInContext(expression, context);
}
function evalJson(context, expression) {
  return JSON.parse(evalIn(context, `JSON.stringify(${expression})`));
}

function runStaticTests() {
  const group = 'Pliki i spójność';
  const required = ['index.html', 'style.css', 'app.js', 'manifest.json', 'service-worker.js', 'app-version.json', 'cennik.json', 'material-prices.json', 'js/bootstrap.js', 'upload_to_github.ps1'];
  for (const name of required) assert(group, `Istnieje ${name}`, fs.existsSync(path.join(ROOT, name)));

  for (const name of ['manifest.json', 'app-version.json', 'cennik.json', 'material-prices.json', 'dane_uczace_transkrypcji.json']) {
    try {
      JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
      pass(group, `Poprawny JSON: ${name}`);
    } catch (error) {
      fail(group, `Poprawny JSON: ${name}`, error.message);
    }
  }

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  try {
    for (const name of MODULE_FILES) {
      new vm.Script(fs.readFileSync(path.join(ROOT, 'js', name), 'utf8'));
    }
    new vm.Script(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'));
    const bootstrapCheck = childProcess.spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: fs.readFileSync(path.join(ROOT, 'js/bootstrap.js'), 'utf8'),
      encoding: 'utf8'
    });
    if (bootstrapCheck.status !== 0) throw new Error(bootstrapCheck.stderr || 'Niepoprawna skladnia bootstrap.js');
    pass(group, 'Składnia modułów JavaScript, bootstrap.js i pakietu app.js');
  } catch (error) {
    fail(group, 'Składnia modułów JavaScript, bootstrap.js i pakietu app.js', error.message);
  }

  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const versionConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-version.json'), 'utf8'));
  const version = versionConfig.version;
  const stateCode = fs.readFileSync(path.join(ROOT, 'js/state.js'), 'utf8');
  const swCode = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  const bootstrapCode = fs.readFileSync(path.join(ROOT, 'js/bootstrap.js'), 'utf8');
  assert(group, 'Wersja ma jedno zrodlo w app-version.json',
    !html.includes(version) && !stateCode.includes(version) && !swCode.includes(version) && app.includes(`Wersja: ${version}`),
    version);
  assert(group, 'Bootstrap laduje trzy kanoniczne pliki JSON',
    ['app-version.json','cennik.json','material-prices.json'].every(name => bootstrapCode.includes(name)));

  const fnNames = [...app.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(x => x[1]);
  const counts = new Map();
  for (const fn of fnNames) counts.set(fn, (counts.get(fn) || 0) + 1);
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
  if (duplicates.length) warn(group, 'Brak ponownych deklaracji funkcji', duplicates.map(([n, c]) => `${n} ×${c}`).join(', '));
  else pass(group, 'Brak ponownych deklaracji funkcji');

  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)/g)].map(x => x[1]));
  const idCounts = [...html.matchAll(/\bid=["']([^"']+)/g)].map(x => x[1]).reduce((m, id) => m.set(id, (m.get(id) || 0) + 1), new Map());
  const duplicateIds = [...idCounts.entries()].filter(([, count]) => count > 1);
  assert(group, 'Unikalne identyfikatory HTML', duplicateIds.length === 0, duplicateIds.map(([id, c]) => `${id} ×${c}`).join(', '));

  const staticRefs = new Set([...app.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(x => x[1]));
  const missingRefs = [...staticRefs].filter(id => !ids.has(id) && id !== 'addPreviewItemBtn');
  assert(group, 'Statyczne odwołania JS mają elementy HTML', missingRefs.length === 0, missingRefs.join(', '));

  const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  const assets = [...sw.matchAll(/['"]\.\/([^'"]+)['"]/g)].map(x => x[1]);
  const missingAssets = assets.filter(name => !fs.existsSync(path.join(ROOT, name)));
  assert(group, 'Pliki cache service workera istnieją', missingAssets.length === 0, missingAssets.join(', '));

  assert(group, 'Brak powielonego pliku pricing-data.js', !fs.existsSync(path.join(ROOT, 'pricing-data.js')));
  assert(group, 'Brak powielonego pliku material-prices.js', !fs.existsSync(path.join(ROOT, 'material-prices.js')));
  const catalogJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'cennik.json'), 'utf8'));
  const materialsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'material-prices.json'), 'utf8'));
  assert(group, 'Kanoniczny cennik zawiera kategorie i pozycje', Object.keys(catalogJson).length > 0 && Object.values(catalogJson).some(items => Array.isArray(items) && items.length > 0));
  assert(group, 'Kanoniczna baza materialow zawiera pozycje', Array.isArray(materialsJson.items) && materialsJson.items.length > 0);
}

function runCalculationTests(context) {
  const group = 'Obliczenia wyceny';
  let totals = evalJson(context, `calculateTotals({services:[{quantity:2,priceNet:100}],distanceKm:50,freeKm:20,distanceRate:2})`);
  assert(group, 'Dwie usługi po 100 zł netto', closeEnough(totals.servicesNet, 200), JSON.stringify(totals));
  assert(group, 'Dojazd: 50 km - 20 km bezpłatne', closeEnough(totals.distanceNet, 60), JSON.stringify(totals));
  assert(group, 'VAT 23%', closeEnough(totals.vat, 59.8), JSON.stringify(totals));
  assert(group, 'Kwota brutto', closeEnough(totals.gross, 319.8), JSON.stringify(totals));

  totals = evalJson(context, `calculateTotals({services:[],distanceKm:10,freeKm:20,distanceRate:2})`);
  assert(group, 'Brak ujemnej opłaty za dojazd', totals.billedKm === 0 && totals.distanceNet === 0, JSON.stringify(totals));

  evalIn(context, `saveSettings({...defaultSettings(), vatRate: 8})`);
  totals = evalJson(context, `calculateTotals({services:[{quantity:1,priceNet:100}],distanceKm:0,freeKm:20,distanceRate:2})`);
  assert(group, 'Zmiana VAT na 8%', closeEnough(totals.vat, 8) && closeEnough(totals.gross, 108), JSON.stringify(totals));
  evalIn(context, `saveSettings(defaultSettings())`);
}

function runStorageTests(context) {
  const group = 'Zapis i synchronizacja danych';
  evalIn(context, `localStorage.clear()`);
  const merged = evalJson(context, `mergeQuoteRecords(
    [{id:'q1',clientName:'Stara',updatedAt:'2026-01-01T10:00:00Z',createdAt:'2026-01-01T10:00:00Z',version:1,services:[]}],
    [{id:'q1',clientName:'Nowa',updatedAt:'2026-01-02T10:00:00Z',createdAt:'2026-01-01T10:00:00Z',version:2,services:[]}]
  )`);
  assert(group, 'Scalanie wybiera nowszą wycenę', merged.length === 1 && merged[0].clientName === 'Nowa', JSON.stringify(merged));

  evalIn(context, `saveQuoteRecords([{id:'q2',clientName:'Test',updatedAt:'2026-01-01T10:00:00Z',createdAt:'2026-01-01T10:00:00Z',version:1,services:[]}])`);
  let quotes = evalJson(context, `loadQuotes()`);
  assert(group, 'Zapis i odczyt aktywnej wyceny', quotes.length === 1 && quotes[0].clientName === 'Test', JSON.stringify(quotes));
  evalIn(context, `markQuoteDeleted('q2')`);
  quotes = evalJson(context, `loadQuotes()`);
  const records = evalJson(context, `loadQuoteRecords()`);
  assert(group, 'Usunięta wycena znika z aktywnych', quotes.length === 0, JSON.stringify(quotes));
  assert(group, 'Znacznik usunięcia pozostaje do synchronizacji', records.length === 1 && !!records[0].deletedAt, JSON.stringify(records));

  const pathNormalized = evalIn(context, `normalizeDropboxPath('folder/dane.json')`);
  assert(group, 'Normalizacja ścieżki Dropbox', pathNormalized === '/folder/dane.json', pathNormalized);

  const payload = evalJson(context, `buildSyncPayload([{id:'q3',createdAt:'2026-01-01T10:00:00Z',updatedAt:'2026-01-01T10:00:00Z',version:1,services:[]}])`);
  assert(group, 'Ładunek synchronizacji ma schemat i rekordy', payload.schema === 2 && payload.records.length === 1 && !!payload.deviceId, JSON.stringify({schema:payload.schema,records:payload.records.length,deviceId:payload.deviceId}));

  const backupRecords = evalJson(context, `extractBackupRecords({quotes:[{id:'backup1',clientName:'Z kopii',createdAt:'2026-01-01T10:00:00Z',updatedAt:'2026-01-01T10:00:00Z',services:[]}]})`);
  assert(group, 'Odczyt rekordów ze starszego formatu kopii', backupRecords.length === 1 && backupRecords[0].clientName === 'Z kopii', JSON.stringify(backupRecords));

  const catalogMerge = evalJson(context, `mergeCatalogs({'Testowa':[{'name':'Pozycja','unit':'szt','price_net':10}]},{'Testowa':[{'name':'Pozycja','unit':'szt','price_net':20},{'name':'Nowa','unit':'szt','price_net':5}]})`);
  const testCategory = catalogMerge.Testowa || [];
  assert(group, 'Scalanie cennika zachowuje lokalną cenę i dopisuje pozycję', testCategory.some(x => x.name === 'Pozycja' && Number(x.price_net) === 20) && testCategory.some(x => x.name === 'Nowa'), JSON.stringify(testCategory));

  warn(group, 'Połączenie z prawdziwym Dropbox', 'Nie wykonano bez tokenu użytkownika. Procedura ręczna jest w MANUAL_TEST_CHECKLIST.md.');
}

function runExportTests(context) {
  const group = 'Eksport i komunikacja';
  evalIn(context, `saveSettings({...defaultSettings(), companyName:'Firma Testowa', vatRate:23})`);
  const quoteExpr = `({clientName:'Jan Kowalski',clientPhone:'501222333',clientAddress:'Mielec',visitDate:'2026-06-15',jobType:'Kamery CCTV',notes:'Test',distanceKm:40,distanceRate:2,freeKm:20,services:[{name:'Montaż kamery',unit:'szt',quantity:2,priceNet:100}]})`;
  const sms = evalIn(context, `buildClientSms(${quoteExpr})`);
  assert(group, 'SMS zawiera zakres i kwotę brutto', /2\s*(?:×|kamery)/i.test(sms) && /295,20/.test(sms), sms);
  const report = evalIn(context, `buildReport(${quoteExpr})`);
  assert(group, 'Raport TXT zawiera dane klienta, VAT i dojazd', report.includes('Jan Kowalski') && report.includes('VAT:') && report.includes('Dojazd:'), report.slice(0, 250));
  const html = evalIn(context, `buildOfferHtml(${quoteExpr})`);
  assert(group, 'Oferta HTML zawiera dane i polecenie drukowania', html.includes('Jan Kowalski') && html.includes('window.print()') && html.includes('Montaż kamery'), html.slice(0, 180));
}

function runParserTests(context) {
  const group = 'Parser lokalny';
  const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'parser_cases.json'), 'utf8'));
  for (const test of fixtures) {
    const result = evalJson(context, `parseSmartCommand(${JSON.stringify(test.text)})`);
    const problems = [];
    const ex = test.expect;
    if (ex.clientName && result.client.name !== ex.clientName) problems.push(`klient: oczekiwano „${ex.clientName}”, jest „${result.client.name || '-'}”`);
    if (ex.phoneDigits && normalizeDigits(result.client.phone) !== ex.phoneDigits) problems.push(`telefon: ${result.client.phone || '-'}`);
    for (const part of ex.addressIncludes || []) if (!norm(result.client.address).includes(norm(part))) problems.push(`adres nie zawiera „${part}”: ${result.client.address || '-'}`);
    if (ex.distanceKm !== undefined && Number(result.distanceKm) !== Number(ex.distanceKm)) problems.push(`dojazd km: ${result.distanceKm}`);
    if (ex.distanceRate !== undefined && Number(result.distanceRate) !== Number(ex.distanceRate)) problems.push(`stawka/km: ${result.distanceRate}`);
    if (ex.freeKm !== undefined && Number(result.freeKm) !== Number(ex.freeKm)) problems.push(`bezpłatne km: ${result.freeKm}`);
    for (const expectedItem of ex.items || []) {
      const matching = result.items.find(item => norm(item.name).includes(norm(expectedItem.nameIncludes)) && Number(item.quantity) === Number(expectedItem.quantity));
      if (!matching) problems.push(`brak pozycji „${expectedItem.nameIncludes}” × ${expectedItem.quantity}`);
    }
    for (const forbidden of ex.forbiddenItems || []) {
      if (result.items.some(item => norm(item.name).includes(norm(forbidden)))) problems.push(`błędnie dodano „${forbidden}”`);
    }
    const detail = problems.length ? problems.join('; ') : `${result.items.length} pozycji`;
    assert(group, `${test.id}: ${test.description}`, problems.length === 0, detail);
  }
}

function runAiStructuralTests(context) {
  const group = 'Parser AI';
  const converted = evalJson(context, `convertAiParseToAppResult('Montaż dwóch kamer', {
    client:{name:'Jan Kowalski',phone:'501222333',address:'Mielec'},
    detectedType:'Kamery CCTV',
    distanceKm:30,distanceRate:2,freeKm:20,
    items:[{type:'camera_mount',quantity:2,includeInQuote:true}],
    warnings:[],excluded:[],uncertain:[]
  }, {model:'test-model'})`);
  assert(group, 'Konwersja odpowiedzi AI do formatu aplikacji', converted.client.name === 'Jan Kowalski' && converted.items.some(x => x.quantity === 2 && /kamer/i.test(x.name)), JSON.stringify(converted.items));
  warn(group, 'Rzeczywiste zapytanie do OpenAI', 'Nie wykonano bez klucza API i świadomego użycia płatnego zapytania. Procedura ręczna jest w MANUAL_TEST_CHECKLIST.md.');
}

function writeReports() {
  const counts = results.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const generatedAt = new Date().toISOString();
  const json = { generatedAt, summary: { pass: counts.PASS || 0, fail: counts.FAIL || 0, warn: counts.WARN || 0 }, results };
  fs.writeFileSync(path.join(RESULTS_DIR, 'baseline-results.json'), JSON.stringify(json, null, 2), 'utf8');

  const lines = [
    '# Wyniki automatycznych testów bazowych', '',
    `Data UTC: ${generatedAt}`, '',
    `- PASS: ${json.summary.pass}`,
    `- FAIL: ${json.summary.fail}`,
    `- WARN: ${json.summary.warn}`, ''
  ];
  let current = '';
  for (const r of results) {
    if (r.group !== current) { current = r.group; lines.push(`## ${current}`, ''); }
    lines.push(`- **${r.status}** — ${r.name}${r.details ? ` — ${String(r.details).replace(/\s+/g, ' ').slice(0, 700)}` : ''}`);
  }
  lines.push('');
  fs.writeFileSync(path.join(RESULTS_DIR, 'baseline-results.md'), lines.join('\n'), 'utf8');

  console.log(`PASS: ${json.summary.pass} | FAIL: ${json.summary.fail} | WARN: ${json.summary.warn}`);
  for (const r of results.filter(x => x.status !== 'PASS')) console.log(`${r.status}: [${r.group}] ${r.name} — ${r.details}`);
  process.exitCode = json.summary.fail > 0 ? 1 : 0;
}

try {
  runStaticTests();
  const { context } = createAppContext();
  runCalculationTests(context);
  runStorageTests(context);
  runExportTests(context);
  runParserTests(context);
  runAiStructuralTests(context);
} catch (error) {
  fail('Uruchomienie zestawu', 'Nieoczekiwany błąd testów', error.stack || error.message);
}
writeReports();
