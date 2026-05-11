const APP_VERSION = '1.3.0';
const STORAGE_KEY = 'pomocnik-instalatora-pwa-v1-quotes';
const SETTINGS_KEY = 'pomocnik-instalatora-pwa-v1-settings';
const CATALOG = window.PRICE_CATALOG || {};
const CATEGORIES = Object.keys(CATALOG);

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
  { key: 'remote_preview', category: 'Kamery CCTV', name: 'Uruchomienie podglądu zdalnego', unit: 'usł', keywords: ['podgląd', 'podglad', 'aplikacja', 'telefonie'] },
  { key: 'cable_lan', category: 'Kamery CCTV', name: 'Prowadzenie skrętki zewnętrznej', unit: 'mb', keywords: ['kabel', 'kabla', 'przewód', 'przewodu', 'skrętka', 'skretka', 'lan', 'utp'] },
  { key: 'rj45', category: 'Sieć / Wi‑Fi', name: 'Zarabianie końcówki RJ45', unit: 'szt', keywords: ['rj45', 'wtyk', 'wtyki', 'końcówka', 'koncowka', 'końcówki', 'koncowki'] },
  { key: 'fplug', category: 'Anteny / Sygnał', name: 'Zarabianie złącza F', unit: 'szt', keywords: ['złącze f', 'zlacze f', 'końcówka f', 'koncowka f', 'fka', 'f-ki'] },
  { key: 'antenna', category: 'Anteny / Sygnał', name: 'Montaż anteny DVB-T', unit: 'szt', keywords: ['antena', 'anteny', 'dvb', 'satelitarna'] },
  { key: 'router', category: 'Sieć / Wi‑Fi', name: 'Konfiguracja routera', unit: 'szt', keywords: ['router', 'routera'] },
  { key: 'wifi', category: 'Sieć / Wi‑Fi', name: 'Test i optymalizacja Wi‑Fi', unit: 'usł', keywords: ['wifi', 'wi-fi', 'zasięg', 'zasieg'] },
  { key: 'switch_poe', category: 'Kamery CCTV', name: 'Switch PoE 4-port', unit: 'szt', keywords: ['switch', 'poe'] },
  { key: 'disk', category: 'Kamery CCTV', name: 'Montaż dysku do rejestratora', unit: 'szt', keywords: ['dysk', 'dysku', 'hdd'] },
  { key: 'box_holder', category: 'Kamery CCTV', name: 'Montaż puszki / uchwytu kamery', unit: 'szt', keywords: ['puszka', 'puszki', 'uchwyt', 'uchwyty'] },
  { key: 'domofon', category: 'Domofon', name: 'Montaż wideodomofonu 1-rodzinnego', unit: 'szt', keywords: ['domofon', 'wideodomofon', 'unifon'] },
  { key: 'alarm_sensor', category: 'Alarm', name: 'Montaż czujki PIR', unit: 'szt', keywords: ['czujka', 'czujki', 'pir'] },
  { key: 'gate_remote', category: 'Automatyka bram', name: 'Programowanie pilotów', unit: 'szt', keywords: ['pilot', 'pilota', 'pilotów', 'pilotow'] },
  { key: 'labor', category: 'Serwis', name: 'Robocizna', unit: 'godz', keywords: ['robocizna', 'praca', 'godzina', 'godziny', 'godzin'] },
  { key: 'service', category: 'Serwis', name: 'Diagnostyka / serwis', unit: 'godz', keywords: ['serwis', 'diagnostyka', 'naprawa'] }
];

const POLISH_NUMBER_WORDS = {
  'zero': 0, 'jeden': 1, 'jedna': 1, 'jedno': 1, 'dwa': 2, 'dwie': 2, 'trzy': 3, 'cztery': 4,
  'pięć': 5, 'piec': 5, 'sześć': 6, 'szesc': 6, 'siedem': 7, 'osiem': 8, 'dziewięć': 9, 'dziewiec': 9,
  'dziesięć': 10, 'dziesiec': 10, 'jedenaście': 11, 'jedenascie': 11, 'dwanaście': 12, 'dwanascie': 12,
  'trzynaście': 13, 'trzynascie': 13, 'czternaście': 14, 'czternascie': 14, 'piętnaście': 15, 'pietnascie': 15,
  'dwadzieścia': 20, 'dwadziescia': 20, 'trzydzieści': 30, 'trzydziesci': 30, 'czterdzieści': 40, 'czterdziesci': 40,
  'pięćdziesiąt': 50, 'piecdziesiat': 50, 'sto': 100
};

const CLIENT_FIELD_STOP_WORDS = [
  'telefon', 'tel', 'numer', 'adres', 'ulica', 'ul', 'klient', 'klientka', 'imię', 'imie', 'nazwisko',
  'montaż', 'montaz', 'kamera', 'kamery', 'kamer', 'kabel', 'przewód', 'przewod', 'dojazd', 'robocizna',
  'rejestrator', 'router', 'domofon', 'wideodomofon', 'alarm', 'czujka', 'pilot', 'anteny', 'antena', 'puszka', 'puszki', 'uchwyt', 'uchwyty', 'ip', 'cctv'
];

const ADDRESS_STOP_WORDS = [
  'telefon', 'tel', 'numer telefonu', 'klient', 'klientka', 'imię', 'imie', 'nazwisko', 'montaż', 'montaz',
  'kamera', 'kamery', 'kamer', 'kabel', 'przewód', 'przewod', 'dojazd', 'robocizna', 'rejestrator',
  'router', 'domofon', 'wideodomofon', 'alarm', 'czujka', 'pilot', 'antena', 'anteny', 'puszka', 'puszki', 'uchwyt', 'uchwyty', 'ip', 'cctv'
];

let state = createEmptyQuote();
let deferredInstallPrompt = null;

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
  return { companyName: 'Moja Firma Instalacyjna', vatRate: 23 };
}

function loadSettings() {
  try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return defaultSettings(); }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadQuotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveQuotes(quotes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
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
  fillSelect($('jobType'), CATEGORIES);
  fillSelect($('categorySelect'), CATEGORIES);
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
  $('saveSettingsBtn').addEventListener('click', saveSettingsFromForm);
  $('clearDataBtn').addEventListener('click', clearLocalData);
  $('exportBackupBtn').addEventListener('click', exportBackup);
  $('refreshAppBtn').addEventListener('click', refreshAppCache);
  $('installBtn').addEventListener('click', installPwa);
  $('voiceBtn').addEventListener('click', startDictation);
  $('analyzeVoiceBtn').addEventListener('click', analyzeVoiceCommandFromField);
  $('clearVoiceBtn').addEventListener('click', () => { $('voiceCommand').value = ''; });
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

function updateLine(id, field, value) {
  const row = state.services.find(item => item.id === id);
  if (!row) return;
  row[field] = field === 'quantity' || field === 'priceNet' ? number(value) : value;
  renderSummary();
  renderServices(false);
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
  if (detected[0]) {
    state.jobType = detected[0];
    syncToForm();
  }
  const added = state.services.length - before;
  showInfo(added ? `Dodano ${added} podpowiedziane pozycje. Wykryte typy: ${types.join(', ')}.` : 'Nie dodano nowych pozycji — podobne usługi już są w wycenie.');
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
}

function renderServices(full = true) {
  const body = $('servicesBody');
  if (full) body.innerHTML = '';
  $('emptyServices').classList.toggle('visible', state.services.length === 0);

  if (!full) {
    [...body.querySelectorAll('tr')].forEach(row => {
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
  }

  body.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => updateLine(input.closest('tr').dataset.id, input.dataset.field, input.value));
    input.addEventListener('input', () => updateLine(input.closest('tr').dataset.id, input.dataset.field, input.value));
  });
  body.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => removeService(button.dataset.remove));
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
  const quotes = loadQuotes();
  state.updatedAt = new Date().toISOString();
  const idx = quotes.findIndex(item => item.id === state.id);
  if (idx >= 0) quotes[idx] = structuredCloneSafe(state);
  else quotes.unshift(structuredCloneSafe(state));
  saveQuotes(quotes);
  renderSavedQuotes();
  showInfo('Wycena zapisana lokalnie w tej przeglądarce.');
}

function newQuote() {
  state = createEmptyQuote();
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
  syncToForm();
  renderAll();
  document.querySelector('[data-tab="quoteTab"]').click();
}

function deleteQuote(id) {
  if (!confirm('Usunąć tę wycenę?')) return;
  saveQuotes(loadQuotes().filter(item => item.id !== id));
  renderSavedQuotes();
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
      row.innerHTML = `<div>${escapeHtml(item.name)}</div><div>${escapeHtml(item.unit)}</div><div class="price">${money(item.price_net)}</div><button class="btn btn-soft">Dodaj</button>`;
      row.querySelector('button').addEventListener('click', () => {
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
      group.appendChild(row);
    }
    container.appendChild(group);
  }
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
  const payload = { app: 'Pomocnik Instalatora PWA', version: APP_VERSION, exportedAt: new Date().toISOString(), settings: loadSettings(), quotes: loadQuotes() };
  downloadFile(`pomocnik_instalatora_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
}

function saveSettingsFromForm() {
  saveSettings({ companyName: $('companyName').value.trim() || 'Moja Firma Instalacyjna', vatRate: number($('vatRate').value, 23) });
  renderSummary();
  showInfo('Ustawienia zapisane.');
}

function clearLocalData() {
  if (!confirm('Usunąć wszystkie zapisane wyceny i ustawienia z tej przeglądarki?')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
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

  if (result.client.name) state.clientName = result.client.name;
  if (result.client.phone) state.clientPhone = result.client.phone;
  if (result.client.address) state.clientAddress = result.client.address;
  if (result.distanceKm !== null) state.distanceKm = result.distanceKm;
  if (result.distanceRate !== null) state.distanceRate = result.distanceRate;
  if (result.detectedType) state.jobType = result.detectedType;

  state.notes = appendUniqueNote(state.notes, raw);
  state.services.push(...result.items);
  syncToForm();
  renderAll();

  const infoParts = [];
  if (result.client.name) infoParts.push(`klient: ${result.client.name}`);
  if (result.client.address) infoParts.push(`adres: ${result.client.address}`);
  if (result.client.phone) infoParts.push(`telefon: ${result.client.phone}`);
  if (result.items.length) infoParts.push(`dodano pozycji: ${result.items.length}`);
  if (result.distanceKm !== null) infoParts.push(`ustawiono dojazd: ${result.distanceKm} km`);
  if (result.unknown.length) infoParts.push(`niepewne fragmenty: ${result.unknown.join(', ')}`);

  showInfo(infoParts.length ? `Wykryto i wpisano: ${infoParts.join('. ')}.` : 'Nie wykryłem danych klienta ani pozycji do wyceny. Dopisz tekst prościej albo wpisz dane ręcznie.');
}

function parseSmartCommand(rawText) {
  const text = normalizeSpeechText(rawText);
  const client = parseClientData(rawText, text);
  const itemText = stripClientFragmentsForItems(text);
  const found = findVoiceMatches(itemText);
  const items = [];
  const unknown = [];
  let distanceKm = null;
  let distanceRate = null;

  const distance = parseDistance(itemText);
  if (distance) {
    distanceKm = distance.km;
    if (distance.rate !== null) distanceRate = distance.rate;
  }

  for (const match of found) {
    if (items.some(item => item._voiceKey === match.rule.key)) continue;
    const context = getItemContext(itemText, match.index);
    const quantityInfo = parseQuantityForRule(context, match.rule);
    const price = parsePriceNear(context, quantityInfo.unit || match.rule.unit);
    const catalog = findCatalogService(match.rule.category, match.rule.name);
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      category: match.rule.category,
      name: match.rule.name,
      unit: quantityInfo.unit || match.rule.unit,
      quantity: quantityInfo.quantity,
      priceNet: price !== null ? price : number(catalog?.price_net, 0),
      _voiceKey: match.rule.key
    };
    items.push(item);
  }

  const detectedTypes = detectTypes(itemText);
  const detectedType = items[0]?.category || detectedTypes[0] || '';
  const clauses = itemText.split(/[.;,\n]+|\s+oraz\s+/).map(x => x.trim()).filter(Boolean);
  for (const clause of clauses) {
    const hasKnown = found.some(match => clause.includes(match.keyword));
    const looksLikePrice = /\d+[,.]?\d*\s*(zł|zl|pln|m|mb|km|szt|godz)/i.test(clause);
    if (!hasKnown && looksLikePrice && !/dojazd/.test(clause)) unknown.push(clause);
  }

  for (const item of items) delete item._voiceKey;
  return { client, items, detectedType, distanceKm, distanceRate, unknown };
}

function stripClientFragmentsForItems(text) {
  let out = ` ${String(text || '')} `;
  const serviceStartWords = '(?:montaż|montaz|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45)';
  const quantityServiceWords = '(?:kamera|kamery|kamer|kabel|przewód|przewod|rejestrator|router|domofon|wideodomofon|alarm|czujka|czujki|pilot|pilotów|pilotow|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45)';

  out = out.replace(/(?:^|\s)(?:telefon|tel|numer telefonu|komórka|komorka)\s*(?:to\s+|jest\s+)?(?:\+?48\s*)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}(?=\s|$)/gi, ' ');

  // Usuń imię i nazwisko podane na początku bez słowa „klient”, np.
  // „Bogusław Biernacki ul. Szymanowskiego 48 montaż 4 kamer”.
  out = out.replace(/^\s*[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ]+\s+[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ]+(?=\s+(?:ul\.?|ulica|adres|przy ulicy|na adres|pod adresem)\s+)/i, ' ');

  out = out.replace(new RegExp('(?:^|\\s)(?:adres|ulica|ul\\.?|przy ulicy|na adres|pod adresem)\\s+.*?(?=\\s+(?:telefon|tel|klient|klientka|imię|imie|nazwisko|' + serviceStartWords + '|\\d+[.,]?\\d*\\s+' + quantityServiceWords + ')(?=\\s|$)|$)', 'gi'), ' ');
  out = out.replace(new RegExp('(?:^|\\s)(?:imię i nazwisko|imie i nazwisko|imię nazwisko|imie nazwisko|miej nazwisko|klientka|klient|u klienta|u klientki|pan|pani|nazwisko|imię|imie)\\s+.*?(?=\\s+(?:adres|ulica|ul\\.?|telefon|tel|' + serviceStartWords + '|\\d+[.,]?\\d*\\s+' + quantityServiceWords + ')(?=\\s|$)|$)', 'gi'), ' ');
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

  // Dyktowanie w praktyce często zaczyna się od samego imienia i nazwiska,
  // np. „Bogusław Biernacki ul. Szymanowskiego 48 montaż 4 kamer”.
  const beforeAddress = compact.match(/^(.{3,80}?)(?=\s+(?:ul\.?|ulica|adres|przy ulicy|na adres|pod adresem)\s+)/i);
  if (beforeAddress) {
    const name = cleanNameFragment(beforeAddress[1]);
    if (isLikelyPersonName(name)) return name;
  }

  const beforeService = compact.match(/^(.{3,80}?)(?=\s+(?:telefon|tel|montaż|montaz|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|puszka|puszki)\b)/i);
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
  const patterns = [
    /(?:adres|ulica|ul\.?|przy\s+ulicy)\s+(.{3,120})/i,
    /(?:na\s+adres|pod\s+adresem)\s+(.{3,120})/i
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (!match) continue;
    const rawAddress = cutAtAddressStop(match[1]);
    const address = cleanAddressFragment(rawAddress, /^ul\.?|^ulica/i.test(match[0]));
    if (address) return address;
  }

  const cityAddress = compact.match(/([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]+\s+\d+[a-zA-Z]?\/?\d*\s+(?:Mielec|Tarnów|Tarnow|Rzeszów|Rzeszow|Dębica|Debica|Kolbuszowa|Przecław|Przeclaw|Radomyśl|Radomysl)[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]*)/i);
  if (cityAddress) return cleanAddressFragment(cutAtAddressStop(cityAddress[1]), false);

  return '';
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
  const serviceStart = out.match(/\s+(?:montaż|montaz|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45)(?=\s|$)/i);
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
  const words = text.split(' ').filter(Boolean).filter(word => !/\d/.test(word)).slice(0, 3);
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
  let out = String(text || '').toLowerCase();
  out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  out = out.replace(/,/g, '.');
  out = out.replace(/zlotych|złotych|zloty|złoty|złote|zlote|pln/g, 'zł');
  out = out.replace(/metrów|metry|metrow|metra/g, 'm');
  out = out.replace(/sztuk|sztuki|sztukę|sztuke/g, 'szt');
  out = out.replace(/godzinę|godzine|godziny|godzin/g, 'godz');
  for (const [word, value] of Object.entries(POLISH_NUMBER_WORDS)) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g'), String(value));
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
  const separator = /[,;.\n]|\s+i\s+|\s+oraz\s+|\s+plus\s+/gi;
  const startMatches = [...before.matchAll(separator)];
  let lastStart = startMatches.length ? startMatches[startMatches.length - 1].index + startMatches[startMatches.length - 1][0].length : Math.max(0, index - 45);
  const prefix = text.slice(lastStart, index);
  if (/zł\s*$/i.test(prefix) || /zł\s+\w{0,12}\s*$/i.test(prefix)) lastStart = index;
  const endMatch = after.match(/[,;.\n]|\s+i\s+|\s+oraz\s+|\s+plus\s+/i);
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
  const match = text.match(/dojazd\s+(\d+(?:[.]\d+)?)\s*km(?:\s*(?:po|za)\s*(\d+(?:[.]\d+)?)\s*zł)?/i);
  if (!match) return null;
  return { km: number(match[1]), rate: match[2] ? number(match[2]) : null };
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
