/*
 * Pomocnik Instalatora PWA — moduł: storage.js
 * Ustawienia, localStorage, zapis wycen, kopie i reguły użytkownika.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

function defaultSettings() {
  return {
    companyName: 'Moja Firma Instalacyjna',
    vatRate: 23,
    storageMode: 'local',
    dropboxAccessToken: '',
    dropboxPath: '/pomocnik_instalatora_data.json',
    dropboxAutoSync: false,
    lastDropboxSyncAt: '',
    uiTheme: 'light',
    uiSkin: 'standard',
    aiParserMode: 'local',
    aiOpenAiKey: '',
    aiModel: 'gpt-4o-mini',
    aiLastTestAt: ''
  };
}

function loadSettings() {
  try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return defaultSettings(); }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function normalizeTheme(theme) {
  const allowed = new Set(['light', 'blue', 'green', 'amber', 'dark']);
  return allowed.has(String(theme || '')) ? String(theme) : 'light';
}

function normalizeSkin(skin) {
  const allowed = new Set(['standard', 'compact', 'dashboard', 'field', 'glass', 'minimal']);
  return allowed.has(String(skin || '')) ? String(skin) : 'standard';
}

function applySkin(skin) {
  const selected = normalizeSkin(skin);
  document.body.dataset.skin = selected;
}

function applyTheme(theme) {
  const selected = normalizeTheme(theme);
  document.body.dataset.theme = selected;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = {
      light: '#f6f8fb',
      blue: '#edf5ff',
      green: '#eef8f1',
      amber: '#fff8e5',
      dark: '#0f172a'
    };
    meta.setAttribute('content', colors[selected] || colors.light);
  }
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
  clean.version = Math.max(1, number(clean.version, 1));
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

function extractBackupRecords(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.quoteRecords)) return payload.quoteRecords.map(normalizeQuoteRecord);
  if (Array.isArray(payload.records)) return payload.records.map(normalizeQuoteRecord);
  if (Array.isArray(payload.quotes)) return payload.quotes.map(normalizeQuoteRecord);
  return [];
}

function refreshFormAfterBackupImport() {
  const settings = loadSettings();
  applyTheme(settings.uiTheme || 'light');
  applySkin(settings.uiSkin || 'standard');
  if ($('companyName')) $('companyName').value = settings.companyName || '';
  if ($('vatRate')) $('vatRate').value = settings.vatRate ?? 23;
  if ($('storageMode')) $('storageMode').value = settings.storageMode || 'local';
  if ($('dropboxToken')) $('dropboxToken').value = settings.dropboxAccessToken || '';
  if ($('dropboxPath')) $('dropboxPath').value = settings.dropboxPath || '/pomocnik_instalatora_data.json';
  if ($('dropboxAutoSync')) $('dropboxAutoSync').checked = !!settings.dropboxAutoSync;
  if ($('uiTheme')) $('uiTheme').value = normalizeTheme(settings.uiTheme || 'light');
  if ($('uiSkin')) $('uiSkin').value = normalizeSkin(settings.uiSkin || 'standard');
  if ($('aiParserMode')) $('aiParserMode').value = settings.aiParserMode || 'local';
  if ($('aiOpenAiKey')) $('aiOpenAiKey').value = settings.aiOpenAiKey || '';
  fillAiModelSelect();
  if ($('aiModel')) $('aiModel').value = normalizeAiModel(settings.aiModel || 'gpt-4o-mini');
  renderAiParserStatus();
  if ($('phraseDictionary')) $('phraseDictionary').value = loadPhraseDictionaryText();
  fillSelect($('jobType'), CATEGORIES);
  fillSelect($('categorySelect'), CATEGORIES);
  state.jobType = CATALOG[state.jobType] ? state.jobType : (CATEGORIES[0] || '');
  $('jobType').value = state.jobType;
  $('categorySelect').value = state.jobType;
  updateServiceSelect();
  renderAll();
}

function importBackupFromFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      const records = extractBackupRecords(parsed);
      const catalog = validateCatalogObject(parsed.catalog || null);
      const hasSettings = parsed.settings && typeof parsed.settings === 'object' && !Array.isArray(parsed.settings);
      const hasDictionary = typeof parsed.phraseDictionary === 'string';
      const hasLearnedRules = parsed.learnedParserRules && typeof parsed.learnedParserRules === 'object' && !Array.isArray(parsed.learnedParserRules);

      if (!records.length && !catalog && !hasSettings && !hasDictionary && !hasLearnedRules) {
        throw new Error('To nie wygląda jak kopia JSON tego programu.');
      }

      if (!confirm('Wgrać kopię JSON? Wyceny zostaną scalone z obecnymi, a ustawienia/cennik z pliku zostaną zastosowane.')) return;

      if (hasSettings) {
        saveSettings({
          ...defaultSettings(),
          ...loadSettings(),
          ...parsed.settings,
          uiTheme: normalizeTheme(parsed.settings.uiTheme || loadSettings().uiTheme || 'light'),
          uiSkin: normalizeSkin(parsed.settings.uiSkin || loadSettings().uiSkin || 'standard')
        });
      }

      if (hasDictionary) savePhraseDictionaryText(parsed.phraseDictionary);
      if (hasLearnedRules) saveLearnedRules(parsed.learnedParserRules);

      if (catalog) {
        // Cennik z kopii ma pierwszeństwo, ale nie kasujemy pozycji, których w kopii nie było.
        saveCatalog(mergeCatalogs(CATALOG, catalog));
        refreshCatalogControls();
      }

      if (records.length) {
        saveQuoteRecords(mergeQuoteRecords(loadQuoteRecords(), records));
      }

      refreshFormAfterBackupImport();
      showInfo(`Wgrano kopię JSON. Aktywne wyceny: ${loadQuotes().length}. Rekordy łącznie: ${loadQuoteRecords().length}.`);
    } catch (error) {
      showInfo(`Nie udało się wgrać kopii JSON: ${error.message}`);
    }
  };

  reader.onerror = () => showInfo('Nie udało się odczytać pliku JSON.');
  reader.readAsText(file, 'utf-8');
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
    dropboxAutoSync: !!$('dropboxAutoSync')?.checked,
    uiTheme: normalizeTheme($('uiTheme')?.value || current.uiTheme || 'light'),
    uiSkin: normalizeSkin($('uiSkin')?.value || current.uiSkin || 'standard'),
    aiParserMode: normalizeAiParserMode($('aiParserMode')?.value || current.aiParserMode || 'local'),
    aiOpenAiKey: $('aiOpenAiKey')?.value.trim() || current.aiOpenAiKey || '',
    aiModel: getSelectedAiModel(current.aiModel)
  };
}

function saveSettingsFromForm() {
  const settings = readSettingsFromForm();
  saveSettings(settings);
  applyTheme(settings.uiTheme);
  applySkin(settings.uiSkin);
  renderSummary();
  renderDropboxStatus();
  renderAiParserStatus();
  renderAnalysisModeHint(settings);
  showInfo('Zapisano wszystkie ustawienia aplikacji.');
}

function savePhraseDictionaryFromForm() {
  savePhraseDictionaryText($('phraseDictionary').value);
  showInfo('Zapisano słownik własnych zwrotów. Nowe zasady będą używane przy kolejnej analizie wizyty.');
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
  applyTheme(defaultSettings().uiTheme);
  applySkin(defaultSettings().uiSkin);
  if ($('uiTheme')) $('uiTheme').value = defaultSettings().uiTheme;
  if ($('uiSkin')) $('uiSkin').value = defaultSettings().uiSkin;
  syncToForm();
  renderAll();
}

