const APP_VERSION = '1.0.0';
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
    showInfo('Ta przeglądarka nie obsługuje dyktowania. Najczęściej działa w Chrome/Edge.');
    return;
  }
  const recognition = new Recognition();
  recognition.lang = 'pl-PL';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $('voiceBtn').textContent = 'Słucham...';
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    $('notes').value = ($('notes').value + ' ' + text).trim();
    syncFromForm();
  };
  recognition.onerror = () => showInfo('Nie udało się rozpoznać mowy.');
  recognition.onend = () => $('voiceBtn').textContent = 'Dyktuj notatkę';
  recognition.start();
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
