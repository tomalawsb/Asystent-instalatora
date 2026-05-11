const APP_VERSION = '1.8.0';
const STORAGE_KEY = 'pomocnik-instalatora-pwa-v1-quotes';
const SETTINGS_KEY = 'pomocnik-instalatora-pwa-v1-settings';
const PHRASE_DICTIONARY_KEY = 'pomocnik-instalatora-pwa-v1-phrase-dictionary';
const LEARNED_RULES_KEY = 'pomocnik-instalatora-pwa-v1-learned-parser-rules';
const CATALOG_KEY = 'pomocnik-instalatora-pwa-v1-custom-catalog';
const DEVICE_ID_KEY = 'pomocnik-instalatora-pwa-v1-device-id';
let CATALOG = loadCatalog();
let CATEGORIES = Object.keys(CATALOG);

const TYPE_HINTS = {
  'Kamery CCTV': ['Montaż kamery IP zewnętrznej', 'Konfiguracja rejestratora NVR', 'Uruchomienie podglądu zdalnego', 'Okablowanie pod kamerę'],
  'Anteny / Sygnał': ['Montaż anteny DVB-T', 'Ustawienie anteny DVB-T', 'Pomiary sygnału', 'Prowadzenie kabla antenowego'],
  'Sieć / Wi‑Fi': ['Konfiguracja routera', 'Test i optymalizacja Wi‑Fi', 'Prowadzenie skrętki LAN', 'Zarabianie końcówki RJ45'],
  'Domofon': ['Montaż wideodomofonu 1-rodzinnego', 'Montaż panelu bramowego', 'Montaż elektrozaczepu'],
  'Alarm': ['Montaż centrali alarmowej', 'Montaż czujki PIR', 'Montaż sygnalizatora zewnętrznego'],
  'Automatyka bram': ['Montaż napędu bramy przesuwnej', 'Montaż fotokomórek', 'Programowanie pilotów'],
  'Serwis': ['Diagnostyka / serwis', 'Aktualizacja oprogramowania', 'Dojazd']
};

const KEYWORDS_TO_TYPES = {
  'kamera': 'Kamery CCTV', 'kamery': 'Kamery CCTV', 'monitoring': 'Kamery CCTV', 'rejestrator': 'Kamery CCTV', 'nvr': 'Kamery CCTV', 'poe': 'Kamery CCTV', 'ptz': 'Kamery CCTV',
  'anten': 'Anteny / Sygnał', 'dvb': 'Anteny / Sygnał', 'satel': 'Anteny / Sygnał', 'konwerter': 'Anteny / Sygnał', 'sygnał': 'Anteny / Sygnał', 'sygnal': 'Anteny / Sygnał',
  'wifi': 'Sieć / Wi‑Fi', 'wi-fi': 'Sieć / Wi‑Fi', 'router': 'Sieć / Wi‑Fi', 'internet': 'Sieć / Wi‑Fi', 'lan': 'Sieć / Wi‑Fi', 'rj45': 'Sieć / Wi‑Fi', 'mesh': 'Sieć / Wi‑Fi',
  'domofon': 'Domofon', 'wideodomofon': 'Domofon', 'furtk': 'Domofon', 'elektrozaczep': 'Domofon',
  'alarm': 'Alarm', 'central': 'Alarm', 'czujk': 'Alarm', 'sygnalizator': 'Alarm', 'pir': 'Alarm',
  'bram': 'Automatyka bram', 'pilot': 'Automatyka bram', 'fotokomór': 'Automatyka bram', 'napęd': 'Automatyka bram',
  'serwis': 'Serwis', 'napraw': 'Serwis', 'diagnoz': 'Serwis', 'konfigurac': 'Serwis', 'aktualizac': 'Serwis'
};

const CHECKLISTS = {
  'Kamery CCTV': ['Ustalić miejsca montażu kamer', 'Sprawdzić zasilanie / PoE', 'Sprawdzić sposób prowadzenia przewodów', 'Sprawdzić zasięg sieci lub dostęp do internetu', 'Ustalić miejsce rejestratora i dysku'],
  'Anteny / Sygnał': ['Sprawdzić poziom sygnału', 'Ustalić miejsce montażu anteny lub masztu', 'Sprawdzić stan kabla i złączy', 'Sprawdzić wzmacniacz / zasilacz antenowy', 'Policzyć liczbę gniazd TV / dekoderów'],
  'Sieć / Wi‑Fi': ['Sprawdzić zasięg Wi‑Fi', 'Sprawdzić obecne okablowanie LAN', 'Ustalić miejsce routera / access pointa', 'Zweryfikować adresację i DHCP', 'Wykonać test prędkości i stabilności'],
  'Domofon': ['Sprawdzić okablowanie do furtki', 'Ustalić miejsce monitora / unifonu', 'Sprawdzić elektrozaczep lub zworę', 'Zweryfikować zasilanie urządzeń'],
  'Alarm': ['Ustalić strefy i wejścia', 'Ustalić miejsca czujek', 'Sprawdzić zasilanie i akumulator', 'Sprawdzić komunikację GSM / aplikację'],
  'Automatyka bram': ['Sprawdzić stan mechaniczny bramy', 'Zweryfikować zasilanie napędu', 'Ustalić miejsca fotokomórek i lampy', 'Sprawdzić możliwość sterowania z telefonu'],
  'Serwis': ['Opisać objawy usterki', 'Sprawdzić istniejący sprzęt', 'Zanotować wynik diagnozy', 'Ustalić zakres naprawy lub konfiguracji']
};


const VOICE_ITEM_RULES = [
  { key: 'camera', category: 'Kamery CCTV', name: 'Montaż kamery IP zewnętrznej', unit: 'szt', keywords: ['kamera', 'kamery', 'kamer', 'cctv'] },
  { key: 'ptz', category: 'Kamery CCTV', name: 'Montaż kamery obrotowej PTZ', unit: 'szt', keywords: ['ptz', 'obrotowa', 'obrotowe'] },
  { key: 'nvr', category: 'Kamery CCTV', name: 'Konfiguracja rejestratora NVR', unit: 'szt', keywords: ['rejestrator', 'nvr', 'dvr'] },
  { key: 'remote_preview', category: 'Kamery CCTV', name: 'Uruchomienie podglądu zdalnego', unit: 'usł', keywords: ['podgląd zdalny', 'podglad zdalny', 'podgląd w telefonie', 'podglad w telefonie', 'podgląd na telefonie', 'podglad na telefonie'] },
  { key: 'cable_lan', category: 'Kamery CCTV', name: 'Prowadzenie skrętki zewnętrznej', unit: 'mb', keywords: ['kabel', 'kabla', 'przewód', 'przewodu', 'skrętka', 'skretka', 'lan', 'utp'] },
  { key: 'rj45', category: 'Sieć / Wi‑Fi', name: 'Zarabianie końcówki RJ45', unit: 'szt', keywords: ['rj45', 'wtyk', 'wtyki', 'końcówka', 'koncowka', 'końcówki', 'koncowki'] },
  { key: 'fplug', category: 'Anteny / Sygnał', name: 'Zarabianie złącza F', unit: 'szt', keywords: ['złącze f', 'zlacze f', 'końcówka f', 'koncowka f', 'fka', 'f-ki'] },
  { key: 'antenna', category: 'Anteny / Sygnał', name: 'Montaż anteny DVB-T', unit: 'szt', keywords: ['antena', 'anteny', 'dvb', 'satelitarna'] },
  { key: 'router', category: 'Sieć / Wi‑Fi', name: 'Konfiguracja routera', unit: 'szt', keywords: ['router', 'routera'] },
  { key: 'wifi', category: 'Sieć / Wi‑Fi', name: 'Test i optymalizacja Wi‑Fi', unit: 'usł', keywords: ['wifi', 'wi-fi', 'zasięg', 'zasieg'] },
  { key: 'switch_poe', category: 'Kamery CCTV', name: 'Switch PoE 4-port', unit: 'szt', keywords: ['switch', 'poe'] },
  { key: 'disk', category: 'Kamery CCTV', name: 'Montaż dysku do rejestratora', unit: 'szt', keywords: ['dysk', 'dysku', 'hdd'] },
  { key: 'box_holder', category: 'Kamery CCTV', name: 'Montaż puszki / uchwytu kamery', unit: 'szt', keywords: ['puszka montażowa', 'puszki montażowe', 'puszka montazowa', 'puszki montazowe', 'puszka', 'puszki', 'uchwyt', 'uchwyty'] },
  { key: 'electrical_box', category: 'Kamery CCTV', name: 'Puszka prądowa', unit: 'szt', keywords: ['puszka prądowa', 'puszki prądowe', 'puszka pradowa', 'puszki pradowe'] },
  { key: 'app_training', category: 'Serwis', name: 'Nauka obsługi i instalacja aplikacji', unit: 'usł', keywords: ['nauka obsługi aplikacji', 'nauka obslugi aplikacji', 'instalacja aplikacji'] },
  { key: 'domofon', category: 'Domofon', name: 'Montaż wideodomofonu 1-rodzinnego', unit: 'szt', keywords: ['domofon', 'wideodomofon', 'unifon'] },
  { key: 'alarm_sensor', category: 'Alarm', name: 'Montaż czujki PIR', unit: 'szt', keywords: ['czujka', 'czujki', 'pir'] },
  { key: 'gate_remote', category: 'Automatyka bram', name: 'Programowanie pilotów', unit: 'szt', keywords: ['pilot', 'pilota', 'pilotów', 'pilotow'] },
  { key: 'labor', category: 'Serwis', name: 'Robocizna', unit: 'godz', keywords: ['robocizna', 'praca', 'godzina', 'godziny', 'godzin'] },
  { key: 'service', category: 'Serwis', name: 'Diagnostyka / serwis', unit: 'godz', keywords: ['serwis', 'diagnostyka', 'naprawa'] }
];

const POLISH_NUMBER_WORDS = {
  'zero': 0,
  'jeden': 1, 'jedna': 1, 'jedno': 1, 'jednej': 1, 'jednego': 1, 'pierwsza': 1, 'pierwszy': 1,
  'dwa': 2, 'dwie': 2, 'dwóch': 2, 'dwoch': 2, 'dwoma': 2, 'drugie': 2, 'drugi': 2,
  'trzy': 3, 'trzech': 3, 'trzema': 3,
  'cztery': 4, 'czterech': 4, 'czterema': 4,
  'pięć': 5, 'piec': 5, 'pięciu': 5, 'pieciu': 5,
  'sześć': 6, 'szesc': 6, 'sześciu': 6, 'szesciu': 6,
  'siedem': 7, 'siedmiu': 7,
  'osiem': 8, 'ośmiu': 8, 'osmiu': 8,
  'dziewięć': 9, 'dziewiec': 9, 'dziewięciu': 9, 'dziewieciu': 9,
  'dziesięć': 10, 'dziesiec': 10, 'dziesięciu': 10, 'dziesieciu': 10,
  'jedenaście': 11, 'jedenascie': 11, 'jednastu': 11,
  'dwanaście': 12, 'dwanascie': 12, 'dwunastu': 12,
  'trzynaście': 13, 'trzynascie': 13, 'trzynastu': 13,
  'czternaście': 14, 'czternascie': 14, 'czternastu': 14,
  'piętnaście': 15, 'pietnascie': 15, 'piętnastu': 15, 'pietnastu': 15,
  'szesnaście': 16, 'szesnascie': 16, 'szesnastu': 16,
  'siedemnaście': 17, 'siedemnascie': 17, 'siedemnastu': 17,
  'osiemnaście': 18, 'osiemnascie': 18, 'osiemnastu': 18,
  'dziewiętnaście': 19, 'dziewietnascie': 19, 'dziewiętnastu': 19, 'dziewietnastu': 19,
  'dwadzieścia': 20, 'dwadziescia': 20, 'dwudziestu': 20,
  'trzydzieści': 30, 'trzydziesci': 30, 'trzydziestu': 30,
  'czterdzieści': 40, 'czterdziesci': 40, 'czterdziestu': 40,
  'pięćdziesiąt': 50, 'piecdziesiat': 50, 'pięćdziesięciu': 50, 'piecdziesieciu': 50,
  'sto': 100, 'stu': 100
};

const CLIENT_FIELD_STOP_WORDS = [
  'telefon', 'tel', 'numer', 'adres', 'ulica', 'ul', 'miejscowość', 'miejscowosc', 'klient', 'klientka', 'imię', 'imie', 'nazwisko',
  'montaż', 'montaz', 'instalacja', 'będę', 'bede', 'kamera', 'kamery', 'kamer', 'kabel', 'przewód', 'przewod', 'dojazd', 'robocizna',
  'rejestrator', 'router', 'domofon', 'wideodomofon', 'alarm', 'czujka', 'pilot', 'anteny', 'antena', 'puszka', 'puszki', 'uchwyt', 'uchwyty', 'ip', 'cctv'
];

const ADDRESS_STOP_WORDS = [
  'telefon', 'tel', 'numer telefonu', 'klient', 'klientka', 'imię', 'imie', 'nazwisko', 'miejscowość', 'miejscowosc',
  'montaż', 'montaz', 'instalacja', 'instalację', 'instalacje', 'będę', 'bede',
  'kamera', 'kamery', 'kamer', 'kabel', 'przewód', 'przewod', 'dojazd', 'robocizna', 'rejestrator',
  'router', 'domofon', 'wideodomofon', 'alarm', 'czujka', 'pilot', 'antena', 'anteny', 'puszka', 'puszki', 'uchwyt', 'uchwyty', 'ip', 'cctv'
];

const KNOWN_CITIES = ['mielec', 'tarnów', 'tarnow', 'rzeszów', 'rzeszow', 'dębica', 'debica', 'kolbuszowa', 'przecław', 'przeclaw', 'radomyśl', 'radomysl'];

let state = createEmptyQuote();
let deferredInstallPrompt = null;
let pendingParse = null;
let lastBreakdownSnapshot = null;

const $ = (id) => document.getElementById(id);
const money = (value) => `${number(value).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
const number = (value, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value ?? '').replace(',', '.').replace(/\s+/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

function createEmptyQuote() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    visitDate: '',
    jobType: 'Kamery CCTV',
    notes: '',
    distanceKm: 0,
    distanceRate: 2,
    freeKm: 20,
    services: []
  };
}

function defaultSettings() {
  return {
    companyName: 'Moja Firma Instalacyjna',
    vatRate: 23,
    storageMode: 'local',
    dropboxAccessToken: '',
    dropboxPath: '/pomocnik_instalatora_data.json',
    dropboxAutoSync: false,
    lastDropboxSyncAt: ''
  };
}

function loadSettings() {
  try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return defaultSettings(); }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}


function getDefaultCatalog() {
  return structuredCloneSafe(window.PRICE_CATALOG || {});
}

function parseCatalogPrice(value) {
  const parsed = Number(String(value ?? 0).replace(',', '.').replace(/\s+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateCatalogObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out = {};
  for (const [category, items] of Object.entries(value)) {
    if (!category || !Array.isArray(items)) continue;
    const cleanItems = items
      .map(item => ({
        name: String(item?.name || '').trim(),
        unit: String(item?.unit || 'usł').trim() || 'usł',
        price_net: parseCatalogPrice(item?.price_net ?? item?.priceNet ?? item?.price)
      }))
      .filter(item => item.name);
    if (cleanItems.length) out[String(category).trim()] = cleanItems;
  }
  return Object.keys(out).length ? out : null;
}

function loadCatalog() {
  try {
    const stored = localStorage.getItem(CATALOG_KEY);
    if (stored) {
      const parsed = validateCatalogObject(JSON.parse(stored));
      if (parsed) return parsed;
    }
  } catch {}
  return getDefaultCatalog();
}

function saveCatalog(catalog) {
  const clean = validateCatalogObject(catalog) || getDefaultCatalog();
  localStorage.setItem(CATALOG_KEY, JSON.stringify(clean));
  CATALOG = clean;
  CATEGORIES = Object.keys(CATALOG);
}

function resetCatalogStorage() {
  localStorage.removeItem(CATALOG_KEY);
  CATALOG = loadCatalog();
  CATEGORIES = Object.keys(CATALOG);
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function defaultPhraseDictionaryText() {
  return [
    'puszki i prądowe = puszki prądowe',
    'puszki elektryczne = puszki prądowe',
    'elektryczne puszki = puszki prądowe',
    'apka = instalacja aplikacji',
    'aplikacja na telefonie = nauka obsługi aplikacji',
    'konfiguracja telefonu = nauka obsługi aplikacji',
    'kamerka = kamera',
    'kamerki = kamery',
    'rejstrator = rejestrator',
    'net = internet'
  ].join('\n');
}

function loadPhraseDictionaryText() {
  const stored = localStorage.getItem(PHRASE_DICTIONARY_KEY);
  return stored === null ? defaultPhraseDictionaryText() : stored;
}

function savePhraseDictionaryText(text) {
  localStorage.setItem(PHRASE_DICTIONARY_KEY, String(text || ''));
}

function parsePhraseDictionary(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const parts = line.split('=');
      const from = parts.shift().trim();
      const to = parts.join('=').trim();
      return { from, to };
    })
    .filter(rule => rule.from && rule.to);
}

function normalizeQuoteRecord(quote) {
  const now = new Date().toISOString();
  const clean = { ...createEmptyQuote(), ...(quote || {}) };
  clean.id = clean.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  clean.createdAt = clean.createdAt || clean.updatedAt || now;
  clean.updatedAt = clean.updatedAt || clean.createdAt || now;
  clean.deletedAt = clean.deletedAt || null;
  clean.deviceId = clean.deviceId || getDeviceId();
  clean.version = number(clean.version, 1);
  clean.services = Array.isArray(clean.services) ? clean.services : [];
  return clean;
}

function loadQuoteRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return dedupeQuoteRecords(parsed.map(normalizeQuoteRecord));
  } catch {
    return [];
  }
}

function saveQuoteRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeQuoteRecords(records || [])));
}

function loadQuotes() {
  return loadQuoteRecords()
    .filter(item => !item.deletedAt)
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
}

function saveQuotes(quotes) {
  const active = (quotes || []).map(item => ({ ...normalizeQuoteRecord(item), deletedAt: null }));
  const activeIds = new Set(active.map(item => item.id));
  const tombstones = loadQuoteRecords().filter(item => item.deletedAt && !activeIds.has(item.id));
  saveQuoteRecords([...active, ...tombstones]);
}

function upsertQuoteRecord(quote) {
  const now = new Date().toISOString();
  const records = loadQuoteRecords();
  const idx = records.findIndex(item => item.id === quote.id);
  const previous = idx >= 0 ? records[idx] : null;
  const clean = normalizeQuoteRecord({
    ...quote,
    deletedAt: null,
    updatedAt: now,
    version: number(previous?.version ?? quote.version, 0) + 1,
    deviceId: getDeviceId()
  });
  if (idx >= 0) records[idx] = clean;
  else records.unshift(clean);
  saveQuoteRecords(records);
  return clean;
}

function markQuoteDeleted(id) {
  const now = new Date().toISOString();
  const records = loadQuoteRecords();
  const idx = records.findIndex(item => item.id === id);
  if (idx >= 0) {
    records[idx] = normalizeQuoteRecord({
      ...records[idx],
      deletedAt: now,
      updatedAt: now,
      version: number(records[idx].version, 0) + 1,
      deviceId: getDeviceId()
    });
  } else {
    records.push(normalizeQuoteRecord({ id, deletedAt: now, updatedAt: now, version: 1, deviceId: getDeviceId() }));
  }
  saveQuoteRecords(records);
}

function dedupeQuoteRecords(records) {
  const map = new Map();
  for (const record of records || []) {
    const clean = normalizeQuoteRecord(record);
    const previous = map.get(clean.id);
    if (!previous || compareQuoteRecords(clean, previous) >= 0) map.set(clean.id, clean);
  }
  return [...map.values()].sort((a, b) => String(b.updatedAt || b.deletedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.deletedAt || a.createdAt || '')));
}

function compareQuoteRecords(a, b) {
  const ta = Date.parse(a.deletedAt || a.updatedAt || a.createdAt || '') || 0;
  const tb = Date.parse(b.deletedAt || b.updatedAt || b.createdAt || '') || 0;
  if (ta !== tb) return ta > tb ? 1 : -1;
  const va = number(a.version, 0);
  const vb = number(b.version, 0);
  if (va !== vb) return va > vb ? 1 : -1;
  return String(a.deviceId || '').localeCompare(String(b.deviceId || ''));
}

function fillSelect(select, values, labelGetter = x => x, valueGetter = x => x) {
  select.innerHTML = '';
  for (const item of values) {
    const option = document.createElement('option');
    option.value = valueGetter(item);
    option.textContent = labelGetter(item);
    select.appendChild(option);
  }
}

function init() {
  initTabs();
  initPwa();
  initForm();
  initEvents();
  renderAll();
}

function initTabs() {
  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      $(button.dataset.tab).classList.add('active');
    });
  });
}

function initPwa() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $('installBtn').hidden = false;
  });
}

function initForm() {
  const settings = loadSettings();
  $('companyName').value = settings.companyName;
  $('vatRate').value = settings.vatRate;
  if ($('storageMode')) $('storageMode').value = settings.storageMode || 'local';
  if ($('dropboxToken')) $('dropboxToken').value = settings.dropboxAccessToken || '';
  if ($('dropboxPath')) $('dropboxPath').value = settings.dropboxPath || '/pomocnik_instalatora_data.json';
  if ($('dropboxAutoSync')) $('dropboxAutoSync').checked = !!settings.dropboxAutoSync;
  $('phraseDictionary').value = loadPhraseDictionaryText();
  fillSelect($('jobType'), CATEGORIES);
  fillSelect($('categorySelect'), CATEGORIES);
  renderCatalogCategoryList();
  $('jobType').value = state.jobType;
  $('categorySelect').value = state.jobType;
  updateServiceSelect();
  const today = new Date().toISOString().slice(0, 10);
  state.visitDate = today;
  $('visitDate').value = today;
}

function initEvents() {
  ['clientName', 'clientPhone', 'clientAddress', 'visitDate', 'jobType', 'notes', 'distanceKm', 'distanceRate', 'freeKm'].forEach(id => {
    $(id).addEventListener('input', syncFromForm);
    $(id).addEventListener('change', syncFromForm);
  });

  $('categorySelect').addEventListener('change', updateServiceSelect);
  $('serviceSelect').addEventListener('change', syncSelectedServicePrice);
  $('addServiceBtn').addEventListener('click', addSelectedService);
  $('suggestBtn').addEventListener('click', suggestFromNotes);
  $('saveQuoteBtn').addEventListener('click', saveCurrentQuote);
  $('newQuoteBtn').addEventListener('click', newQuote);
  $('exportTxtBtn').addEventListener('click', () => downloadTxt(state));
  $('printBtn').addEventListener('click', () => window.print());
  $('copyReportBtn').addEventListener('click', copyReport);
  $('catalogSearch').addEventListener('input', renderCatalog);
  $('saveCatalogItemBtn').addEventListener('click', saveCatalogItemFromForm);
  $('clearCatalogEditorBtn').addEventListener('click', clearCatalogEditor);
  $('exportCatalogBtn').addEventListener('click', exportCatalog);
  $('importCatalogBtn').addEventListener('click', () => $('importCatalogFile').click());
  $('importCatalogFile').addEventListener('change', importCatalogFromFile);
  $('resetCatalogBtn').addEventListener('click', resetCatalogToDefault);
  $('saveSettingsBtn').addEventListener('click', saveSettingsFromForm);
  $('clearDataBtn').addEventListener('click', clearLocalData);
  $('exportBackupBtn').addEventListener('click', exportBackup);
  $('refreshAppBtn').addEventListener('click', refreshAppCache);
  $('savePhraseDictionaryBtn').addEventListener('click', savePhraseDictionaryFromForm);
  $('resetPhraseDictionaryBtn').addEventListener('click', resetPhraseDictionary);
  $('clearLearnedRulesBtn').addEventListener('click', clearLearnedRules);
  $('runParserTestBtn').addEventListener('click', runParserTest);
  $('fillExampleParserTestBtn').addEventListener('click', fillExampleParserTest);
  $('saveDropboxSettingsBtn').addEventListener('click', saveDropboxSettingsFromForm);
  $('dropboxSyncBtn').addEventListener('click', () => syncDropbox('merge'));
  $('dropboxPullBtn').addEventListener('click', () => syncDropbox('pull'));
  $('dropboxPushBtn').addEventListener('click', () => syncDropbox('push'));
  $('dropboxTestBtn').addEventListener('click', testDropboxConnection);
  $('installBtn').addEventListener('click', installPwa);
  $('voiceBtn').addEventListener('click', startDictation);
  $('analyzeVoiceBtn').addEventListener('click', analyzeVoiceCommandFromField);
  $('acceptParserBtn').addEventListener('click', acceptParserPreview);
  $('rejectParserBtn').addEventListener('click', rejectParserPreview);
  $('undoParseBtn').addEventListener('click', undoLastBreakdown);
  $('clearVoiceBtn').addEventListener('click', () => { $('voiceCommand').value = ''; rejectParserPreview(false); });
}

function syncFromForm() {
  state.clientName = $('clientName').value.trim();
  state.clientPhone = $('clientPhone').value.trim();
  state.clientAddress = $('clientAddress').value.trim();
  state.visitDate = $('visitDate').value;
  state.jobType = $('jobType').value;
  state.notes = $('notes').value.trim();
  state.distanceKm = number($('distanceKm').value);
  state.distanceRate = number($('distanceRate').value, 2);
  state.freeKm = number($('freeKm').value, 20);
  if ($('categorySelect').value !== state.jobType && CATALOG[state.jobType]) {
    $('categorySelect').value = state.jobType;
    updateServiceSelect();
  }
  renderSummary();
  renderChecklist();
}

function syncToForm() {
  $('clientName').value = state.clientName || '';
  $('clientPhone').value = state.clientPhone || '';
  $('clientAddress').value = state.clientAddress || '';
  $('visitDate').value = state.visitDate || '';
  $('jobType').value = state.jobType || CATEGORIES[0];
  $('notes').value = state.notes || '';
  $('distanceKm').value = state.distanceKm ?? 0;
  $('distanceRate').value = state.distanceRate ?? 2;
  $('freeKm').value = state.freeKm ?? 20;
  $('categorySelect').value = state.jobType || CATEGORIES[0];
  updateServiceSelect();
}

function updateServiceSelect() {
  const category = $('categorySelect').value || CATEGORIES[0];
  const services = CATALOG[category] || [];
  fillSelect($('serviceSelect'), services, s => `${s.name} — ${money(s.price_net)} / ${s.unit}`, s => s.name);
  syncSelectedServicePrice();
}

function syncSelectedServicePrice() {
  const service = findCatalogService($('categorySelect').value, $('serviceSelect').value);
  $('priceInput').value = service ? service.price_net : 0;
}

function findCatalogService(category, name) {
  return (CATALOG[category] || []).find(item => item.name === name) || null;
}

function findServiceByName(name) {
  for (const category of CATEGORIES) {
    const item = findCatalogService(category, name);
    if (item) return { ...item, category };
  }
  return null;
}

function addSelectedService() {
  const category = $('categorySelect').value;
  const selected = findCatalogService(category, $('serviceSelect').value);
  const name = selected ? selected.name : $('serviceSelect').value;
  const unit = selected ? selected.unit : 'usł';
  state.services.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    category,
    name,
    unit,
    quantity: number($('qtyInput').value, 1),
    priceNet: number($('priceInput').value)
  });
  renderServices();
  renderSummary();
}

function removeService(id) {
  state.services = state.services.filter(item => item.id !== id);
  renderServices();
  renderSummary();
}

function updateLine(id, field, value, learnCorrection = false) {
  const row = state.services.find(item => item.id === id);
  if (!row) return;
  const previous = row[field];
  row[field] = field === 'quantity' || field === 'priceNet' ? number(value) : value;
  renderSummary();
  renderServices(false);
  if (learnCorrection && String(previous) !== String(row[field])) rememberParserCorrection(row);
}

function detectTypes(notes) {
  const text = (notes || '').toLowerCase();
  const result = [];
  for (const [keyword, type] of Object.entries(KEYWORDS_TO_TYPES)) {
    if (text.includes(keyword) && !result.includes(type)) result.push(type);
  }
  return result;
}

function suggestFromNotes() {
  syncFromForm();
  const detected = detectTypes(state.notes);
  const types = detected.length ? detected : [state.jobType];

  if (detected[0]) {
    state.jobType = detected[0];
    syncToForm();
  }

  if (state.services.length > 0) {
    showInfo(`Wykryto typ: ${types.join(', ')}. Nie dodano typowych pozycji z cennika, bo wycena ma już pozycje z tekstu. Dzięki temu program nie dolicza automatycznie rejestratora, podglądu, okablowania ani dodatkowego montażu kamery.`);
    renderAll();
    return;
  }

  const before = state.services.length;
  for (const type of types) {
    for (const serviceName of TYPE_HINTS[type] || []) {
      const service = findServiceByName(serviceName);
      if (!service) continue;
      const exists = state.services.some(row => row.name === service.name);
      if (!exists) {
        state.services.push({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          category: service.category,
          name: service.name,
          unit: service.unit,
          quantity: 1,
          priceNet: number(service.price_net)
        });
      }
    }
  }

  const added = state.services.length - before;
  showInfo(added ? `Dodano ${added} typowe pozycje z cennika. Wykryte typy: ${types.join(', ')}.` : 'Nie dodano nowych pozycji — podobne usługi już są w wycenie.');
  renderAll();
}

function calculateTotals(quote = state) {
  const settings = loadSettings();
  const vatRate = number(settings.vatRate, 23) / 100;
  const servicesNet = quote.services.reduce((sum, row) => sum + number(row.quantity, 1) * number(row.priceNet), 0);
  const billedKm = Math.max(0, number(quote.distanceKm) - number(quote.freeKm, 20));
  const distanceNet = billedKm * number(quote.distanceRate, 2);
  const net = round2(servicesNet + distanceNet);
  const vat = round2(net * vatRate);
  const gross = round2(net + vat);
  return { servicesNet: round2(servicesNet), billedKm, distanceNet: round2(distanceNet), net, vat, gross };
}

function round2(value) { return Math.round((number(value) + Number.EPSILON) * 100) / 100; }

function renderAll() {
  renderServices();
  renderSummary();
  renderChecklist();
  renderSavedQuotes();
  renderCatalog();
  renderCatalogCategoryList();
  renderLearnedRules();
  renderDropboxStatus();
}

function renderServices(full = true) {
  const body = $('servicesBody');
  const cards = $('serviceCards');
  if (full) {
    body.innerHTML = '';
    cards.innerHTML = '';
  }
  $('emptyServices').classList.toggle('visible', state.services.length === 0);

  if (!full) {
    [...body.querySelectorAll('tr'), ...cards.querySelectorAll('.service-card')].forEach(row => {
      const item = state.services.find(x => x.id === row.dataset.id);
      if (item) row.querySelector('.line-total').textContent = money(number(item.quantity, 1) * number(item.priceNet));
    });
    return;
  }

  for (const item of state.services) {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td><input value="${escapeAttr(item.name)}" data-field="name"></td>
      <td>${escapeHtml(item.unit || 'usł')}</td>
      <td><input type="number" min="0" step="0.5" value="${number(item.quantity, 1)}" data-field="quantity"></td>
      <td><input type="number" min="0" step="0.01" value="${number(item.priceNet)}" data-field="priceNet"></td>
      <td class="line-total">${money(number(item.quantity, 1) * number(item.priceNet))}</td>
      <td><button class="btn btn-danger" data-remove="${item.id}">Usuń</button></td>`;
    body.appendChild(tr);

    const card = document.createElement('article');
    card.className = 'service-card';
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="service-card-top">
        <label>Usługa
          <input value="${escapeAttr(item.name)}" data-field="name">
        </label>
      </div>
      <div class="service-card-grid">
        <div><span>Jm.</span><strong>${escapeHtml(item.unit || 'usł')}</strong></div>
        <label>Ilość
          <input type="number" min="0" step="0.5" value="${number(item.quantity, 1)}" data-field="quantity">
        </label>
        <label>Cena netto
          <input type="number" min="0" step="0.01" value="${number(item.priceNet)}" data-field="priceNet">
        </label>
      </div>
      <div class="service-card-bottom">
        <span>Razem: <strong class="line-total">${money(number(item.quantity, 1) * number(item.priceNet))}</strong></span>
        <button class="btn btn-danger" data-remove="${item.id}">Usuń</button>
      </div>`;
    cards.appendChild(card);
  }

  [body, cards].forEach(container => {
    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('focus', () => { input.dataset.beforeValue = input.value; });
      input.addEventListener('change', () => {
        const id = input.closest('[data-id]').dataset.id;
        const before = input.dataset.beforeValue ?? '';
        updateLine(id, input.dataset.field, input.value, false);
        const row = state.services.find(item => item.id === id);
        if (row && String(before) !== String(input.value)) rememberParserCorrection(row);
        input.dataset.beforeValue = input.value;
      });
      input.addEventListener('input', () => updateLine(input.closest('[data-id]').dataset.id, input.dataset.field, input.value, false));
    });
    container.querySelectorAll('[data-remove]').forEach(button => {
      button.addEventListener('click', () => removeService(button.dataset.remove));
    });
  });
}

function renderSummary() {
  const totals = calculateTotals();
  $('sumNet').textContent = money(totals.net);
  $('sumVat').textContent = money(totals.vat);
  $('sumGross').textContent = money(totals.gross);
  $('distanceInfo').textContent = `Płatne km: ${totals.billedKm}. Dojazd: ${money(totals.distanceNet)} netto`;
}

function renderChecklist() {
  const list = CHECKLISTS[state.jobType] || [];
  $('checklist').innerHTML = list.map((text, index) => `
    <label class="check-item"><input type="checkbox" data-check="${index}"> <span>${escapeHtml(text)}</span></label>
  `).join('');
}

function saveCurrentQuote() {
  syncFromForm();
  state = upsertQuoteRecord(state);
  renderSavedQuotes();
  showInfo('Wycena zapisana. Jeśli Dropbox jest włączony, program może ją zsynchronizować automatycznie.');
  scheduleAutoDropboxSync();
}

function newQuote() {
  state = createEmptyQuote();
  pendingParse = null;
  lastBreakdownSnapshot = null;
  hideParserPreview();
  $('undoParseBtn').hidden = true;
  syncToForm();
  renderAll();
  showInfo('Utworzono pustą wycenę.');
}

function renderSavedQuotes() {
  const quotes = loadQuotes();
  const wrap = $('savedQuotes');
  const template = $('savedQuoteTemplate');
  wrap.innerHTML = '';
  $('emptySaved').classList.toggle('visible', quotes.length === 0);

  for (const quote of quotes) {
    const totals = calculateTotals(quote);
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('h3').textContent = quote.clientName || 'Bez nazwy klienta';
    node.querySelector('p').textContent = `${quote.visitDate || 'brak daty'} • ${quote.jobType || 'brak typu'} • ${money(totals.gross)} brutto`;
    node.querySelector('.load').addEventListener('click', () => loadQuote(quote.id));
    node.querySelector('.txt').addEventListener('click', () => downloadTxt(quote));
    node.querySelector('.delete').addEventListener('click', () => deleteQuote(quote.id));
    wrap.appendChild(node);
  }
}

function loadQuote(id) {
  const quote = loadQuotes().find(item => item.id === id);
  if (!quote) return;
  state = { ...createEmptyQuote(), ...structuredCloneSafe(quote) };
  pendingParse = null;
  lastBreakdownSnapshot = null;
  hideParserPreview();
  $('undoParseBtn').hidden = true;
  syncToForm();
  renderAll();
  document.querySelector('[data-tab="quoteTab"]').click();
}

function deleteQuote(id) {
  if (!confirm('Usunąć tę wycenę?')) return;
  markQuoteDeleted(id);
  renderSavedQuotes();
  showInfo('Wycena oznaczona jako usunięta. Przy synchronizacji Dropbox znacznik usunięcia zostanie przeniesiony na drugie urządzenie.');
  scheduleAutoDropboxSync();
}

function renderCatalog() {
  const query = ($('catalogSearch')?.value || '').toLowerCase().trim();
  const container = $('catalogView');
  if (!container) return;
  container.innerHTML = '';
  for (const category of CATEGORIES) {
    const items = (CATALOG[category] || []).filter(item => !query || `${category} ${item.name}`.toLowerCase().includes(query));
    if (!items.length) continue;
    const group = document.createElement('section');
    group.className = 'catalog-group';
    group.innerHTML = `<h3>${escapeHtml(category)}</h3>`;
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'catalog-item';
      row.innerHTML = `
        <div>${escapeHtml(item.name)}</div>
        <div>${escapeHtml(item.unit)}</div>
        <div class="price">${money(item.price_net)}</div>
        <button class="btn btn-soft" data-action="add">Dodaj</button>
        <button class="btn btn-ghost" data-action="edit">Edytuj</button>
        <button class="btn btn-danger" data-action="delete">Usuń</button>`;
      row.querySelector('[data-action="add"]').addEventListener('click', () => {
        state.services.push({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          category,
          name: item.name,
          unit: item.unit,
          quantity: 1,
          priceNet: number(item.price_net)
        });
        renderServices();
        renderSummary();
        document.querySelector('[data-tab="quoteTab"]').click();
      });
      row.querySelector('[data-action="edit"]').addEventListener('click', () => fillCatalogEditor(category, item));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCatalogItem(category, item.name));
      group.appendChild(row);
    }
    container.appendChild(group);
  }
}

function renderCatalogCategoryList() {
  const datalist = $('catalogCategoryList');
  if (!datalist) return;
  datalist.innerHTML = CATEGORIES.map(category => `<option value="${escapeAttr(category)}"></option>`).join('');
}

function fillCatalogEditor(category, item) {
  $('catalogEditCategory').value = category || '';
  $('catalogEditName').value = item?.name || '';
  $('catalogEditUnit').value = item?.unit || 'usł';
  $('catalogEditPrice').value = item ? number(item.price_net, 0) : 0;
  showCatalogEditInfo(`Wczytano pozycję do edycji: ${item?.name || ''}`);
}

function clearCatalogEditor() {
  $('catalogEditCategory').value = state.jobType || CATEGORIES[0] || '';
  $('catalogEditName').value = '';
  $('catalogEditUnit').value = 'usł';
  $('catalogEditPrice').value = '';
  showCatalogEditInfo('Formularz cennika wyczyszczony.');
}

function saveCatalogItemFromForm() {
  const category = $('catalogEditCategory').value.trim();
  const name = $('catalogEditName').value.trim();
  const unit = $('catalogEditUnit').value.trim() || 'usł';
  const price = number($('catalogEditPrice').value, -1);
  if (!category || !name || price < 0) {
    showCatalogEditInfo('Uzupełnij kategorię, nazwę usługi i poprawną cenę netto.', true);
    return;
  }

  const catalog = structuredCloneSafe(CATALOG);
  if (!catalog[category]) catalog[category] = [];
  const idx = catalog[category].findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  const item = { name, unit, price_net: round2(price) };
  if (idx >= 0) catalog[category][idx] = item;
  else catalog[category].push(item);
  catalog[category].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  saveCatalog(catalog);
  refreshCatalogControls(category);
  renderCatalog();
  showCatalogEditInfo(idx >= 0 ? 'Zaktualizowano pozycję cennika.' : 'Dodano nową pozycję cennika.');
}

function deleteCatalogItem(category, name) {
  if (!confirm(`Usunąć z cennika pozycję: ${name}?`)) return;
  const catalog = structuredCloneSafe(CATALOG);
  catalog[category] = (catalog[category] || []).filter(item => item.name !== name);
  if (!catalog[category].length) delete catalog[category];
  saveCatalog(catalog);
  refreshCatalogControls();
  renderCatalog();
  showCatalogEditInfo('Usunięto pozycję z cennika. Istniejące wyceny nie zostały zmienione.');
}

function exportCatalog() {
  const payload = {
    app: 'Pomocnik Instalatora PWA',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    catalog: CATALOG
  };
  downloadFile(`cennik_pomocnik_instalatora_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
}

function importCatalogFromFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      const imported = validateCatalogObject(parsed.catalog || parsed);
      if (!imported) throw new Error('Nieprawidłowy format cennika.');
      saveCatalog(imported);
      refreshCatalogControls();
      renderCatalog();
      showCatalogEditInfo('Zaimportowano cennik z pliku JSON.');
    } catch (error) {
      showCatalogEditInfo(`Nie udało się zaimportować cennika: ${error.message}`, true);
    }
  };
  reader.readAsText(file, 'utf-8');
}

function resetCatalogToDefault() {
  if (!confirm('Przywrócić domyślny cennik? Twoje lokalne zmiany cennika zostaną usunięte.')) return;
  resetCatalogStorage();
  refreshCatalogControls();
  renderCatalog();
  showCatalogEditInfo('Przywrócono domyślny cennik.');
}

function refreshCatalogControls(preferredCategory = '') {
  const currentJob = preferredCategory || state.jobType || $('jobType')?.value || CATEGORIES[0] || '';
  if ($('jobType')) {
    fillSelect($('jobType'), CATEGORIES);
    $('jobType').value = CATALOG[currentJob] ? currentJob : (CATEGORIES[0] || '');
    state.jobType = $('jobType').value;
  }
  if ($('categorySelect')) {
    fillSelect($('categorySelect'), CATEGORIES);
    $('categorySelect').value = CATALOG[currentJob] ? currentJob : (CATEGORIES[0] || '');
    updateServiceSelect();
  }
  renderCatalogCategoryList();
}

function showCatalogEditInfo(text, isError = false) {
  const box = $('catalogEditInfo');
  if (!box) return;
  box.textContent = text;
  box.classList.toggle('error', !!isError);
  box.hidden = false;
}

function buildReport(quote = state) {
  const settings = loadSettings();
  const totals = calculateTotals(quote);
  const lines = [];
  lines.push(settings.companyName);
  lines.push('POMOCNIK INSTALATORA — WYCENA');
  lines.push('');
  lines.push(`Klient: ${quote.clientName || '-'}`);
  lines.push(`Telefon: ${quote.clientPhone || '-'}`);
  lines.push(`Adres: ${quote.clientAddress || '-'}`);
  lines.push(`Data wizyty: ${quote.visitDate || '-'}`);
  lines.push(`Typ zlecenia: ${quote.jobType || '-'}`);
  lines.push('');
  lines.push('USŁUGI:');
  if (!quote.services.length) lines.push('- brak pozycji');
  quote.services.forEach((item, index) => {
    const total = number(item.quantity, 1) * number(item.priceNet);
    lines.push(`${index + 1}. ${item.name} — ${item.quantity} ${item.unit || 'usł'} × ${money(item.priceNet)} = ${money(total)} netto`);
  });
  lines.push('');
  lines.push(`Dojazd: ${totals.billedKm} km płatne × ${money(quote.distanceRate)} = ${money(totals.distanceNet)} netto`);
  lines.push(`Razem netto: ${money(totals.net)}`);
  lines.push(`VAT: ${money(totals.vat)}`);
  lines.push(`Razem brutto: ${money(totals.gross)}`);
  lines.push('');
  lines.push('NOTATKI:');
  lines.push(quote.notes || '-');
  return lines.join('\n');
}

function downloadTxt(quote) {
  const name = sanitizeFileName(`${quote.clientName || 'wycena'}_${quote.visitDate || new Date().toISOString().slice(0, 10)}.txt`);
  downloadFile(name, buildReport(quote), 'text/plain;charset=utf-8');
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(buildReport(state));
    showInfo('Raport skopiowany do schowka.');
  } catch {
    showInfo('Nie udało się skopiować raportu. Użyj eksportu TXT.');
  }
}

function exportBackup() {
  const payload = {
    app: 'Pomocnik Instalatora PWA',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    settings: loadSettings(),
    phraseDictionary: loadPhraseDictionaryText(),
    learnedParserRules: loadLearnedRules(),
    catalog: CATALOG,
    quoteRecords: loadQuoteRecords(),
    quotes: loadQuotes()
  };
  downloadFile(`pomocnik_instalatora_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
}

function readSettingsFromForm() {
  const current = loadSettings();
  return {
    ...current,
    companyName: $('companyName').value.trim() || 'Moja Firma Instalacyjna',
    vatRate: number($('vatRate').value, 23),
    storageMode: $('storageMode')?.value || 'local',
    dropboxAccessToken: $('dropboxToken')?.value.trim() || '',
    dropboxPath: normalizeDropboxPath($('dropboxPath')?.value || '/pomocnik_instalatora_data.json'),
    dropboxAutoSync: !!$('dropboxAutoSync')?.checked
  };
}

function saveSettingsFromForm() {
  saveSettings(readSettingsFromForm());
  renderSummary();
  renderDropboxStatus();
  showInfo('Ustawienia zapisane.');
}

function saveDropboxSettingsFromForm() {
  saveSettings(readSettingsFromForm());
  renderDropboxStatus();
  showDropboxStatus('Zapisano ustawienia Dropbox.');
}

function normalizeDropboxPath(path) {
  const clean = String(path || '/pomocnik_instalatora_data.json').trim() || '/pomocnik_instalatora_data.json';
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function renderDropboxStatus() {
  const box = $('dropboxStatus');
  if (!box) return;
  const settings = loadSettings();
  if (settings.storageMode !== 'dropbox') {
    box.textContent = 'Tryb lokalny — Dropbox wyłączony.';
    box.classList.remove('error', 'ok');
    return;
  }
  const tokenState = settings.dropboxAccessToken ? 'token wpisany' : 'brak tokenu';
  const last = settings.lastDropboxSyncAt ? ` Ostatnia synchronizacja: ${formatDateTime(settings.lastDropboxSyncAt)}.` : '';
  box.textContent = `Dropbox włączony — plik: ${settings.dropboxPath || '/pomocnik_instalatora_data.json'}, ${tokenState}.${last}`;
  box.classList.toggle('error', !settings.dropboxAccessToken);
  box.classList.toggle('ok', !!settings.dropboxAccessToken);
}

function showDropboxStatus(text, isError = false) {
  const box = $('dropboxStatus');
  if (!box) return;
  box.textContent = text;
  box.classList.toggle('error', !!isError);
  box.classList.toggle('ok', !isError);
}

function buildSyncPayload(records = loadQuoteRecords()) {
  return {
    app: 'Pomocnik Instalatora PWA',
    schema: 2,
    version: APP_VERSION,
    deviceId: getDeviceId(),
    updatedAt: new Date().toISOString(),
    records: dedupeQuoteRecords(records),
    catalog: CATALOG,
    settings: {
      companyName: loadSettings().companyName,
      vatRate: loadSettings().vatRate
    }
  };
}

function extractRemoteRecords(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.records)) return payload.records.map(normalizeQuoteRecord);
  if (Array.isArray(payload.quotes)) return payload.quotes.map(normalizeQuoteRecord);
  return [];
}

function mergeQuoteRecords(localRecords, remoteRecords) {
  return dedupeQuoteRecords([...(localRecords || []), ...(remoteRecords || [])]);
}

function scheduleAutoDropboxSync() {
  const settings = loadSettings();
  if (settings.storageMode !== 'dropbox' || !settings.dropboxAutoSync || !settings.dropboxAccessToken) return;
  window.clearTimeout(scheduleAutoDropboxSync.timer);
  scheduleAutoDropboxSync.timer = window.setTimeout(() => syncDropbox('merge', true), 700);
}

async function testDropboxConnection() {
  saveSettings(readSettingsFromForm());
  const settings = loadSettings();
  if (!requireDropboxSettings(settings)) return;
  showDropboxStatus('Sprawdzam połączenie z Dropbox...');
  try {
    await dropboxApi('https://api.dropboxapi.com/2/users/get_current_account', settings, { method: 'POST' });
    showDropboxStatus('Połączenie z Dropbox działa.');
  } catch (error) {
    showDropboxStatus(`Błąd Dropbox: ${error.message}`, true);
  }
}

function requireDropboxSettings(settings = loadSettings()) {
  if (settings.storageMode !== 'dropbox') {
    showDropboxStatus('Najpierw wybierz tryb Dropbox i zapisz ustawienia.', true);
    return false;
  }
  if (!settings.dropboxAccessToken) {
    showDropboxStatus('Brakuje access tokenu Dropbox.', true);
    return false;
  }
  if (!settings.dropboxPath) {
    showDropboxStatus('Brakuje ścieżki pliku Dropbox.', true);
    return false;
  }
  return true;
}

async function syncDropbox(mode = 'merge', silent = false) {
  saveSettings(readSettingsFromForm());
  const settings = loadSettings();
  if (!requireDropboxSettings(settings)) return;
  if (!silent) showDropboxStatus('Synchronizacja Dropbox w toku...');

  try {
    const localRecords = loadQuoteRecords();
    let finalRecords = localRecords;
    let remotePayload = null;

    if (mode === 'pull' || mode === 'merge') {
      remotePayload = await downloadDropboxPayload(settings);
      const remoteRecords = extractRemoteRecords(remotePayload);
      finalRecords = mode === 'pull' ? mergeQuoteRecords(localRecords, remoteRecords) : mergeQuoteRecords(localRecords, remoteRecords);
    }

    if (mode === 'push') {
      finalRecords = localRecords;
    }

    saveQuoteRecords(finalRecords);

    const remoteCatalog = validateCatalogObject(remotePayload?.catalog || null);
    if (remoteCatalog && mode !== 'push') {
      // Cennik scalamy ostrożnie: lokalny ma pierwszeństwo, ale nowe kategorie/usługi z Dropboxa zostają dopisane.
      saveCatalog(mergeCatalogs(remoteCatalog, CATALOG));
      refreshCatalogControls();
    }

    await uploadDropboxPayload(settings, buildSyncPayload(finalRecords));
    const updatedSettings = { ...settings, lastDropboxSyncAt: new Date().toISOString() };
    saveSettings(updatedSettings);
    renderSavedQuotes();
    renderCatalog();
    renderDropboxStatus();
    if (!silent) showDropboxStatus(`Synchronizacja zakończona. Aktywne wyceny: ${loadQuotes().length}. Rekordy z usuniętymi: ${loadQuoteRecords().length}.`);
  } catch (error) {
    showDropboxStatus(`Błąd synchronizacji Dropbox: ${error.message}`, true);
  }
}

function mergeCatalogs(remoteCatalog, localCatalog) {
  const merged = structuredCloneSafe(remoteCatalog || {});
  for (const [category, items] of Object.entries(localCatalog || {})) {
    if (!merged[category]) merged[category] = [];
    for (const item of items || []) {
      const idx = merged[category].findIndex(existing => existing.name.toLowerCase() === item.name.toLowerCase());
      if (idx >= 0) merged[category][idx] = item;
      else merged[category].push(item);
    }
  }
  return validateCatalogObject(merged) || getDefaultCatalog();
}

async function downloadDropboxPayload(settings) {
  try {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.dropboxAccessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path: settings.dropboxPath })
      }
    });
    if (response.status === 409) return buildSyncPayload([]);
    if (!response.ok) throw new Error(await readDropboxError(response));
    return JSON.parse(await response.text() || '{}');
  } catch (error) {
    if (String(error.message || '').includes('path/not_found')) return buildSyncPayload([]);
    throw error;
  }
}

async function uploadDropboxPayload(settings, payload) {
  const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.dropboxAccessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: settings.dropboxPath,
        mode: 'overwrite',
        autorename: false,
        mute: true,
        strict_conflict: false
      })
    },
    body: JSON.stringify(payload, null, 2)
  });
  if (!response.ok) throw new Error(await readDropboxError(response));
  return response.json();
}

async function dropboxApi(url, settings, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${settings.dropboxAccessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(await readDropboxError(response));
  return response.json();
}

async function readDropboxError(response) {
  try {
    const text = await response.text();
    if (!text) return `${response.status} ${response.statusText}`;
    return text.slice(0, 600);
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

function savePhraseDictionaryFromForm() {
  savePhraseDictionaryText($('phraseDictionary').value);
  showInfo('Zapisano słownik własnych zwrotów. Nowe zasady będą używane przy kolejnym „Rozbij tekst”.');
}

function resetPhraseDictionary() {
  $('phraseDictionary').value = defaultPhraseDictionaryText();
  savePhraseDictionaryText($('phraseDictionary').value);
  showInfo('Przywrócono domyślny słownik zwrotów.');
}


function defaultLearnedRules() {
  return { version: 1, rules: {} };
}

function loadLearnedRules() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEARNED_RULES_KEY) || '');
    if (parsed && typeof parsed === 'object' && parsed.rules && typeof parsed.rules === 'object') return parsed;
  } catch {}
  return defaultLearnedRules();
}

function saveLearnedRules(data) {
  localStorage.setItem(LEARNED_RULES_KEY, JSON.stringify(data || defaultLearnedRules()));
}

function clearLearnedRules() {
  if (!confirm('Usunąć zapamiętane korekty parsera?')) return;
  localStorage.removeItem(LEARNED_RULES_KEY);
  renderLearnedRules();
  showInfo('Usunięto zapamiętane korekty parsera.');
}

function renderLearnedRules() {
  const box = $('learnedRulesView');
  if (!box) return;
  const data = loadLearnedRules();
  const rules = Object.values(data.rules || {}).sort((a, b) => String(b.learnedAt || '').localeCompare(String(a.learnedAt || '')));
  if (!rules.length) {
    box.innerHTML = '<div class="preview-muted">Brak zapamiętanych korekt. Program zapisze korektę po ręcznej zmianie pozycji dodanej z rozbicia tekstu.</div>';
    return;
  }
  box.innerHTML = `
    <div class="learned-list">
      ${rules.map(rule => `
        <div class="learned-rule">
          <strong>${escapeHtml(rule.name || '-')}</strong>
          <span>${escapeHtml(rule.quantity)} ${escapeHtml(rule.unit || 'szt')} × ${money(rule.priceNet)}</span>
          <small>${escapeHtml(rule.parserKey || '')} • użycia: ${number(rule.uses, 0)} • ${escapeHtml(formatDateTime(rule.learnedAt))}</small>
        </div>
      `).join('')}
    </div>`;
}

function rememberParserCorrection(row) {
  if (!row || row.parserSource !== 'voice' || !row.learningSignature) return;
  const data = loadLearnedRules();
  const previous = data.rules[row.learningSignature];
  data.rules[row.learningSignature] = {
    signature: row.learningSignature,
    parserKey: row.parserKey || '',
    category: row.category || 'Serwis',
    name: row.name || '',
    unit: row.unit || 'szt',
    quantity: number(row.quantity, 1),
    priceNet: number(row.priceNet, 0),
    learnedAt: new Date().toISOString(),
    uses: number(previous?.uses, 0) + 1
  };
  saveLearnedRules(data);
  renderLearnedRules();
  showInfo(`Zapamiętano korektę parsera dla pozycji „${row.name}”. Przy podobnym tekście program spróbuje użyć tej poprawki automatycznie.`);
}

function applyLearnedCorrections(rawText, items) {
  const data = loadLearnedRules();
  const applied = [];
  for (const item of items) {
    const signature = makeLearningSignature(rawText, item);
    const learned = data.rules?.[signature];
    item.parserSource = 'voice';
    item.parserKey = item._voiceKey || item.name;
    item.learningSignature = signature;
    if (!learned) continue;
    item.category = learned.category || item.category;
    item.name = learned.name || item.name;
    item.unit = learned.unit || item.unit;
    item.quantity = number(learned.quantity, item.quantity);
    item.priceNet = number(learned.priceNet, item.priceNet);
    item.learnedApplied = true;
    learned.uses = number(learned.uses, 0) + 1;
    applied.push(item.name);
  }
  if (applied.length) saveLearnedRules(data);
  return applied;
}

function makeLearningSignature(rawText, item) {
  const key = String(item._voiceKey || item.parserKey || item.name || 'item').toLowerCase();
  const text = normalizeSpeechText(rawText || '');
  const price = number(item.priceNet, 0);
  let marker = '';

  if (key === 'camera_box_combo') {
    const match = text.match(/(?:montaz|instalacj\w*)\s+(?:\d+(?:[.]\d+)?\s+)?(?:1\s+)?kamer\w*\s+(?:i|z|plus)\s+puszk\w*.*?(\d+(?:[.]\d+)?)\s*zł/i);
    marker = `kamera-z-puszka-${match ? match[1] : price}`;
  } else if (key === 'mounting_box_material') {
    const match = text.match(/puszk\w*\s+montaz\w*.*?(\d+(?:[.]\d+)?)\s*zł/i);
    marker = `puszka-montazowa-${match ? match[1] : price}`;
  } else if (key === 'electrical_box') {
    const match = text.match(/(?:puszk\w*\s+prad\w*|prad\w*).*?(\d+(?:[.]\d+)?)\s*zł/i);
    marker = `puszka-pradowa-${match ? match[1] : price}`;
  } else if (key === 'app_training') {
    const match = text.match(/(?:nauka\s+obslugi\s+aplikacji|instalacja\s+aplikacji).*?(\d+(?:[.]\d+)?)\s*zł/i);
    marker = `aplikacja-${match ? match[1] : price}`;
  } else {
    marker = `${normalizeSpeechText(item.name || key)}-${item.unit || ''}-${price}`;
  }

  return `${key}|${marker}`;
}

function formatDateTime(value) {
  if (!value) return '';
  try { return new Date(value).toLocaleString('pl-PL'); }
  catch { return String(value); }
}

function fillExampleParserTest() {
  const text = 'Bogusław Biernacki ul Szymanowskiego 48 miejscowość Mielec instalacja czterech kamer IP dojazd 15 km 2 zł za kilometr nie ma darmowego dojazdu cena za montaż jednej kamery i puszki to 200 zł netto nauka obsługi aplikacji i instalacja aplikacji 50 zł puszki montażowe kosztują za sztukę 60 zł dwie puszki i prądowe 20 zł dwie puszki';
  $('parserTestInput').value = text;
  $('parserExpectedNet').value = '1040';
  $('parserExpectedGross').value = '1279.20';
  $('parserTestResult').innerHTML = '';
}

function runParserTest() {
  const raw = $('parserTestInput').value.trim();
  if (!raw) {
    $('parserTestResult').innerHTML = '<div class="preview-warning">Wpisz tekst do testu parsera.</div>';
    return;
  }

  const result = parseSmartCommand(raw);
  const quote = createQuoteFromParsedResult(raw, result);
  const totals = calculateTotals(quote);
  const expectedNet = $('parserExpectedNet').value.trim() === '' ? null : number($('parserExpectedNet').value);
  const expectedGross = $('parserExpectedGross').value.trim() === '' ? null : number($('parserExpectedGross').value);
  const netOk = expectedNet === null || Math.abs(totals.net - expectedNet) <= 0.01;
  const grossOk = expectedGross === null || Math.abs(totals.gross - expectedGross) <= 0.01;
  const ok = netOk && grossOk;

  $('parserTestResult').innerHTML = `
    <div class="parser-test-status ${ok ? 'ok' : 'bad'}">${ok ? 'TEST OK' : 'TEST NIEZGODNY'}</div>
    <div class="preview-block">
      <h4>Wynik testu</h4>
      <dl>
        <div><dt>Klient</dt><dd>${escapeHtml(quote.clientName || '-')}</dd></div>
        <div><dt>Adres</dt><dd>${escapeHtml(quote.clientAddress || '-')}</dd></div>
        <div><dt>Pozycji</dt><dd>${quote.services.length}</dd></div>
        <div><dt>Netto</dt><dd>${money(totals.net)}${expectedNet !== null ? ` / oczekiwano ${money(expectedNet)}` : ''}</dd></div>
        <div><dt>Brutto</dt><dd>${money(totals.gross)}${expectedGross !== null ? ` / oczekiwano ${money(expectedGross)}` : ''}</dd></div>
      </dl>
    </div>
    ${quote.services.length ? `<div class="preview-block"><h4>Pozycje</h4><div class="preview-table-wrap"><table class="preview-table"><thead><tr><th>Usługa</th><th>Ilość</th><th>Cena</th><th>Razem</th></tr></thead><tbody>${quote.services.map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${number(item.quantity, 1)} ${escapeHtml(item.unit || 'szt')}</td><td>${money(item.priceNet)}</td><td>${money(number(item.quantity, 1) * number(item.priceNet))}</td></tr>`).join('')}</tbody></table></div></div>` : '<div class="preview-muted">Parser nie wykrył pozycji.</div>'}
    ${result.unknown.length ? `<div class="preview-warning"><strong>Fragmenty niepewne:</strong><br>${result.unknown.map(escapeHtml).join('<br>')}</div>` : ''}
  `;
}

function createQuoteFromParsedResult(raw, result) {
  const quote = createEmptyQuote();
  quote.clientName = result.client.name || '';
  quote.clientPhone = result.client.phone || '';
  quote.clientAddress = result.client.address || '';
  quote.jobType = result.detectedType || 'Kamery CCTV';
  quote.notes = raw || '';
  quote.distanceKm = result.distanceKm !== null ? result.distanceKm : 0;
  quote.distanceRate = result.distanceRate !== null ? result.distanceRate : 2;
  quote.freeKm = result.freeKm !== null ? result.freeKm : 20;
  quote.services = result.items.map(item => ({ ...item, id: item.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())) }));
  return quote;
}

function clearLocalData() {
  if (!confirm('Usunąć wszystkie zapisane wyceny i ustawienia z tej przeglądarki?')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(PHRASE_DICTIONARY_KEY);
  localStorage.removeItem(LEARNED_RULES_KEY);
  localStorage.removeItem(CATALOG_KEY);
  CATALOG = loadCatalog();
  CATEGORIES = Object.keys(CATALOG);
  state = createEmptyQuote();
  syncToForm();
  renderAll();
}

async function refreshAppCache() {
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.update()));
  }
  location.reload();
}

async function installPwa() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $('installBtn').hidden = true;
}

function startDictation() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showInfo('Ta przeglądarka nie obsługuje dyktowania. Wpisz tekst ręcznie w pole dyktowania i kliknij „Rozbij tekst”.');
    return;
  }
  const recognition = new Recognition();
  recognition.lang = 'pl-PL';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $('voiceBtn').textContent = 'Słucham...';
  $('voiceBtn').disabled = true;
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    $('voiceCommand').value = ($('voiceCommand').value + ' ' + text).trim();
    analyzeVoiceCommandFromField();
  };
  recognition.onerror = () => showInfo('Nie udało się rozpoznać mowy. Możesz wpisać tekst ręcznie i kliknąć „Rozbij tekst na pozycje”.');
  recognition.onend = () => {
    $('voiceBtn').textContent = 'Dyktuj wizytę';
    $('voiceBtn').disabled = false;
  };
  recognition.start();
}

function analyzeVoiceCommandFromField() {
  const raw = $('voiceCommand').value.trim();
  if (!raw) {
    showInfo('Wpisz albo podyktuj treść, np. „klient Jan Kowalski, ulica Szymanowskiego 48 Mielec, telefon 501 222 333, 5 kamer za 200 zł”.');
    return;
  }
  syncFromForm();
  const result = parseSmartCommand(raw);
  pendingParse = { raw, result };
  renderParserPreview(raw, result);

  const detectedCount = result.items.length;
  const changedFields = countDetectedClientAndTripFields(result);
  showInfo(
    detectedCount || changedFields
      ? `Rozpoznano dane, ale jeszcze ich nie wpisano do wyceny. Sprawdź podgląd i kliknij „Zatwierdź rozbicie”. Pozycji: ${detectedCount}.`
      : 'Nie wykryłem danych klienta ani pozycji do wyceny. Dopisz tekst prościej albo wpisz dane ręcznie.'
  );
}

function countDetectedClientAndTripFields(result) {
  let count = 0;
  if (result.client.name) count += 1;
  if (result.client.phone) count += 1;
  if (result.client.address) count += 1;
  if (result.distanceKm !== null) count += 1;
  if (result.distanceRate !== null) count += 1;
  if (result.freeKm !== null) count += 1;
  if (result.detectedType) count += 1;
  return count;
}

function acceptParserPreview() {
  if (!pendingParse) {
    showInfo('Nie ma rozbicia do zatwierdzenia. Najpierw kliknij „Rozbij tekst”.');
    return;
  }
  syncFromForm();
  lastBreakdownSnapshot = structuredCloneSafe(state);
  applyParsedResult(pendingParse.raw, pendingParse.result);
  pendingParse = null;
  hideParserPreview();
  syncToForm();
  renderAll();
  $('undoParseBtn').hidden = false;
  showInfo('Zatwierdzono rozbicie i dopisano dane do wyceny. Możesz cofnąć tę operację przyciskiem „Cofnij ostatnie rozbicie”.');
}

function rejectParserPreview(showMessage = true) {
  pendingParse = null;
  hideParserPreview();
  if (showMessage) showInfo('Odrzucono rozbicie. Wycena nie została zmieniona.');
}

function undoLastBreakdown() {
  if (!lastBreakdownSnapshot) {
    showInfo('Nie ma zatwierdzonego rozbicia do cofnięcia.');
    return;
  }
  state = structuredCloneSafe(lastBreakdownSnapshot);
  lastBreakdownSnapshot = null;
  pendingParse = null;
  hideParserPreview();
  syncToForm();
  renderAll();
  $('undoParseBtn').hidden = true;
  showInfo('Cofnięto ostatnie zatwierdzone rozbicie tekstu.');
}

function applyParsedResult(raw, result) {
  if (result.client.name) state.clientName = result.client.name;
  if (result.client.phone) state.clientPhone = result.client.phone;
  if (result.client.address) state.clientAddress = result.client.address;
  if (result.distanceKm !== null) state.distanceKm = result.distanceKm;
  if (result.distanceRate !== null) state.distanceRate = result.distanceRate;
  if (result.freeKm !== null) state.freeKm = result.freeKm;
  if (result.detectedType) state.jobType = result.detectedType;
  state.notes = appendUniqueNote(state.notes, raw);
  state.services.push(...result.items.map(item => ({ ...item, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()) })));
}

function renderParserPreview(raw, result) {
  const box = $('parserPreview');
  const content = $('parserPreviewContent');
  const rows = [];
  if (result.client.name) rows.push(['Klient', result.client.name]);
  if (result.client.phone) rows.push(['Telefon', result.client.phone]);
  if (result.client.address) rows.push(['Adres', result.client.address]);
  if (result.detectedType) rows.push(['Typ zlecenia', result.detectedType]);
  if (result.distanceKm !== null) rows.push(['Dojazd', `${result.distanceKm} km`]);
  if (result.distanceRate !== null) rows.push(['Stawka za km', money(result.distanceRate)]);
  if (result.freeKm !== null) rows.push(['Darmowe km', `${result.freeKm}`]);

  const dataHtml = rows.length
    ? `<div class="preview-block"><h4>Dane do wpisania</h4><dl>${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl></div>`
    : '<div class="preview-muted">Nie wykryto nowych danych klienta ani dojazdu.</div>';

  const itemsHtml = result.items.length
    ? `<div class="preview-block"><h4>Pozycje do dodania</h4><div class="preview-table-wrap"><table class="preview-table"><thead><tr><th>Usługa</th><th>Ilość</th><th>Cena</th><th>Razem</th></tr></thead><tbody>${result.items.map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${number(item.quantity, 1)} ${escapeHtml(item.unit || 'szt')}</td><td>${money(item.priceNet)}</td><td>${money(number(item.quantity, 1) * number(item.priceNet))}</td></tr>`).join('')}</tbody></table></div></div>`
    : '<div class="preview-muted">Nie wykryto pozycji do wyceny.</div>';

  const unknownHtml = result.unknown.length
    ? `<div class="preview-warning"><strong>Fragmenty niepewne:</strong><br>${result.unknown.map(escapeHtml).join('<br>')}</div>`
    : '';
  const learnedHtml = result.learnedApplied?.length
    ? `<div class="preview-learning"><strong>Zastosowano zapamiętane korekty:</strong><br>${result.learnedApplied.map(escapeHtml).join('<br>')}</div>`
    : '';

  content.innerHTML = `${dataHtml}${itemsHtml}${learnedHtml}${unknownHtml}`;
  box.hidden = false;
}

function hideParserPreview() {
  $('parserPreview').hidden = true;
  $('parserPreviewContent').innerHTML = '';
}

function parseSmartCommand(rawText) {
  const text = normalizeSpeechText(rawText);
  const client = parseClientData(rawText, text);
  const itemText = stripClientFragmentsForItems(text);
  const items = [];
  const unknown = [];
  let distanceKm = null;
  let distanceRate = null;
  let freeKm = null;

  const distance = parseDistance(itemText);
  if (distance) {
    distanceKm = distance.km;
    if (distance.rate !== null) distanceRate = distance.rate;
  }
  const parsedFreeKm = parseFreeKm(itemText);
  if (parsedFreeKm !== null) freeKm = parsedFreeKm;

  const special = extractSpecialVoiceItems(itemText);
  items.push(...special.items);
  const suppressedKeys = new Set(special.suppressedKeys || []);

  const found = findVoiceMatches(itemText).filter(match => !suppressedKeys.has(match.rule.key));
  for (const match of found) {
    if (items.some(item => item._voiceKey === match.rule.key)) continue;
    const context = getItemContext(itemText, match.index);
    const quantityInfo = parseQuantityForRule(context, match.rule);
    const price = parsePriceNear(context, quantityInfo.unit || match.rule.unit);
    const catalog = findCatalogService(match.rule.category, match.rule.name);
    const item = buildVoiceItem({
      category: match.rule.category,
      name: match.rule.name,
      unit: quantityInfo.unit || match.rule.unit,
      quantity: quantityInfo.quantity,
      priceNet: price !== null ? price : number(catalog?.price_net, 0),
      key: match.rule.key
    });
    items.push(item);
  }

  const detectedTypes = detectTypes(itemText);
  const detectedType = items[0]?.category || detectedTypes[0] || '';
  const clauses = itemText.split(/[.;,\n]+|\s+oraz\s+/).map(x => x.trim()).filter(Boolean);
  for (const clause of clauses) {
    const hasKnown = found.some(match => clause.includes(match.keyword)) || special.usedFragments.some(fragment => clause.includes(fragment));
    const looksLikePrice = /\d+[,.]?\d*\s*(zł|zl|pln|m|mb|km|szt|godz)/i.test(clause);
    if (!hasKnown && looksLikePrice && !/dojazd/.test(clause)) unknown.push(clause);
  }

  const learnedApplied = applyLearnedCorrections(rawText, items);
  for (const item of items) delete item._voiceKey;
  return { client, items, detectedType, distanceKm, distanceRate, freeKm, unknown, learnedApplied };
}

function buildVoiceItem({ category, name, unit, quantity, priceNet, key }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    category,
    name,
    unit,
    quantity: number(quantity, 1),
    priceNet: number(priceNet, 0),
    _voiceKey: key || name
  };
}

function extractSpecialVoiceItems(text) {
  const items = [];
  const suppressedKeys = new Set();
  const usedFragments = [];

  const cameraBoxCombo = text.match(/(?:cena\s+za\s+)?(?:montaz|instalacj\w*)\s+(?:\d+(?:[.]\d+)?\s+)?(?:1\s+|jednej\s+)?kamer\w*\s+(?:i|z|plus)\s+puszk\w*(?:\s+to)?\s*(\d+(?:[.]\d+)?)\s*zł(?:\s+netto)?/i);
  if (cameraBoxCombo) {
    const qty = extractCameraQuantity(text) || 1;
    items.push(buildVoiceItem({
      category: 'Kamery CCTV',
      name: 'Montaż kamery IP z puszką',
      unit: 'szt',
      quantity: qty,
      priceNet: number(cameraBoxCombo[1]),
      key: 'camera_box_combo'
    }));
    suppressedKeys.add('camera');
    suppressedKeys.add('box_holder');
    usedFragments.push(cameraBoxCombo[0]);
  }

  const appService = text.match(/(?:nauka\s+obslugi\s+aplikacji(?:\s+i\s+instalacja\s+aplikacji)?|instalacja\s+aplikacji(?:\s+i\s+nauka\s+obslugi)?)\s*(?:po|za|to|kosztuje|kosztuja)?\s*(\d+(?:[.]\d+)?)\s*zł/i);
  if (appService) {
    items.push(buildVoiceItem({
      category: 'Serwis',
      name: 'Nauka obsługi i instalacja aplikacji',
      unit: 'usł',
      quantity: 1,
      priceNet: number(appService[1]),
      key: 'app_training'
    }));
    suppressedKeys.add('app_training');
    usedFragments.push(appService[0]);
  }

  const mountingBoxes = parseBoxMaterial(text, 'montaz', 'Puszka montażowa pod kamerę', 'mounting_box_material');
  if (mountingBoxes) {
    items.push(mountingBoxes);
    suppressedKeys.add('box_holder');
    usedFragments.push('puszk');
  }

  const electricalBoxes = parseBoxMaterial(text, 'prad', 'Puszka prądowa', 'electrical_box');
  if (electricalBoxes) {
    items.push(electricalBoxes);
    suppressedKeys.add('electrical_box');
    usedFragments.push('prad');
  }

  return { items, suppressedKeys: [...suppressedKeys], usedFragments };
}

function parseBoxMaterial(text, typeRoot, name, key) {
  const variants = typeRoot === 'montaz'
    ? '(?:puszk\\w*\\s+montaz\\w*|montaz\\w*\\s+puszk\\w*)'
    : '(?:puszk\\w*\\s+prad\\w*|prad\\w*)';
  const patterns = [
    new RegExp(`${variants}.*?(?:po|za|za\\s+sztuke|kosztuja\\s+za\\s+sztuke|kosztuje\\s+za\\s+sztuke)?\\s*(\\d+(?:[.]\\d+)?)\\s*zł.*?(\\d+(?:[.]\\d+)?)\\s+puszk`, 'i'),
    new RegExp(`(\\d+(?:[.]\\d+)?)\\s+${variants}.*?(?:po|za|za\\s+sztuke|kosztuja\\s+za\\s+sztuke|kosztuje\\s+za\\s+sztuke)?\\s*(\\d+(?:[.]\\d+)?)\\s*zł`, 'i')
  ];
  for (let i = 0; i < patterns.length; i += 1) {
    const match = text.match(patterns[i]);
    if (!match) continue;
    const quantity = i === 0 ? number(match[2], 1) : number(match[1], 1);
    const price = i === 0 ? number(match[1], 0) : number(match[2], 0);
    if (quantity > 0 && price >= 0) {
      return buildVoiceItem({ category: 'Kamery CCTV', name, unit: 'szt', quantity, priceNet: price, key });
    }
  }
  return null;
}

function extractCameraQuantity(text) {
  const patterns = [
    /(\d+(?:[.]\d+)?)\s*(?:szt\s*)?(?:kamer\w*|kamery|kamera)\b/i,
    /(?:instalacj\w*|montaz|montowal|montował|montuje|zakladam|zakładam)\s+(\d+(?:[.]\d+)?)\s*(?:szt\s*)?(?:kamer\w*|kamery|kamera)\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return number(match[1], 1);
  }
  return null;
}

function stripClientFragmentsForItems(text) {
  let out = ` ${String(text || '')} `;
  const serviceStartWords = '(?:montaż|montaz|instalacja|instalacje|instalację|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45|nauka)';
  const quantityServiceWords = '(?:kamera|kamery|kamer|kabel|przewód|przewod|rejestrator|router|domofon|wideodomofon|alarm|czujka|czujki|pilot|pilotów|pilotow|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45)';

  out = out.replace(/(?:^|\s)(?:telefon|tel|numer telefonu|komórka|komorka)\s*(?:to\s+|jest\s+)?(?:\+?48\s*)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}(?=\s|$)/gi, ' ');
  out = out.replace(/^\s*.*?(?=\s+(?:ul\.?|ulica|adres|przy ulicy|na adres|pod adresem)\s+)/i, ' ');
  out = out.replace(new RegExp('(?:^|\\s)(?:miejscowość|miejscowosc)\\s+\\S+(?=\\s+(?:' + serviceStartWords + '|telefon|tel|adres|ulica|ul\\.?)(?=\\s|$)|$)', 'gi'), ' ');
  out = out.replace(new RegExp('(?:^|\\s)(?:adres|ulica|ul\\.?|przy ulicy|na adres|pod adresem)\\s+.*?(?=\\s+(?:miejscowość|miejscowosc|telefon|tel|klient|klientka|imię|imie|nazwisko|' + serviceStartWords + ')(?=\\s|$)|$)', 'gi'), ' ');
  out = out.replace(new RegExp('(?:^|\\s)(?:imię i nazwisko|imie i nazwisko|imię nazwisko|imie nazwisko|miej nazwisko|klientka|klient|u klienta|u klientki|pan|pani|nazwisko|imię|imie)\\s+.*?(?=\\s+(?:adres|ulica|ul\\.?|telefon|tel|' + serviceStartWords + ')(?=\\s|$)|$)', 'gi'), ' ');
  return out.replace(/\s+/g, ' ').trim();
}

function parseClientData(rawText, normalizedText) {
  const raw = cleanDictationSpaces(rawText);
  return {
    name: parseClientName(raw),
    phone: parseClientPhone(raw),
    address: parseClientAddress(raw, normalizedText)
  };
}

function parseClientName(rawText) {
  const compact = cleanDictationSpaces(rawText);
  const patterns = [
    /(?:imię\s+i\s+nazwisko|imie\s+i\s+nazwisko|imię\s+nazwisko|imie\s+nazwisko|miej\s+nazwisko|klientka|klient|u\s+klienta|u\s+klientki|pan|pani|nazwisko|imię|imie)\s+(?:to\s+|jest\s+)?([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-']*(?:\s+[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-']*){0,4})/i,
    /(?:dla|do)\s+([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-']+\s+[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-']+)/i
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (!match) continue;
    const name = cleanNameFragment(match[1]);
    if (name) return name;
  }

  const beforeAddress = compact.match(/^(.{3,100}?)(?=\s+(?:(?:miejscowość|miejscowosc)\s+\S+\s+)?(?:ul\.?|ulica|adres|przy ulicy|na adres|pod adresem)\s+)/i);
  if (beforeAddress) {
    const name = cleanNameFragment(beforeAddress[1]);
    if (isLikelyPersonName(name)) return name;
  }

  const beforeService = compact.match(/^(.{3,80}?)(?=\s+(?:telefon|tel|montaż|montaz|instalacja|będę|bede|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|puszka|puszki)\b)/i);
  if (beforeService) {
    const name = cleanNameFragment(beforeService[1]);
    if (isLikelyPersonName(name)) return name;
  }

  return '';
}

function parseClientPhone(rawText) {
  const explicit = rawText.match(/(?:telefon|tel\.?|numer\s+telefonu|komórka|komorka)\s*(?:to\s+|jest\s+|:)?((?:\+?48)?[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})/i);
  if (explicit) return formatPhone(explicit[1]);

  const generic = rawText.match(/(?:^|\s)((?:\+?48)?[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})(?=\s|$|,|\.)/);
  if (!generic) return '';
  const before = rawText.slice(Math.max(0, generic.index - 18), generic.index).toLowerCase();
  if (/zł|zl|pln|metr|metrow|m\s*$|km|kamera|kamery|kabel/.test(before)) return '';
  return formatPhone(generic[1]);
}

function parseClientAddress(rawText, normalizedText) {
  const compact = cleanDictationSpaces(rawText);
  const city = parseCity(compact);
  const explicitStreet = compact.match(/(?:adres|ulica|ul\.?|przy\s+ulicy)\s+(.{3,140})/i);
  if (explicitStreet) {
    const rawAddress = cutAtAddressStop(explicitStreet[1]);
    const cityFromAddress = findKnownCityInText(rawAddress);
    const address = cleanAddressFragment(removeKnownCityFromAddress(rawAddress), true);
    return joinAddressAndCity(address, city || cityFromAddress);
  }

  const namedAddress = compact.match(/(?:na\s+adres|pod\s+adresem)\s+(.{3,140})/i);
  if (namedAddress) {
    const rawAddress = cutAtAddressStop(namedAddress[1]);
    const cityFromAddress = findKnownCityInText(rawAddress);
    const address = cleanAddressFragment(removeKnownCityFromAddress(rawAddress), false);
    return joinAddressAndCity(address, city || cityFromAddress);
  }

  const cityBeforeStreet = compact.match(new RegExp('(?:^|\\s)(' + KNOWN_CITIES.join('|') + ')\\s+(?:ul\\.?|ulica)\\s+(.{3,100})', 'i'));
  if (cityBeforeStreet) {
    const address = cleanAddressFragment(cutAtAddressStop(cityBeforeStreet[2]), true);
    return joinAddressAndCity(address, city || titleCase(cityBeforeStreet[1]));
  }

  const cityAddress = compact.match(/([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]+\s+\d+[a-zA-Z]?\/?\d*\s+(?:Mielec|Tarnów|Tarnow|Rzeszów|Rzeszow|Dębica|Debica|Kolbuszowa|Przecław|Przeclaw|Radomyśl|Radomysl)[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]*)/i);
  if (cityAddress) return cleanAddressFragment(cutAtAddressStop(cityAddress[1]), false);

  return '';
}

function parseCity(text) {
  const explicit = String(text || '').match(/(?:miejscowość|miejscowosc|miasto)\s+([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-]+)/i);
  if (explicit) return titleCase(explicit[1]);
  const beforeStreet = String(text || '').match(new RegExp('(?:^|\\s)(' + KNOWN_CITIES.join('|') + ')\\s+(?:ul\\.?|ulica)\\s+', 'i'));
  if (beforeStreet) return titleCase(beforeStreet[1]);
  return '';
}

function findKnownCityInText(text) {
  const lower = String(text || '').toLowerCase();
  const found = KNOWN_CITIES.find(city => new RegExp(`\\b${escapeRegExp(city)}\\b`, 'i').test(lower));
  return found ? titleCase(found) : '';
}

function removeKnownCityFromAddress(text) {
  let out = String(text || '');
  for (const city of KNOWN_CITIES) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(city)}\\b`, 'ig'), ' ');
  }
  return out.replace(/\s+/g, ' ').trim();
}

function joinAddressAndCity(address, city) {
  const cleanAddress = String(address || '').trim();
  const cleanCity = String(city || '').trim();
  if (!cleanAddress) return cleanCity;
  if (!cleanCity) return cleanAddress;
  if (cleanAddress.toLowerCase().includes(cleanCity.toLowerCase())) return cleanAddress;
  return `${cleanAddress}, ${cleanCity}`;
}

function cleanDictationSpaces(text) {
  return String(text || '')
    .replace(/[\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

function cutAtAddressStop(text) {
  let out = ` ${String(text || '')} `;

  // Nie wolno ucinać numeru domu. Poprzednia wersja brała „48 montaż”
  // jako ilość usługi i zostawiała samo „ul. Szymanowskiego”.
  const serviceStart = out.match(/\s+(?:montaż|montaz|instalacja|instalację|instalacje|będę|bede|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45)(?=\s|$)/i);
  if (serviceStart) out = out.slice(0, serviceStart.index + 1);

  for (const stop of ADDRESS_STOP_WORDS) {
    const re = new RegExp(`\\s+(?:i\\s+)?${escapeRegExp(stop)}(?=\\s|$)`, 'i');
    const match = out.match(re);
    if (match) out = out.slice(0, match.index + 1);
  }
  return out.replace(/[,. ;:]+$/g, '').trim();
}

function cleanNameFragment(fragment) {
  let text = String(fragment || '').replace(/[,. ;:]+$/g, ' ').replace(/\s+/g, ' ').trim();
  for (const stop of CLIENT_FIELD_STOP_WORDS) {
    const re = new RegExp(`\\s+(?:i\\s+)?${escapeRegExp(stop)}(?=\\s|$).*$`, 'i');
    text = text.replace(re, '').trim();
  }
  text = text.replace(/\b(i|oraz|tak|dalej|to|jest|będzie|bedzie)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  let words = text.split(' ').filter(Boolean).filter(word => !/\d/.test(word));
  while (words.length > 2 && KNOWN_CITIES.includes(words[words.length - 1].toLowerCase())) words.pop();
  words = words.slice(0, 3);
  if (!words.length) return '';
  return titleCase(words.join(' '));
}

function isLikelyPersonName(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  if (words.some(word => /\d/.test(word))) return false;
  const lower = words.join(' ').toLowerCase();
  if (CLIENT_FIELD_STOP_WORDS.some(stop => lower.includes(stop))) return false;
  return true;
}

function cleanAddressFragment(fragment, forceStreetPrefix) {
  let text = String(fragment || '')
    .replace(/\b(to|jest|będzie|bedzie)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[,. ;:]+$/g, '')
    .trim();
  if (!text) return '';
  text = titleCase(text);
  if (forceStreetPrefix && !/^ul\.?\s/i.test(text)) text = `ul. ${text}`;
  return text;
}

function titleCase(text) {
  return String(text || '').split(/\s+/).filter(Boolean).map(word => {
    if (/^\d/.test(word)) return word;
    if (/^(ul\.?|nr)$/i.test(word)) return word.toLowerCase().replace(/^ul$/, 'ul.');
    return word.charAt(0).toLocaleUpperCase('pl-PL') + word.slice(1).toLocaleLowerCase('pl-PL');
  }).join(' ');
}

function formatPhone(text) {
  let digits = String(text || '').replace(/\D+/g, '');
  if (digits.startsWith('48') && digits.length === 11) digits = digits.slice(2);
  if (digits.length < 9) return '';
  digits = digits.slice(0, 9);
  return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

function appendUniqueNote(existing, note) {
  const current = String(existing || '').trim();
  const next = String(note || '').trim();
  if (!next) return current;
  if (!current) return next;
  if (current.includes(next)) return current;
  return `${current}\n${next}`;
}

function normalizeSpeechText(text) {
  return applyPhraseDictionary(baseNormalizeSpeechText(text));
}

function baseNormalizeSpeechText(text) {
  let out = String(text || '').toLowerCase();
  out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  out = out.replace(/,/g, '.');
  out = out.replace(/zlotych|złotych|zloty|złoty|złote|zlote|pln/g, 'zł');
  out = out.replace(/\bkilometrów\b|\bkilometry\b|\bkilometrow\b|\bkilometra\b|\bkilometr\b/g, 'km');
  out = out.replace(/\bmetrów\b|\bmetry\b|\bmetrow\b|\bmetra\b|\bmetr\b/g, 'm');
  out = out.replace(/sztuk|sztuki|sztukę|sztuke/g, 'szt');
  out = out.replace(/godzinę|godzine|godziny|godzin/g, 'godz');
  for (const [word, value] of Object.entries(POLISH_NUMBER_WORDS)) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g'), String(value));
  }
  return out.replace(/\s+/g, ' ').trim();
}

function applyPhraseDictionary(text) {
  let out = String(text || '');
  for (const rule of parsePhraseDictionary(loadPhraseDictionaryText())) {
    const from = baseNormalizeSpeechText(rule.from);
    const to = baseNormalizeSpeechText(rule.to);
    if (!from || !to || from === to) continue;
    out = out.replace(new RegExp(`(^|\\s)${escapeRegExp(from)}(?=\\s|$)`, 'g'), `$1${to}`);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function findVoiceMatches(text) {
  const matches = [];
  for (const rule of VOICE_ITEM_RULES) {
    let best = null;
    for (const keyword of rule.keywords) {
      const re = new RegExp(`\\b${escapeRegExp(keyword)}[a-ząćęłńóśźż-]*\\b`, 'i');
      const m = text.match(re);
      if (!m) continue;
      if (!best || m.index < best.index) best = { rule, keyword: m[0], index: m.index };
    }
    if (best) matches.push(best);
  }
  return matches.sort((a, b) => a.index - b.index);
}


function getItemContext(text, index) {
  const before = text.slice(0, index);
  const after = text.slice(index);
  const separator = /[,;.\n]|\s+i\s+|\s+oraz\s+|\s+plus\s+|\s+\d+(?:[.]\d+)?\s*zł\s+(?:za\s+)?(?:m|mb|metr|km|szt)\s+/gi;
  const startMatches = [...before.matchAll(separator)];
  let lastStart = startMatches.length ? startMatches[startMatches.length - 1].index + startMatches[startMatches.length - 1][0].length : Math.max(0, index - 45);
  const prefix = text.slice(lastStart, index);
  if (/zł\s*$/i.test(prefix) || /zł\s+\w{0,12}\s*$/i.test(prefix)) lastStart = index;
  const endMatch = after.match(/[,;.\n]|\s+i\s+|\s+oraz\s+|\s+plus\s+|\s+dojazd\b|\s+cena\s+za\b|\s+nauka\s+|\s+\d+(?:[.]\d+)?\s*(?:puszk|kabel|przewod|przewód|kamer|kamery|kamera)\b/i);
  const end = endMatch ? index + endMatch.index : Math.min(text.length, index + 95);
  return text.slice(lastStart, end).trim();
}

function getContextWindow(text, index, before, after) {
  const start = Math.max(0, index - before);
  const end = Math.min(text.length, index + after);
  return text.slice(start, end);
}

function parseQuantityForRule(context, rule) {
  const keywordPattern = rule.keywords.map(escapeRegExp).join('|');
  const num = '(\\d+(?:[.]\\d+)?)';
  const unitPattern = '(m|mb|szt|godz|h|km)';
  const patterns = [
    new RegExp(`${num}\\s*${unitPattern}\\s+(?:\\w+\\s+){0,3}(?:${keywordPattern})`, 'i'),
    new RegExp(`${num}\\s*(?:szt)?\\s+(?:\\w+\\s+){0,3}(?:${keywordPattern})`, 'i'),
    new RegExp(`(?:${keywordPattern})\\w*(?:\\s+\\w+){0,4}?\\s+${num}(?![\\d.]|\\s*zł)\\s*${unitPattern}?`, 'i')
  ];
  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (!match) continue;
    const quantity = number(match[1], 1);
    const unit = normalizeUnit(match[2] || rule.unit, rule.unit);
    if (quantity > 0) return { quantity, unit };
  }
  return { quantity: 1, unit: rule.unit };
}

function parsePriceNear(context, unit) {
  const pricePatterns = unit === 'mb' || unit === 'm'
    ? [
        /(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:m|mb|metr)/i,
        /(?:po|za)\s*(\d+(?:[.]\d+)?)\s*zł/i,
        /(\d+(?:[.]\d+)?)\s*zł/i
      ]
    : [
        /(?:po|za)\s*(\d+(?:[.]\d+)?)\s*zł/i,
        /(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:szt|godz|usł|usl|komplet)?/i
      ];
  for (const pattern of pricePatterns) {
    const match = context.match(pattern);
    if (match) return number(match[1]);
  }
  return null;
}

function parseDistance(text) {
  const patterns = [
    /dojazd\s+(\d+(?:[.]\d+)?)\s*km(?:\s*(?:po|za)?\s*(\d+(?:[.]\d+)?)\s*zł(?:\s*(?:za|\/)?\s*(?:km|kilometr|kilometrów|kilometrow))?)?/i,
    /(\d+(?:[.]\d+)?)\s*km\s+dojazd\w*(?:\s*(?:po|za)?\s*(\d+(?:[.]\d+)?)\s*zł)?/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return { km: number(match[1]), rate: match[2] ? number(match[2]) : null };
  }
  return null;
}

function parseFreeKm(text) {
  if (/\b(?:nie\s+ma|bez|brak|zero|0)\s+(?:darmowego|bezplatnego|bezpłatnego)\s+dojazdu\b/i.test(text)) return 0;
  if (/\b(?:bez|brak|zero|0)\s+(?:darmowych|bezplatnych|bezpłatnych)\s+(?:kilometr\w*|km)\b/i.test(text)) return 0;
  if (/\b(?:nie\s+licz|nie\s+liczyc|cały|caly)\s+(?:darmowego\s+)?dojazd\w*\b/i.test(text)) return 0;
  if (/\bdojazd\s+(?:bez|brak|zero|0)\s+(?:darmowych|bezplatnych|bezpłatnych)\s+km\b/i.test(text)) return 0;
  if (/\b(?:dojazd\s+)?(?:płatny|platny)\s+od\s+0\s*km\b/i.test(text)) return 0;
  const match = text.match(/(?:darmow\w*|bezplatn\w*|bezpłatn\w*)\s+(\d+(?:[.]\d+)?)\s*km/i);
  if (match) return number(match[1], 0);
  return null;
}

function normalizeUnit(unit, fallback) {
  const value = String(unit || fallback || '').toLowerCase();
  if (['m', 'mb'].includes(value)) return 'mb';
  if (['godz', 'h'].includes(value)) return 'godz';
  if (value === 'km') return 'km';
  if (value === 'szt') return 'szt';
  return fallback || 'szt';
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showInfo(text) {
  const box = $('parserInfo');
  box.textContent = text;
  box.hidden = false;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFileName(text) {
  return String(text).replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

document.addEventListener('DOMContentLoaded', init);
