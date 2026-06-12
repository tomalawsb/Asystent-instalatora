/*
 * Pomocnik Instalatora PWA — start aplikacji.
 * Jedynymi zrodlami danych sa:
 * - app-version.json,
 * - cennik.json,
 * - material-prices.json.
 */

const APP_SCRIPT_FILES = [
  'js/storage.js',
  'js/catalog.js',
  'js/quote.js',
  'js/parser-local.js',
  'js/parser-ai.js',
  'js/sync.js',
  'js/export.js',
  'js/ui.js',
  'js/state.js',
  'js/patches.js',
  'js/ai-runtime.js',
  'js/workflow.js'
];

const ROOT_URL = new URL('../', import.meta.url);

async function loadJson(relativePath) {
  const url = new URL(relativePath, ROOT_URL);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Nie mozna wczytac ${relativePath}: HTTP ${response.status}`);
  return response.json();
}

function validateAppVersion(config) {
  if (!config || typeof config !== 'object') throw new Error('app-version.json ma niepoprawny format.');
  if (!String(config.version || '').trim()) throw new Error('Brak pola version w app-version.json.');
  if (!String(config.build || '').trim()) throw new Error('Brak pola build w app-version.json.');
  return config;
}

function validateCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    throw new Error('cennik.json ma niepoprawny format.');
  }
  return catalog;
}

function validateMaterialPrices(database) {
  if (!database || typeof database !== 'object' || !Array.isArray(database.items)) {
    throw new Error('material-prices.json ma niepoprawny format.');
  }
  return database;
}

function applyVersionToInterface(config) {
  const version = String(config.version).trim();
  const appName = String(config.name || 'Pomocnik Instalatora PWA').trim();
  document.title = `${appName} ${version}`;

  const badge = document.getElementById('appVersionBadge');
  if (badge) badge.textContent = `Wersja ${version}`;

  const footer = document.getElementById('appVersionFooter');
  if (footer) footer.textContent = `Wersja programu: ${version}`;
}

function loadClassicScript(relativePath) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(relativePath, ROOT_URL).href;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Nie mozna uruchomic modulu ${relativePath}.`));
    document.head.appendChild(script);
  });
}

function showStartupError(error) {
  console.error('Blad uruchamiania aplikacji:', error);
  const message = error instanceof Error ? error.message : String(error);
  const host = document.querySelector('main') || document.body;
  const box = document.createElement('section');
  box.className = 'card';
  box.setAttribute('role', 'alert');
  box.innerHTML = `<h2>Nie udalo sie uruchomic aplikacji</h2><p>${message}</p><p>Sprawdz, czy wszystkie pliki programu zostaly wyslane na serwer.</p>`;
  host.prepend(box);
}

async function bootstrapApplication() {
  try {
    const [configRaw, catalogRaw, materialPricesRaw] = await Promise.all([
      loadJson('app-version.json'),
      loadJson('cennik.json'),
      loadJson('material-prices.json')
    ]);

    const config = validateAppVersion(configRaw);
    const catalog = validateCatalog(catalogRaw);
    const materialPrices = validateMaterialPrices(materialPricesRaw);

    window.APP_CONFIG = Object.freeze({ ...config });
    window.APP_VERSION = String(config.version);
    window.PRICE_CATALOG = catalog;
    window.MATERIAL_PRICE_DB = materialPrices;

    applyVersionToInterface(config);

    for (const scriptPath of APP_SCRIPT_FILES) {
      await loadClassicScript(scriptPath);
    }

    window.APP_BOOTSTRAP_READY = true;
    window.dispatchEvent(new CustomEvent('pomocnik:ready', { detail: { version: window.APP_VERSION } }));
  } catch (error) {
    showStartupError(error);
    throw error;
  }
}

await bootstrapApplication();
