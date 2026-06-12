'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const childProcess = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STAGE2_ROOT = path.resolve(ROOT, '..', 'stage2_work');
const MODULE_FILES = [
  'storage.js','catalog.js','quote.js','parser-local.js','parser-ai.js',
  'sync.js','export.js','ui.js','state.js','patches.js','ai-runtime.js'
];
const results = [];

function add(name, ok, details = '') {
  results.push({ name, status: ok ? 'PASS' : 'FAIL', details });
}
function info(name, details = '') {
  results.push({ name, status: 'INFO', details });
}
function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function makeElement() {
  const noop = () => {};
  return {
    addEventListener: noop, removeEventListener: noop,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    appendChild: noop, prepend: noop, remove: noop, click: noop, focus: noop,
    setSelectionRange: noop, setAttribute: noop,
    querySelector: () => null, querySelectorAll: () => [],
    style: {}, dataset: {}, hidden: false, value: '', checked: false,
    textContent: '', innerHTML: '', files: [], selectionStart: 0, selectionEnd: 0
  };
}

function createContext(code, filename, config, catalog, materials) {
  const storage = new Map();
  const noop = () => {};
  const document = {
    addEventListener: noop, removeEventListener: noop,
    querySelectorAll: () => [], querySelector: () => null,
    getElementById: () => makeElement(), createElement: () => makeElement(),
    body: makeElement(), documentElement: makeElement(), head: makeElement()
  };
  const context = {
    console,
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key), clear: () => storage.clear()
    },
    document,
    window: {
      APP_CONFIG: config,
      APP_VERSION: config.version,
      PRICE_CATALOG: catalog,
      MATERIAL_PRICE_DB: materials,
      addEventListener: noop, removeEventListener: noop,
      dispatchEvent: noop,
      matchMedia: () => ({ matches: false, addEventListener: noop }),
      print: noop, open: () => null, setTimeout, clearTimeout
    },
    navigator: {}, location: { protocol: 'file:', reload: noop },
    crypto: crypto.webcrypto, structuredClone: global.structuredClone,
    Blob: global.Blob,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: noop },
    fetch: async () => { throw new Error('network disabled'); },
    confirm: () => true, alert: noop, setTimeout, clearTimeout,
    TextEncoder, TextDecoder,
    CustomEvent: class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(code, context, { filename });
  return context;
}
function callJson(context, expression) {
  return JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context));
}
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (['id','deviceId','updatedAt','deletedAt'].includes(key)) continue;
      out[key] = normalize(item);
    }
    return out;
  }
  return value;
}

function runStaticChecks() {
  const config = readJson(path.join(ROOT, 'app-version.json'));
  const version = String(config.version || '');
  add('Format wersji numer + DDMMRRHHMM', /^\d+\.\d+ - \d{10}$/.test(version), version);
  add('Etap zapisany jako 3', Number(config.stage) === 3, String(config.stage));
  add('Build zawiera znacznik etapu 3', /etap-3/i.test(String(config.build || '')), String(config.build || ''));

  const required = [
    'index.html','style.css','manifest.json','service-worker.js','app-version.json',
    'cennik.json','material-prices.json','app.js','js/bootstrap.js','upload_to_github.ps1'
  ];
  add('Wszystkie wymagane pliki istnieja', required.every(exists), required.filter(x => !exists(x)).join(', '));
  add('Usunieto pricing-data.js', !exists('pricing-data.js'));
  add('Usunieto material-prices.js', !exists('material-prices.js'));

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const state = fs.readFileSync(path.join(ROOT, 'js/state.js'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  const readme = fs.readFileSync(path.join(ROOT, 'README.txt'), 'utf8');
  const bootstrap = fs.readFileSync(path.join(ROOT, 'js/bootstrap.js'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  const htmlScripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/g)].map(x => x[1]);
  add('index.html uruchamia tylko bootstrap', htmlScripts.length === 1 && htmlScripts[0] === 'js/bootstrap.js', htmlScripts.join(', '));
  add('Numer wersji nie jest wpisany recznie w HTML/state/SW/README',
    !html.includes(version) && !state.includes(version) && !sw.includes(version) && !readme.includes(version));
  add('app.js ma wersje wygenerowana z app-version.json', app.includes(`Wersja: ${version}`));
  add('state.js pobiera wersje z APP_CONFIG', state.includes('window.APP_CONFIG?.version'));
  add('service worker pobiera app-version.json', sw.includes("fetch('./app-version.json'"));
  add('service worker nie ma stalego CACHE_NAME', !/const\s+CACHE_NAME\s*=/.test(sw));
  add('bootstrap laduje trzy zrodla JSON', ['app-version.json','cennik.json','material-prices.json'].every(x => bootstrap.includes(x)));
  add('bootstrap laduje wszystkie moduly etapu 2', MODULE_FILES.every(x => bootstrap.includes(`js/${x}`)));

  const cacheAssets = [...sw.matchAll(/['"]\.\/([^'"]+)['"]/g)].map(x => x[1]);
  const missingAssets = [...new Set(cacheAssets)].filter(rel => !exists(rel));
  add('Wszystkie pliki cache service workera istnieja', missingAssets.length === 0, missingAssets.join(', '));

  const catalog = readJson(path.join(ROOT, 'cennik.json'));
  const materials = readJson(path.join(ROOT, 'material-prices.json'));
  add('Cennik JSON zawiera dane', Object.keys(catalog).length > 0 && Object.values(catalog).some(v => Array.isArray(v) && v.length));
  add('Baza materialow JSON zawiera dane', Array.isArray(materials.items) && materials.items.length > 0, `${materials.items?.length || 0} pozycji`);

  try {
    for (const name of MODULE_FILES) new vm.Script(fs.readFileSync(path.join(ROOT, 'js', name), 'utf8'));
    new vm.Script(app);
    const moduleCheck = childProcess.spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: bootstrap, encoding: 'utf8'
    });
    add('Skladnia wszystkich plikow JavaScript', moduleCheck.status === 0, moduleCheck.stderr || '');
  } catch (error) {
    add('Skladnia wszystkich plikow JavaScript', false, error.message);
  }

  const ps1 = fs.readFileSync(path.join(ROOT, 'upload_to_github.ps1'), 'utf8');
  add('PS1 wskazuje poprawne repozytorium', ps1.includes('https://github.com/tomalawsb/Asystent-instalatora.git'));
  add('PS1 pobiera wersje z app-version.json', /Get-Content.+app-version\.json/s.test(ps1) && /\$AppVersion/.test(ps1));
  add('PS1 nie pyta o opis commita', !/Read-Host/.test(ps1));
  add('PS1 wykonuje push do main', /git push origin main/.test(ps1));
  add('PS1 usuwa stare kopie danych', ps1.includes('pricing-data.js') && ps1.includes('material-prices.js'));
}

function runBootstrapCheck() {
  const run = childProcess.spawnSync(process.execPath, [path.join(__dirname, 'test_bootstrap.mjs')], { encoding: 'utf8' });
  let parsed = null;
  try { parsed = JSON.parse(run.stdout); } catch {}
  add('Bootstrap uruchamia aplikacje i laduje dane', run.status === 0 && parsed?.ready === true, run.stderr || run.stdout);
  if (parsed) {
    add('Bootstrap pokazuje wersje z app-version.json', parsed.version === readJson(path.join(ROOT, 'app-version.json')).version, parsed.version);
    add('Bootstrap laduje 11 modulow w poprawnej kolejnosci', parsed.scriptsMatch === true, `${parsed.loadedScripts?.length || 0} modulow`);
    add('Bootstrap udostepnia cennik i materialy', parsed.catalogCategories > 0 && parsed.materialItems > 0, `${parsed.catalogCategories} kategorii, ${parsed.materialItems} materialow`);
  }
}

function runBundleReproducibilityCheck() {
  const appPath = path.join(ROOT, 'app.js');
  const before = sha256(appPath);
  const run = childProcess.spawnSync(process.execPath, [path.join(ROOT, 'tools/build-app-bundle.js')], { encoding: 'utf8' });
  const after = sha256(appPath);
  add('Generator app.js jest powtarzalny', run.status === 0 && before === after, run.stderr || run.stdout.trim());
}

function runDifferentialChecks() {
  if (!fs.existsSync(path.join(STAGE2_ROOT, 'app.js'))) {
    add('Test roznicowy wzgledem etapu 2', false, 'Brak /mnt/data/stage2_work/app.js');
    return;
  }
  const config = readJson(path.join(ROOT, 'app-version.json'));
  const catalog = readJson(path.join(ROOT, 'cennik.json'));
  const materials = readJson(path.join(ROOT, 'material-prices.json'));
  const oldCode = fs.readFileSync(path.join(STAGE2_ROOT, 'app.js'), 'utf8');
  const newCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const oldCtx = createContext(oldCode, 'stage2-app.js', config, catalog, materials);
  const newCtx = createContext(newCode, 'stage3-app.js', config, catalog, materials);
  const fixtures = readJson(path.join(ROOT, 'ETAP_1_TESTY/fixtures/parser_cases.json'));
  const cases = fixtures.map(x => ({ name: `parser:${x.id}`, expr: `parseSmartCommand(${JSON.stringify(x.text)})` }));
  cases.push(
    { name:'calculateTotals', expr:`calculateTotals({services:[{quantity:2,priceNet:100}],distanceKm:50,freeKm:20,distanceRate:2})` },
    { name:'mergeCatalogs', expr:`mergeCatalogs({'A':[{'name':'X','unit':'szt','price_net':10}]},{'A':[{'name':'X','unit':'szt','price_net':20},{'name':'Y','unit':'szt','price_net':5}]})` },
    { name:'buildClientSms', expr:`buildClientSms({clientName:'Jan',clientPhone:'',clientAddress:'Mielec',visitDate:'2026-06-15',jobType:'Kamery CCTV',notes:'',distanceKm:40,distanceRate:2,freeKm:20,services:[{name:'Montaz kamery',unit:'szt',quantity:2,priceNet:100}]})` },
    { name:'buildReport', expr:`buildReport({clientName:'Jan',clientPhone:'',clientAddress:'Mielec',visitDate:'2026-06-15',jobType:'Kamery CCTV',notes:'',distanceKm:40,distanceRate:2,freeKm:20,services:[{name:'Montaz kamery',unit:'szt',quantity:2,priceNet:100}]})` }
  );
  const differences = [];
  for (const test of cases) {
    try {
      const before = normalize(callJson(oldCtx, test.expr));
      const after = normalize(callJson(newCtx, test.expr));
      if (JSON.stringify(before) !== JSON.stringify(after)) differences.push(test.name);
    } catch (error) {
      differences.push(`${test.name}: ${error.message}`);
    }
  }
  add('Test roznicowy wzgledem etapu 2', differences.length === 0, differences.join('; ') || `${cases.length}/${cases.length} zgodnych`);
}

function runBaselineChecks() {
  childProcess.spawnSync(process.execPath, [path.join(ROOT, 'ETAP_1_TESTY/run_baseline_tests.js')], { encoding: 'utf8' });
  const report = readJson(path.join(ROOT, 'ETAP_1_TESTY/results/baseline-results.json'));
  const unexpected = report.results.filter(item => item.status === 'FAIL' && item.group !== 'Parser lokalny');
  add('Brak nowych bledow poza znanymi bledami parsera', unexpected.length === 0, unexpected.map(x => `${x.group}: ${x.name}`).join('; '));
  info('Wynik testow bazowych', `PASS ${report.summary.pass}, znane FAIL parsera ${report.summary.fail}, WARN ${report.summary.warn}`);
}

function writeReport() {
  const pass = results.filter(x => x.status === 'PASS').length;
  const fail = results.filter(x => x.status === 'FAIL').length;
  const infoCount = results.filter(x => x.status === 'INFO').length;
  const payload = { generatedAt: new Date().toISOString(), summary: { pass, fail, info: infoCount }, results };
  fs.writeFileSync(path.join(__dirname, 'validation-results.json'), JSON.stringify(payload, null, 2), 'utf8');
  const lines = [
    'ETAP 3 - WYNIKI WALIDACJI',
    `Data UTC: ${payload.generatedAt}`,
    `PASS: ${pass}`,
    `FAIL: ${fail}`,
    `INFO: ${infoCount}`,
    ''
  ];
  for (const result of results) lines.push(`${result.status}: ${result.name}${result.details ? ` - ${String(result.details).replace(/\s+/g, ' ').slice(0, 1000)}` : ''}`);
  fs.writeFileSync(path.join(__dirname, 'VALIDATION_RESULTS.txt'), lines.join('\n') + '\n', 'utf8');
  console.log(`PASS: ${pass} | FAIL: ${fail} | INFO: ${infoCount}`);
  for (const result of results.filter(x => x.status !== 'PASS')) console.log(`${result.status}: ${result.name} - ${result.details}`);
  process.exitCode = fail ? 1 : 0;
}

try {
  runStaticChecks();
  runBootstrapCheck();
  runBundleReproducibilityCheck();
  runDifferentialChecks();
  runBaselineChecks();
} catch (error) {
  add('Nieoczekiwany blad walidacji', false, error.stack || error.message);
}
writeReport();
