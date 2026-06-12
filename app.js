/*
 * PLIK GENEROWANY — nie edytowac recznie.
 * Wersja: 4.2 - 1206260811
 * Zrodla kodu: katalog js/.
 * Zrodla danych: app-version.json, cennik.json, material-prices.json.
 * Odbudowa: node tools/build-app-bundle.js
 */

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
  if ($('companyName')) $('companyName').value = settings.companyName || '';
  if ($('vatRate')) $('vatRate').value = settings.vatRate ?? 23;
  if ($('storageMode')) $('storageMode').value = settings.storageMode || 'local';
  if ($('dropboxToken')) $('dropboxToken').value = settings.dropboxAccessToken || '';
  if ($('dropboxPath')) $('dropboxPath').value = settings.dropboxPath || '/pomocnik_instalatora_data.json';
  if ($('dropboxAutoSync')) $('dropboxAutoSync').checked = !!settings.dropboxAutoSync;
  if ($('uiTheme')) $('uiTheme').value = normalizeTheme(settings.uiTheme || 'light');
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
          uiTheme: normalizeTheme(parsed.settings.uiTheme || loadSettings().uiTheme || 'light')
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
    aiParserMode: normalizeAiParserMode($('aiParserMode')?.value || current.aiParserMode || 'local'),
    aiOpenAiKey: $('aiOpenAiKey')?.value.trim() || current.aiOpenAiKey || '',
    aiModel: getSelectedAiModel(current.aiModel)
  };
}

function saveSettingsFromForm() {
  const settings = readSettingsFromForm();
  saveSettings(settings);
  applyTheme(settings.uiTheme);
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
  if ($('uiTheme')) $('uiTheme').value = defaultSettings().uiTheme;
  syncToForm();
  renderAll();
}


/*
 * Pomocnik Instalatora PWA — moduł: catalog.js
 * Cennik usług oraz baza i obsługa cen materiałów.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

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
      if (parsed) return mergeCatalogWithDefaults(parsed);
    }
  } catch {}
  return getDefaultCatalog();
}

function mergeCatalogWithDefaults(customCatalog) {
  const merged = getDefaultCatalog();
  const custom = validateCatalogObject(customCatalog) || {};
  for (const [category, items] of Object.entries(custom)) {
    if (!merged[category]) merged[category] = [];
    for (const item of items) {
      const idx = merged[category].findIndex(existing => existing.name.toLowerCase() === item.name.toLowerCase());
      if (idx >= 0) merged[category][idx] = item;
      else merged[category].push(item);
    }
  }
  return merged;
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

function parseCableMaterialPrice(text) {
  const source = String(text || '').split(/(?:prowadzen\w*|ciagnieci\w*|ciągnięci\w*|przeciagani\w*|przeciągani\w*|robocizn\w*)/i)[0];
  const patterns = [
    /(?:kabel|kabla|przewod\w*|przewód\w*|skretk\w*|skrętk\w*|cat\s*\d\w*|kat\s*\d\w*|rg6|antenow\w*|internetow\w*)\D{0,60}?(?:po|za|kosztuje|kosztuja)\s*(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:m|mb|metr)/i,
    /(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:m|mb|metr)\D{0,50}?(?:kabel|kabla|przewod\w*|przewód\w*|skretk\w*|skrętk\w*|cat\s*\d\w*|kat\s*\d\w*|rg6|antenow\w*|internetow\w*)/i
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return number(match[1], 0);
  }
  return null;
}

function seedArchiveCatalogMetadata() {
  TYPE_HINTS['TV / Montaż'] = ['Montaż telewizora na ścianie', 'Montaż uchwytu TV', 'Konfiguracja telewizora / Smart TV'];
  TYPE_HINTS['Komputery / Telefony'] = ['Diagnostyka komputera / laptopa', 'Instalacja / konfiguracja Windows', 'Konfiguracja telefonu'];
  TYPE_HINTS['Prace drobne'] = ['Montaż / naprawa klamki', 'Wymiana zamka'];
  CHECKLISTS['TV / Montaż'] = ['Sprawdzić typ ściany i kołki', 'Sprawdzić wieszak / VESA', 'Ustalić wysokość montażu', 'Ukryć lub uporządkować przewody'];
  CHECKLISTS['Komputery / Telefony'] = ['Sprawdzić objawy', 'Zrobić kopię ważnych danych', 'Zanotować hasła tylko jeśli klient je świadomie podaje', 'Sprawdzić konta i aplikacje po naprawie'];
  CHECKLISTS['Prace drobne'] = ['Sprawdzić typ elementu', 'Ustalić materiał i zakres', 'Zanotować czy trzeba kupić części'];
  const pushRule = (rule) => { if (!VOICE_ITEM_RULES.some(x => x.key === rule.key)) VOICE_ITEM_RULES.push(rule); };
  pushRule({ key: 'tv_mount_archive', category: 'TV / Montaż', name: 'Montaż telewizora na ścianie', unit: 'szt', keywords: ['montaż tv', 'montaz tv', 'powieszenie telewizora', 'uchwyt tv', 'wieszak tv'] });
  pushRule({ key: 'phone_config_archive', category: 'Komputery / Telefony', name: 'Konfiguracja telefonu', unit: 'usł', keywords: ['konfiguracja telefonu', 'ustawienie telefonu', 'przywracanie telefonu'] });
  pushRule({ key: 'computer_diag_archive', category: 'Komputery / Telefony', name: 'Diagnostyka komputera / laptopa', unit: 'usł', keywords: ['laptop', 'komputer', 'diagnostyka komputera'] });
  pushRule({ key: 'door_handle_archive', category: 'Prace drobne', name: 'Montaż / naprawa klamki', unit: 'szt', keywords: ['klamka', 'klamki', 'naprawa klamki'] });
}

function normalizeMaterialName(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\bmaterial\b|\bmaterial\b|\bmaterialowa\b|\bmaterialowy\b/g, '')
    .replace(/—|-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function defaultMaterialPriceDb() {
  const fallback = { version: APP_VERSION, updated_at: '2026-05-12', currency: 'PLN', tax_basis: 'netto', items: [] };
  return structuredCloneSafe(window.MATERIAL_PRICE_DB || fallback);
}

function validateMaterialPriceDb(db) {
  if (!db || typeof db !== 'object') return defaultMaterialPriceDb();
  const out = {
    version: String(db.version || APP_VERSION),
    updated_at: String(db.updated_at || new Date().toISOString().slice(0, 10)),
    currency: String(db.currency || 'PLN'),
    tax_basis: String(db.tax_basis || 'netto'),
    source_summary: db.source_summary || {},
    items: []
  };
  for (const raw of Array.isArray(db.items) ? db.items : []) {
    const name = String(raw.name || '').trim();
    const category = String(raw.category || '').trim();
    const unit = String(raw.unit || 'szt').trim() || 'szt';
    const price = parseCatalogPrice(raw.price_net ?? raw.priceNet ?? raw.price);
    if (!name || !category || price < 0) continue;
    out.items.push({
      key: String(raw.key || normalizeMaterialName(name).replace(/\s+/g, '_')),
      category,
      name,
      unit,
      price_net: round2(price),
      min_net: round2(parseCatalogPrice(raw.min_net ?? price * 0.75)),
      max_net: round2(parseCatalogPrice(raw.max_net ?? price * 1.45)),
      confidence: String(raw.confidence || 'średnia'),
      note: String(raw.note || ''),
      updated_at: String(raw.updated_at || out.updated_at)
    });
  }
  return out.items.length ? out : defaultMaterialPriceDb();
}

function mergeMaterialPriceDb(defaultDb, customDb) {
  const base = validateMaterialPriceDb(defaultDb);
  const custom = customDb ? validateMaterialPriceDb(customDb) : null;
  if (!custom) return base;
  const map = new Map(base.items.map(item => [item.key, item]));
  for (const item of custom.items) map.set(item.key, item);
  return { ...base, ...custom, items: [...map.values()] };
}

function loadMaterialPriceDb() {
  try {
    const stored = localStorage.getItem(MATERIAL_PRICES_KEY);
    if (stored) return mergeMaterialPriceDb(defaultMaterialPriceDb(), JSON.parse(stored));
  } catch {}
  return defaultMaterialPriceDb();
}

function saveMaterialPriceDb(db) {
  const clean = validateMaterialPriceDb(db);
  localStorage.setItem(MATERIAL_PRICES_KEY, JSON.stringify(clean));
  return clean;
}

function findMaterialPriceEntry(name, category = '') {
  const db = loadMaterialPriceDb();
  const wanted = normalizeMaterialName(name);
  const wantedCompact = wanted.replace(/\s+/g, '');
  let best = null;
  for (const item of db.items || []) {
    if (category && item.category !== category) continue;
    const itemName = normalizeMaterialName(item.name);
    const itemCompact = itemName.replace(/\s+/g, '');
    if (itemName === wanted || itemCompact === wantedCompact) return item;
    if (!best && (itemName.includes(wanted) || wanted.includes(itemName))) best = item;
  }
  if (!best && category) return findMaterialPriceEntry(name, '');
  return best;
}

function getSuggestedMaterialPrice(name, category = '') {
  const entry = findMaterialPriceEntry(name, category);
  return entry ? number(entry.price_net, 0) : null;
}

function syncCatalogWithMaterialPrices(options = {}) {
  const overrideExisting = !!options.overrideExisting;
  const db = loadMaterialPriceDb();
  const catalog = structuredCloneSafe(CATALOG);
  let added = 0;
  let updated = 0;
  for (const entry of db.items || []) {
    if (!catalog[entry.category]) catalog[entry.category] = [];
    const list = catalog[entry.category];
    const idx = list.findIndex(item => normalizeMaterialName(item.name) === normalizeMaterialName(entry.name));
    const cleanItem = { name: entry.name, unit: entry.unit, price_net: round2(entry.price_net) };
    if (idx >= 0) {
      const oldPrice = number(list[idx].price_net, -1);
      if (overrideExisting || oldPrice <= 0) {
        list[idx] = cleanItem;
        updated += 1;
      }
    } else {
      list.push(cleanItem);
      added += 1;
    }
  }
  saveCatalog(catalog);
  refreshCatalogControls(state.jobType);
  renderCatalog();
  updateServiceSelect();
  return { added, updated, total: (db.items || []).length, version: db.version, updated_at: db.updated_at };
}

function renderMaterialPrices() {
  const view = $('materialPricesView');
  if (!view) return;
  const db = loadMaterialPriceDb();
  const query = ($('materialPriceSearch')?.value || '').toLowerCase().trim();
  $('materialPriceVersion').textContent = `Baza cen: ${db.version || APP_VERSION}, aktualizacja: ${db.updated_at || '-'}`;
  view.innerHTML = '';
  const groups = new Map();
  for (const item of db.items || []) {
    const hay = `${item.category} ${item.name} ${item.note}`.toLowerCase();
    if (query && !hay.includes(query)) continue;
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  if (!groups.size) {
    view.innerHTML = '<div class="empty-state">Brak pasujących produktów.</div>';
    return;
  }
  for (const [category, items] of groups.entries()) {
    const group = document.createElement('section');
    group.className = 'catalog-group material-price-group';
    group.innerHTML = `<h3>${escapeHtml(category)}</h3>`;
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'material-price-item';
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.note || '')}</small>
        </div>
        <div>${escapeHtml(item.unit)}</div>
        <div class="price">${money(item.price_net)}</div>
        <div class="muted">${money(item.min_net)}–${money(item.max_net)}</div>
        <button class="btn btn-soft" data-action="search">Szukaj ceny</button>`;
      row.querySelector('[data-action="search"]').addEventListener('click', () => {
        const q = encodeURIComponent(`${item.name.replace(/—\s*materiał/i, '').trim()} cena Polska`);
        window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener');
      });
      group.appendChild(row);
    }
    view.appendChild(group);
  }
}

function showMaterialPriceStatus(text, isError = false) {
  const box = $('materialPriceStatus');
  if (!box) return;
  box.textContent = text;
  box.classList.toggle('error', !!isError);
}

async function refreshMaterialPricesFromFile() {
  try {
    const response = await fetch(`material-prices.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remote = validateMaterialPriceDb(await response.json());
    saveMaterialPriceDb(remote);
    localStorage.setItem(MATERIAL_PRICES_LAST_CHECK_KEY, new Date().toISOString());
    const result = syncCatalogWithMaterialPrices({ overrideExisting: false });
    renderMaterialPrices();
    showMaterialPriceStatus(`Pobrano bazę ${remote.version}. Dodano: ${result.added}, uzupełniono zerowe ceny: ${result.updated}.`);
  } catch (error) {
    showMaterialPriceStatus(`Nie udało się pobrać material-prices.json. Używam lokalnej bazy. Szczegóły: ${error.message || error}`, true);
  }
}

function applyMaterialPricesToCatalogManually() {
  const result = syncCatalogWithMaterialPrices({ overrideExisting: true });
  renderAll();
  renderMaterialPrices();
  showMaterialPriceStatus(`Zastosowano ceny materiałów w cenniku. Dodano: ${result.added}, zaktualizowano: ${result.updated}.`);
}

function exportMaterialPrices() {
  const db = loadMaterialPriceDb();
  downloadFile(`baza_cen_materialow_${sanitizeFileName(db.updated_at || 'data')}.json`, JSON.stringify(db, null, 2), 'application/json;charset=utf-8');
}

function importMaterialPricesFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const db = validateMaterialPriceDb(JSON.parse(reader.result));
      saveMaterialPriceDb(db);
      syncCatalogWithMaterialPrices({ overrideExisting: false });
      renderMaterialPrices();
      renderCatalog();
      showMaterialPriceStatus(`Zaimportowano bazę cen: ${db.version || '-'}.`);
    } catch (error) {
      showMaterialPriceStatus('Nie udało się zaimportować bazy cen. Plik JSON jest niepoprawny.', true);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file, 'utf-8');
}

function autoApplyMaterialPricesOnStart() {
  const result = syncCatalogWithMaterialPrices({ overrideExisting: false });
  const last = Date.parse(localStorage.getItem(MATERIAL_PRICES_LAST_CHECK_KEY) || '') || 0;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - last > sevenDays && location.protocol !== 'file:') {
    refreshMaterialPricesFromFile();
  } else if (result.added || result.updated) {
    showMaterialPriceStatus(`Uzupełniono lokalny cennik z bazy materiałów. Dodano: ${result.added}, poprawiono zerowe ceny: ${result.updated}.`);
  }
}

function installerFindCatalogPriceV29(category, name, fallback) {
  const catalog = findCatalogService(category, name);
  return number(catalog?.price_net, fallback);
}

function installerV34CatalogPrice(category, name, fallback) {
  if (typeof installerFindCatalogPriceV29 === 'function') return installerFindCatalogPriceV29(category, name, fallback);
  const catalog = findCatalogService(category, name);
  return number(catalog?.price_net, fallback);
}

function installerV35CatalogPrice(category, name, fallback) {
  if (typeof installerV34CatalogPrice === 'function') return installerV34CatalogPrice(category, name, fallback);
  const catalog = findCatalogService(category, name);
  return number(catalog?.price_net, fallback);
}


/*
 * Pomocnik Instalatora PWA — moduł: quote.js
 * Stan i obliczenia wyceny oraz operacje na pozycjach.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

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
  renderClientMessagePreview();
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

function classifyQuoteItem(item) {
  const name = String(item?.name || '').toLowerCase();
  const category = String(item?.category || '').toLowerCase();
  if (/dojazd/.test(name) || /dojazd/.test(category)) return { key: 'drive', label: 'dojazd' };
  if (/dopłat|doplat|trudn|wysoko|komin|maszt|przewiert|odwiert|kucie|kopanie/.test(name) || /dopłat|doplat|trudne/.test(category)) return { key: 'surcharge', label: 'dopłata' };
  if (/materiał|material/.test(name)) return { key: 'material', label: 'materiał' };
  if (/^(montaż|montaz|konfiguracja|uruchomienie|ustawienie|prowadzenie|zarabianie|diagnostyka|serwis|podłączenie|podlaczenie|pomiar|test)\b/.test(name)) return { key: 'labor', label: 'robocizna' };
  if (/kamera .*ip|rejestrator|nvr|dvr|switch|poe|dysk|puszk|przew[oó]d|kabel|skr[eę]tk|rg6|peszel|listwa|zasilacz|wtyk|rj45|złącze|zlacze|gniazdo|keystone|obejma|maszt|uchwyt|router|access point|czujka|sygnalizator|pilot|elektrozaczep/.test(name)) return { key: 'material', label: 'materiał' };
  return { key: 'labor', label: 'robocizna' };
}

function isSuggestedMaterialItem(item) {
  const type = classifyQuoteItem(item);
  if (type.key !== 'material') return false;
  if (number(item?.priceNet, 0) <= 0) return false;
  return /materiał|material|kamera .*ip|rejestrator|switch|poe|dysk|puszk|przew[oó]d|kabel|skr[eę]tk|zasilacz|router|access point/.test(String(item?.name || '').toLowerCase());
}

function quoteItemBadgesHtml(item) {
  const type = classifyQuoteItem(item);
  const suggested = isSuggestedMaterialItem(item);
  return `<div class="item-badges"><span class="item-badge ${escapeAttr(type.key)}">${escapeHtml(type.label)}</span>${suggested ? '<span class="item-badge suggested">cena sugerowana — sprawdź</span>' : ''}</div>`;
}

function saveCurrentQuote() {
  syncFromForm();
  state = upsertQuoteRecord(state);
  renderSavedQuotes();
  showInfo('Wycena zapisana. Jeśli Dropbox jest włączony, program może ją zsynchronizować automatycznie.');
  scheduleAutoDropboxSync();
}

function hasQuoteDraftContent() {
  return Boolean(
    String($('voiceCommand')?.value || '').trim() ||
    state.clientName || state.clientPhone || state.clientAddress || state.notes ||
    number(state.distanceKm, 0) > 0 ||
    (state.services || []).length
  );
}

function newQuote() {
  syncFromForm();
  if (hasQuoteDraftContent() && !confirm('Masz dane w aktualnej wycenie. Wyczyścić formularz i pole dyktowania?')) return;
  state = createEmptyQuote();
  pendingParse = null;
  lastBreakdownSnapshot = null;
  hideParserPreview();
  $('undoParseBtn').hidden = true;
  $('voiceCommand').value = '';
  updateVoiceSelectionActions();
  syncToForm();
  renderAll();
  showInfo('Utworzono pustą wycenę.');
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

function collectSelectedSurcharges(result) {
  const suggestions = result?.surchargeSuggestions || [];
  if (!suggestions.length) return [];
  return [...document.querySelectorAll('[data-surcharge-index]:checked')]
    .map(input => suggestions[number(input.dataset.surchargeIndex, -1)]?.item)
    .filter(Boolean)
    .map(item => ({ ...item, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()) }));
}


/*
 * Pomocnik Instalatora PWA — moduł: parser-local.js
 * Lokalny parser transkrypcji, reguły uczące i poprawki parsera.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

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

function updateVoiceSelectionActions() {
  const area = $('voiceCommand');
  const actions = $('voiceSelectionActions');
  if (!area || !actions) return;
  const hasSelection = area.selectionEnd > area.selectionStart;
  actions.hidden = !hasSelection;
  if ($('selectVoiceBtn')) $('selectVoiceBtn').textContent = hasSelection ? 'Zaznaczono wszystko' : 'Zaznacz wszystko';
}

function selectAllVoiceText() {
  const area = $('voiceCommand');
  if (!area) return;
  area.focus();
  area.select();
  updateVoiceSelectionActions();
}

function getSelectedVoiceText() {
  const area = $('voiceCommand');
  if (!area) return '';
  return area.value.slice(area.selectionStart, area.selectionEnd);
}

function copySelectedVoiceText() {
  const selected = getSelectedVoiceText();
  if (!selected) {
    showInfo('Najpierw zaznacz tekst w polu dyktowania.');
    return;
  }
  copyTextToClipboard(selected, 'Zaznaczony tekst skopiowany do schowka.');
}

function clearSelectedVoiceText() {
  const area = $('voiceCommand');
  if (!area) return;
  const start = area.selectionStart;
  const end = area.selectionEnd;
  if (end <= start) {
    showInfo('Najpierw zaznacz fragment do usunięcia.');
    return;
  }
  area.value = area.value.slice(0, start) + area.value.slice(end);
  area.focus();
  area.setSelectionRange(start, start);
  rejectParserPreview(false);
  updateVoiceSelectionActions();
}

function importVoiceTextFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const loadedText = String(reader.result || '').replace(/\r\n/g, '\n').trim();
    if (!loadedText) {
      showInfo('Wybrany plik TXT jest pusty.');
      return;
    }
    const area = $('voiceCommand');
    const current = area.value.trim();
    if (current) {
      const append = confirm('Pole dyktowania zawiera już tekst. Kliknij OK, aby dopisać plik na końcu. Kliknij Anuluj, aby zastąpić obecny tekst.');
      area.value = append ? `${current}\n\n${loadedText}` : loadedText;
    } else {
      area.value = loadedText;
    }
    rejectParserPreview(false);
    updateVoiceSelectionActions();
    showInfo(`Wczytano plik TXT: ${file.name}. Kliknij „Analizuj wizytę”, żeby przygotować wycenę.`);
  };
  reader.onerror = () => showInfo('Nie udało się wczytać pliku TXT.');
  reader.readAsText(file, 'utf-8');
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

function hideParserPreview() {
  $('parserPreview').hidden = true;
  $('parserPreviewContent').innerHTML = '';
}

function detectSurchargeSuggestions(rawText, normalizedText) {
  const text = normalizeSpeechText(`${rawText} ${normalizedText || ''}`);
  const suggestions = [];
  const add = (key, category, name, unit, quantity, fallbackPrice, reason) => {
    if (suggestions.some(item => item.key === key)) return;
    const catalog = findCatalogService(category, name);
    suggestions.push({
      key,
      reason,
      item: buildVoiceItem({
        category,
        name,
        unit,
        quantity,
        priceNet: number(catalog?.price_net, fallbackPrice),
        key
      })
    });
  };

  if (/\b(wysoko|wysokosc|wysokość|drabin\w*|dach|strych|poddasz\w*|trudny\s+dostep|trudny\s+dostęp|brak\s+dojscia|brak\s+dojścia)\b/i.test(text)) {
    add('surcharge_height_access', 'Dopłaty / Trudne warunki', 'Dopłata za trudny dostęp / wysokość', 'usł', 1, 80, 'W tekście jest wysokość, drabina, dach, strych albo trudny dostęp.');
  }
  if (/\b(komin\w*|maszt\w*|obejm\w*\s+komin\w*)\b/i.test(text)) {
    add('surcharge_chimney_mast', 'Dopłaty / Trudne warunki', 'Dopłata za montaż na kominie lub maszcie', 'usł', 1, 100, 'W tekście pojawia się komin, maszt albo obejma kominowa.');
  }
  if (/\b(przewiert\w*|przewierc\w*|wiercen\w*|przekuc\w*|przebic\w*|przebić|kucie|kuc\w*|gruba\s+sciana|gruba\s+ściana)\b/i.test(text)) {
    const quantity = parseSurchargeQuantity(text, /przewiert\w*|przekuc\w*|wiercen\w*|otwor\w*|otwór\w*/i) || 1;
    add('surcharge_drilling', 'Dopłaty / Trudne warunki', 'Dopłata za przewiert / przekucie', 'szt', quantity, 45, 'W tekście pojawia się przewiert, wiercenie, przekucie albo kucie.');
  }
  if (/\b(kopanie|kopac|kopać|wykop\w*|przekop\w*|ziemi\w*|grunt\w*|kostka\s+brukowa|bruk\w*)\b/i.test(text)) {
    add('surcharge_groundwork', 'Dopłaty / Trudne warunki', 'Dopłata za kopanie / trudny grunt', 'usł', 1, 120, 'W tekście pojawia się kopanie, ziemia, grunt, wykop albo kostka brukowa.');
  }
  if (/\b(styropian|ocieplen\w*|elewacj\w*|pod\s+elewacj\w*)\b/i.test(text)) {
    add('surcharge_facade', 'Dopłaty / Trudne warunki', 'Dopłata za pracę na elewacji / ociepleniu', 'usł', 1, 70, 'W tekście pojawia się elewacja, styropian albo ocieplenie.');
  }

  return suggestions;
}

function parseSurchargeQuantity(text, keywordRe) {
  const words = String(text || '');
  const matchBefore = words.match(new RegExp('(\\d+(?:[.]\\d+)?)\\s*(?:szt\\.?\\s*)?(?:' + keywordRe.source + ')', 'i'));
  if (matchBefore) return number(matchBefore[1], 1);
  const matchAfter = words.match(new RegExp('(?:' + keywordRe.source + ')\\D{0,30}(\\d+(?:[.]\\d+)?)\\s*(?:szt)?', 'i'));
  if (matchAfter) return number(matchAfter[1], 1);
  return 0;
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

function parseAccessoryVoiceItems(text) {
  const clauses = splitAccessoryClauses(text);
  const items = [];
  const usedFragments = [];
  const seen = new Set();

  for (const clause of clauses) {
    if (!looksLikeAccessoryClause(clause)) continue;
    const type = detectAccessoryType(clause);
    if (!type) continue;
    const qty = parseAccessoryQuantity(clause);
    const price = parseAccessoryPrice(clause);
    const catalog = findCatalogService(type.category, type.name);
    const key = `${type.key}_${qty}_${price ?? 'catalog'}`;
    if (seen.has(key)) continue;
    items.push(buildVoiceItem({
      category: type.category,
      name: type.name,
      unit: type.unit || 'szt',
      quantity: qty,
      priceNet: price !== null ? price : number(catalog?.price_net, type.defaultPrice),
      key: type.key
    }));
    seen.add(key);
    usedFragments.push(clause);

    if (/\b(zarob\w*|zarabian\w*|zacis\w*|zaciś\w*)\b/i.test(clause)) {
      const laborName = /rj\s*-?\s*45|rjek|rjki|rj-ki/i.test(clause) ? 'Zaciskanie wtyku RJ45' : (/\bf\b|z[lł]acz\w*\s*f|koncowk\w*\s*f|końcówk\w*\s*f/i.test(clause) ? 'Zarabianie złącza F' : '');
      if (laborName) {
        const laborCatalog = findCatalogService('Złącza / Akcesoria', laborName);
        const laborKey = `${type.key}_labor_${qty}`;
        if (!seen.has(laborKey)) {
          items.push(buildVoiceItem({ category: 'Złącza / Akcesoria', name: laborName, unit: 'szt', quantity: qty, priceNet: number(laborCatalog?.price_net, laborName.includes('RJ45') ? 12 : 6), key: laborKey }));
          seen.add(laborKey);
        }
      }
    }
  }

  return { items, usedFragments };
}

function detectAccessoryType(text) {
  let best = null;
  for (const type of ACCESSORY_TYPES) {
    const score = type.score(text);
    if (score > 0 && (!best || score > best.score)) best = { ...type, score };
  }
  return best;
}

function parseAccessoryQuantity(text) {
  const source = String(text || '');
  const before = source.match(/\b(\d+(?:[.]\d+)?)\s*(?:szt\.?\s*)?(?:zlacz\w*|złacz\w*|złącz\w*|złąc\w*|wtyk\w*|koncowk\w*|końcówk\w*|rj\s*-?\s*45|rjek|rjki|rj-ki|beczk\w*|rozgaleznik\w*|rozgałeznik\w*|rozgałęźnik\w*|rozdzielacz\w*|splitter\w*|odgaleznik\w*|odgałęźnik\w*|gniazd\w*|keystone|modul\w*|moduł\w*|zasilacz\w*|wzmacniacz\w*|separator\w*|oslonk\w*|oslon\w*|osłonk\w*|osłon\w*|patch\s*panel)/i);
  if (before) return number(before[1], 1);
  const after = source.match(/(?:zlacz\w*|złacz\w*|złącz\w*|złąc\w*|wtyk\w*|koncowk\w*|końcówk\w*|rj\s*-?\s*45|rjek|rjki|rj-ki|beczk\w*|rozgaleznik\w*|rozgałeznik\w*|rozgałęźnik\w*|rozdzielacz\w*|splitter\w*|odgaleznik\w*|odgałęźnik\w*|gniazd\w*|keystone|modul\w*|moduł\w*|zasilacz\w*|wzmacniacz\w*|separator\w*|oslonk\w*|oslon\w*|osłonk\w*|osłon\w*|patch\s*panel)\D{0,40}?(\d+(?:[.]\d+)?)\s*szt\b/i);
  if (after) return number(after[1], 1);
  return 1;
}

function parseAccessoryPrice(text) {
  const source = String(text || '');
  const anchorMatch = source.match(/\b(zlacz\w*|złacz\w*|złacz\w*|złacz\w*|złącz\w*|złąc\w*|wtyk\w*|koncowk\w*|końcówk\w*|rj\s*-?\s*45|rjek|rjki|rj-ki|beczk\w*|rozgaleznik\w*|rozgałeznik\w*|rozgałęźnik\w*|rozdzielacz\w*|splitter|odgaleznik\w*|odgałęźnik\w*|gniazd\w*|keystone|modul\w*|moduł\w*|zasilacz\w*|wzmacniacz\w*|separator\w*|oslonk\w*|oslon\w*|osłonk\w*|osłon\w*|patch\s*panel)\b/i);
  const local = anchorMatch ? source.slice(Math.max(0, anchorMatch.index - 25)) : source;
  const patterns = [
    /(?:po|za|cena|kosztuje|kosztuja|kosztują)\s*(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:szt|sztuke|sztukę)?/i,
    /(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:szt|sztuke|sztukę)\b/i
  ];
  for (const pattern of patterns) {
    const match = local.match(pattern);
    if (match) return number(match[1], 0);
  }
  return null;
}

function parseCableLength(text) {
  const patterns = [
    /(\d+(?:[.]\d+)?)\s*(?:m|mb)\b/i,
    /(\d+(?:[.]\d+)?)\s*(?:metr\w*)\b/i,
    /(?:kabel|kabla|przewod\w*|przewód\w*|skretk\w*|skrętk\w*|cat\s*\d\w*|kat\s*\d\w*|rg6|antenow\w*|internetow\w*)\D{0,40}(\d+(?:[.]\d+)?)\s*(?:m|mb|metr\w*)\b/i
  ];
  for (const pattern of patterns) {
    const match = String(text || '').match(pattern);
    if (match) return number(match[1], 0);
  }
  return 0;
}

function detectCableLaborType(text) {
  for (const type of CABLE_LABOR_TYPES) {
    if (type.test(text)) return type;
  }
  return CABLE_LABOR_TYPES[CABLE_LABOR_TYPES.length - 1];
}

function parseCableLaborPrice(text) {
  const patterns = [
    /(?:prowadzen\w*|ciagnieci\w*|ciągnięci\w*|przeciagani\w*|przeciągani\w*|robocizn\w*)\D{0,60}?(?:po|za|kosztuje)?\s*(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:m|mb|metr)/i,
    /(\d+(?:[.]\d+)?)\s*zł\s*(?:za|\/)?\s*(?:m|mb|metr)\D{0,50}?(?:prowadzen\w*|ciagnieci\w*|ciągnięci\w*|przeciagani\w*|przeciągani\w*|robocizn\w*)/i
  ];
  for (const pattern of patterns) {
    const match = String(text || '').match(pattern);
    if (match) return number(match[1], 0);
  }
  return null;
}

function parseCameraPriceBreakdown(text) {
  const source = String(text || '');
  const totalQty = extractCameraQuantity(source) || 0;
  const entries = [];
  const add = (quantity, price, keySuffix) => {
    const qty = number(quantity, 0);
    const net = number(price, 0);
    if (qty <= 0 || net <= 0) return;
    const existing = entries.find(item => item.priceNet === net);
    if (existing) existing.quantity += qty;
    else entries.push(buildVoiceItem({
      category: 'Kamery CCTV',
      name: 'Montaż kamery IP zewnętrznej',
      unit: 'szt',
      quantity: qty,
      priceNet: net,
      key: `camera_price_${keySuffix || net}`
    }));
  };

  // Częsty błąd dyktowania: „trzy kamery” bywa zapisane jako „czy kamery”.
  // Jeśli obok jest „1 kamera za ...”, pozostałe kamery przypisujemy do ceny z frazy „czy kamery za ...”.
  const oneCamera = source.match(/\b1\s+kamer\w*\s+(?:po|za)\s*(\d+(?:[.]\d+)?)\s*zł/i);
  const misheardThree = source.match(/\bczy\s+kamer\w*\s+(?:po|za)\s*(\d+(?:[.]\d+)?)\s*zł/i);
  if (totalQty > 1 && oneCamera && misheardThree) {
    const singleQty = 1;
    add(Math.max(0, totalQty - singleQty), misheardThree[1], 'misheard_three');
    add(singleQty, oneCamera[1], 'single');
    return entries;
  }

  const explicit = [...source.matchAll(/\b(\d+(?:[.]\d+)?)\s+kamer\w*\s+(?:po|za)\s*(\d+(?:[.]\d+)?)\s*zł/gi)];
  for (const match of explicit) add(match[1], match[2], match[2]);

  if (!entries.length) {
    const totalPrice = source.match(/\bkamer\w*\s+(?:po|za)\s*(\d+(?:[.]\d+)?)\s*zł/i);
    if (totalQty > 0 && totalPrice) add(totalQty, totalPrice[1], 'total');
  }

  return entries;
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

function stripClientFragmentsForItems(text) {
  let out = ` ${String(text || '')} `;
  const serviceStartWords = '(?:montaż|montaz|instalacja|instalacje|instalację|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45|rj-45|rjki|zlacze|złącze|zlacza|złacza|złącza|wtyk|wtyki|koncowka|końcówka|beczka|rozgaleznik|rozgałeznik|rozgałęźnik|zasilacz|wzmacniacz|keystone|gniazdo|separator|nauka)';
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

function parseClientPhone(rawText) {
  const explicit = rawText.match(/(?:telefon|tel\.?|numer\s+telefonu|komórka|komorka)\s*(?:to\s+|jest\s+|:)?((?:\+?48)?[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})/i);
  if (explicit) return formatPhone(explicit[1]);

  const generic = rawText.match(/(?:^|\s)((?:\+?48)?[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})(?=\s|$|,|\.)/);
  if (!generic) return '';
  const before = rawText.slice(Math.max(0, generic.index - 18), generic.index).toLowerCase();
  if (/zł|zl|pln|metr|metrow|m\s*$|km|kamera|kamery|kabel/.test(before)) return '';
  return formatPhone(generic[1]);
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
  const serviceStart = out.match(/\s+(?:montaż|montaz|instalacja|instalację|instalacje|będę|bede|montowal|montował|montowali|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45)(?=\s|$)/i);
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

function cleanAddressTailNameFragment(fragment) {
  const words = String(fragment || '')
    .replace(/[,. ;:]+$/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(word => !/\d/.test(word))
    .filter(word => !KNOWN_CITIES.includes(word.toLowerCase()))
    .slice(0, 4);
  if (words.length >= 4) {
    const a = words[0].toLowerCase();
    const b = words[1].toLowerCase();
    const c = words[2].toLowerCase();
    const d = words[3].toLowerCase();
    if (a === d && b === c) return titleCase(words.slice(2, 4).join(' '));
  }
  return titleCase(words.slice(0, 2).join(' '));
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
  out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  out = out.replace(/,/g, '.');
  out = out.replace(/zlotych|złotych|zloty|złoty|złote|zlote|pln/g, 'zł');
  out = out.replace(/\bzl\b/g, 'zł');
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

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function detectTypes(notes) {
  const text = (notes || '').toLowerCase();
  const result = [];
  const priority = [
    ['Kamery CCTV', /kamer\w*|monitoring|cctv|ptz|rejestrator|nvr|poe/i],
    ['Anteny / Sygnał', /anten|dvb|satel|konwerter|sygnal|sygnał/i],
    ['Sieć / Wi‑Fi', /wifi|wi-fi|router|internet|lan|mesh/i],
    ['Przewody / Okablowanie', /skr[eę]tk|cat\s*\d|kat\s*\d|rg6|przew[oó]d|kabel|ydyp|żelowan|zelowan/i],
    ['Złącza / Akcesoria', /z[lł][aą]cz|wtyk|rj45|rj-45|rjki|rj-ki|beczk|rozga[lł][eę]źnik|zasilacz|wzmacniacz|keystone|gniazdo/i],
    ['Dopłaty / Trudne warunki', /trudn|wysoko|drabin|komin|strych|przewiert|przekuc|kopanie|wykop/i],
    ['Domofon', /domofon|wideodomofon|furtk|elektrozaczep/i],
    ['Alarm', /alarm|central|czujk|sygnalizator|pir/i],
    ['Automatyka bram', /bram|pilot|fotokom[oó]rk|nap[eę]d/i],
    ['Serwis', /serwis|napraw|diagnoz|konfigurac|aktualizac/i]
  ];
  for (const [type, re] of priority) if (re.test(text) && !result.includes(type)) result.push(type);
  return result;
}

function mergeParserItems(items) {
  const out = [];
  for (const item of items || []) {
    if (!item || !item.name) continue;
    const key = `${item.category}|${item.name}|${item.unit}|${number(item.priceNet, 0)}|${item._voiceKey || item.parserKey || ''}`;
    const found = out.find(x => `${x.category}|${x.name}|${x.unit}|${number(x.priceNet, 0)}|${x._voiceKey || x.parserKey || ''}` === key);
    if (found) found.quantity = number(found.quantity, 0) + number(item.quantity, 0);
    else out.push(item);
  }
  return out;
}

function parseCableVoiceItems(text) {
  const normalized = String(text || '')
    .replace(/dwa\s+razy\s+0[.,]?5/gi, '2x0.5')
    .replace(/2\s+razy\s+0[.,]?5/gi, '2x0.5');
  const clauses = splitCableClausesEnhanced(normalized);
  const items = [];
  const usedFragments = [];
  const seen = new Set();

  for (const clause of clauses) {
    if (!looksLikeCableClause(clause)) continue;
    const length = parseCableLength(clause);
    if (!length || length <= 0) continue;
    const materialType = detectCableMaterialType(clause);
    if (!materialType) continue;

    const materialKey = `${materialType.key}_${length}_${clause}`;
    if (!seen.has(materialKey)) {
      const materialCatalog = findCatalogService(materialType.category, materialType.name);
      const explicitMaterialPrice = parseCableMaterialPrice(clause);
      items.push(buildVoiceItem({ category: materialType.category, name: materialType.name, unit: 'mb', quantity: length, priceNet: explicitMaterialPrice !== null ? explicitMaterialPrice : number(materialCatalog?.price_net, materialType.defaultPrice), key: materialType.key }));
      seen.add(materialKey);
    }

    if (!/(?:^|\s)(?:sam\s+material|sam\s+materiał|bez\s+prowadzenia|bez\s+robocizny)(?=\s|$)/i.test(clause)) {
      const laborType = detectCableLaborType(clause);
      const laborCatalog = findCatalogService('Przewody / Okablowanie', laborType.name) || findCatalogService('Kamery CCTV', laborType.name);
      const explicitLaborPrice = parseCableLaborPrice(clause);
      const laborKey = `${laborType.key}_${length}_${clause}`;
      if (!seen.has(laborKey)) {
        items.push(buildVoiceItem({ category: 'Przewody / Okablowanie', name: laborType.name, unit: 'mb', quantity: length, priceNet: explicitLaborPrice !== null ? explicitLaborPrice : number(laborCatalog?.price_net, laborType.priceNet), key: laborType.key }));
        seen.add(laborKey);
      }
    }
    usedFragments.push(clause);
  }
  return { items, usedFragments };
}

function detectCableMaterialType(text) {
  const source = String(text || '');
  if (/2\s*(?:x|×|razy)\s*0[.,]?5|2x0[.,]?5|2×0[.,]?5/i.test(source)) {
    return { key: 'cable_low_voltage_2x05', name: 'Przewód niskoprądowy 2×0,5', category: 'Przewody / Okablowanie', unit: 'mb', defaultPrice: 1.50, score: 100 };
  }
  // Samo „kabel zasilający” bez długości nie tworzy materiału. Trafia do braków danych.
  if (/zasilaj\w*|prad\w*|prąd\w*|elektryczn\w*/i.test(source) && !/ydyp|ydy|3\s*x\s*1[.,]?5|3\s*x\s*2[.,]?5/i.test(source)) {
    return null;
  }
  let best = null;
  for (const type of CABLE_MATERIAL_TYPES) {
    const score = type.score(source);
    if (score > 0 && (!best || score > best.score)) best = { ...type, score };
  }
  return best;
}

function previewItemEditorHtml(item, index, categoryOptions) {
  return `<article class="preview-item-editor" data-preview-index="${index}">
    <label>Usługa<input data-preview-field="name" value="${escapeAttr(item.name || '')}">${quoteItemBadgesHtml(item)}</label>
    <label>Ilość<input type="number" min="0" step="0.5" data-preview-field="quantity" value="${number(item.quantity, 1)}"></label>
    <label>Jm.<input data-preview-field="unit" value="${escapeAttr(item.unit || 'szt')}"></label>
    <label>Cena netto<input type="number" min="0" step="0.01" data-preview-field="priceNet" value="${number(item.priceNet, 0)}"></label>
    <div><span class="preview-line-total">${money(number(item.quantity, 1) * number(item.priceNet, 0))}</span></div>
    <button type="button" class="btn btn-danger" data-preview-delete="${index}">Usuń</button>
    <label style="display:none">Kategoria<select data-preview-field="category">${categoryOptions.replace(`value="${escapeAttr(item.category)}"`, `value="${escapeAttr(item.category)}" selected`)}</select></label>
  </article>`;
}

function bindParserPreviewEditors() {
  const content = $('parserPreviewContent');
  content.querySelectorAll('[data-parser-field]').forEach(input => {
    input.addEventListener('input', () => updatePendingParseField(input.dataset.parserField, input.value));
    input.addEventListener('change', () => updatePendingParseField(input.dataset.parserField, input.value));
  });
  content.querySelectorAll('[data-preview-field]').forEach(input => {
    input.addEventListener('input', () => updatePendingParseItem(input.closest('[data-preview-index]').dataset.previewIndex, input.dataset.previewField, input.value));
    input.addEventListener('change', () => updatePendingParseItem(input.closest('[data-preview-index]').dataset.previewIndex, input.dataset.previewField, input.value));
  });
  content.querySelectorAll('[data-preview-delete]').forEach(btn => btn.addEventListener('click', () => {
    if (!pendingParse) return;
    pendingParse.result.items.splice(number(btn.dataset.previewDelete, -1), 1);
    renderParserPreview(pendingParse.raw, pendingParse.result);
  }));
  const addBtn = $('addPreviewItemBtn');
  if (addBtn) addBtn.addEventListener('click', addPendingPreviewItem);
}

function updatePendingParseField(field, value) {
  if (!pendingParse) return;
  if (field === 'name') pendingParse.result.client.name = value.trim();
  else if (field === 'phone') pendingParse.result.client.phone = value.trim();
  else if (field === 'address') pendingParse.result.client.address = value.trim();
  else if (field === 'detectedType') pendingParse.result.detectedType = value;
  else if (['distanceKm', 'distanceRate', 'freeKm'].includes(field)) pendingParse.result[field] = value === '' ? null : number(value, 0);
}

function updatePendingParseItem(index, field, value) {
  if (!pendingParse) return;
  const item = pendingParse.result.items[number(index, -1)];
  if (!item) return;
  if (!item._originalPreview) item._originalPreview = { name: item.name, quantity: item.quantity, unit: item.unit, priceNet: item.priceNet, category: item.category };
  item.previewChanged = true;
  item[field] = field === 'quantity' || field === 'priceNet' ? number(value, 0) : value;
  const card = document.querySelector(`[data-preview-index="${index}"]`);
  if (card) card.querySelector('.preview-line-total').textContent = money(number(item.quantity, 1) * number(item.priceNet, 0));
}

function addPendingPreviewItem() {
  if (!pendingParse) return;
  pendingParse.result.items.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    category: pendingParse.result.detectedType || state.jobType || 'Serwis',
    name: 'Nowa pozycja',
    unit: 'szt',
    quantity: 1,
    priceNet: 0,
    parserSource: 'manual-preview',
    previewChanged: true
  });
  renderParserPreview(pendingParse.raw, pendingParse.result);
}

function acceptParserPreview() {
  if (!pendingParse) {
    showInfo('Nie ma rozbicia do zatwierdzenia. Najpierw kliknij „Analizuj wizytę”.');
    return;
  }
  syncFromForm();
  lastBreakdownSnapshot = structuredCloneSafe(state);
  const resultToApply = structuredCloneSafe(pendingParse.result);
  rememberPreviewCorrections(resultToApply);
  const selectedSurcharges = collectSelectedSurcharges(pendingParse.result);
  if (selectedSurcharges.length) resultToApply.items.push(...selectedSurcharges);
  applyParsedResult(pendingParse.raw, resultToApply);
  pendingParse = null;
  hideParserPreview();
  syncToForm();
  renderAll();
  $('undoParseBtn').hidden = false;
  showInfo(selectedSurcharges.length ? `Zatwierdzono rozbicie i dodano ${selectedSurcharges.length} wybraną dopłatę / dopłaty. Korekty z podglądu zostały zapisane do uczenia.` : 'Zatwierdzono rozbicie i dopisano dane do wyceny. Korekty z podglądu zostały zapisane do uczenia.');
}

function rememberPreviewCorrections(result) {
  for (const item of result.items || []) {
    if (item.previewChanged) rememberParserCorrection(item);
    delete item._originalPreview;
    delete item.previewChanged;
  }
}

function rememberParserCorrection(row) {
  if (!row || !row.learningSignature || row.parserSource === 'manual-preview') return;
  const data = loadLearnedRules();
  if (!data.genericRules) data.genericRules = {};
  const previous = data.rules[row.learningSignature];
  const record = {
    signature: row.learningSignature,
    genericSignature: makeGenericLearningSignature(row),
    parserKey: row.parserKey || row._voiceKey || '',
    category: row.category || 'Serwis',
    name: row.name || '',
    unit: row.unit || 'szt',
    quantity: number(row.quantity, 1),
    priceNet: number(row.priceNet, 0),
    learnedAt: new Date().toISOString(),
    uses: number(previous?.uses, 0) + 1
  };
  data.rules[row.learningSignature] = record;
  data.genericRules[record.genericSignature] = { ...record, generic: true };
  saveLearnedRules(data);
  renderLearnedRules();
}

function applyLearnedCorrections(rawText, items) {
  const data = loadLearnedRules();
  const applied = [];
  for (const item of items) {
    const signature = makeLearningSignature(rawText, item);
    item.parserSource = 'voice';
    item.parserKey = item._voiceKey || item.parserKey || item.name;
    item.learningSignature = signature;
    const exact = data.rules?.[signature];
    const generic = data.genericRules?.[makeGenericLearningSignature(item)];
    const learned = exact || generic;
    if (!learned) continue;
    item.category = learned.category || item.category;
    item.name = learned.name || item.name;
    item.unit = learned.unit || item.unit;
    item.priceNet = number(learned.priceNet, item.priceNet);
    if (exact) item.quantity = number(learned.quantity, item.quantity);
    item.learnedApplied = true;
    learned.uses = number(learned.uses, 0) + 1;
    applied.push(`${item.name}${exact ? '' : ' (reguła ogólna)'}`);
  }
  if (applied.length) saveLearnedRules(data);
  return applied;
}

function makeGenericLearningSignature(item) {
  return `generic|${String(item.parserKey || item._voiceKey || '').toLowerCase()}|${normalizeSpeechText(item.name || '')}|${String(item.unit || '').toLowerCase()}`;
}

function renderLearnedRules() {
  const box = $('learnedRulesView');
  if (!box) return;
  const data = loadLearnedRules();
  const rules = [...Object.values(data.rules || {}), ...Object.values(data.genericRules || {})]
    .sort((a, b) => String(b.learnedAt || '').localeCompare(String(a.learnedAt || '')))
    .slice(0, 80);
  if (!rules.length) {
    box.innerHTML = '<div class="preview-muted">Brak zapamiętanych korekt. Program zapisze korektę po zmianie pozycji z rozbicia tekstu — bezpośrednio w podglądzie albo już po zatwierdzeniu.</div>';
    return;
  }
  box.innerHTML = `<div class="learned-list">${rules.map(rule => `<div class="learned-rule"><strong>${escapeHtml(rule.name || '-')}</strong><span>${escapeHtml(rule.quantity)} ${escapeHtml(rule.unit || 'szt')} × ${money(rule.priceNet)}</span><small>${rule.generic ? 'reguła ogólna' : 'reguła dokładna'} • ${escapeHtml(rule.parserKey || '')} • użycia: ${number(rule.uses, 0)} • ${escapeHtml(formatDateTime(rule.learnedAt))}</small></div>`).join('')}</div>`;
}

function parseClientName(rawText) {
  const compact = cleanDictationSpaces(rawText);
  const cityAlternation = KNOWN_CITIES.map(escapeRegExp).join('|');
  const nameWord = '[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\'-]*';

  const directBeforeStreet = compact.match(new RegExp(String.raw`^\s*(${nameWord}\s+${nameWord})\s+(?:ul\.?|ulica)\b`, 'i'));
  if (directBeforeStreet) {
    const name = cleanNameFragment(directBeforeStreet[1]);
    if (isLikelyPersonName(name) && !/^(trzeba|zamontowac|zamontować)\b/i.test(name)) return name;
  }

  const inverseDuplicate = compact.match(new RegExp(String.raw`(?:ul\.?|ulica)\s+.+?\d+[a-zA-Z]?(?:/\d+)?\s+(?:${cityAlternation})\s+(${nameWord})\s+(${nameWord})\s+\2\s+\1\b`, 'i'));
  if (inverseDuplicate) {
    const name = cleanNameFragment(`${inverseDuplicate[2]} ${inverseDuplicate[1]}`);
    if (isLikelyPersonName(name)) return name;
  }

  const nameBeforeCityStreet = compact.match(new RegExp(String.raw`^\s*(${nameWord}\s+${nameWord})\s+(?:${cityAlternation})\s+(?:ul\.?|ulica)\b`, 'i'));
  if (nameBeforeCityStreet) {
    const name = cleanNameFragment(nameBeforeCityStreet[1]);
    if (isLikelyPersonName(name)) return name;
  }

  const repeatedName = compact.match(new RegExp(String.raw`(?:ul\.?|ulica)\s+.+?\d+[a-zA-Z]?(?:/\d+)?\s+(?:${cityAlternation})\s+(${nameWord}\s+${nameWord})\s+\1\b`, 'i'));
  if (repeatedName) {
    const name = cleanNameFragment(repeatedName[1]);
    if (isLikelyPersonName(name)) return name;
  }

  const afterAddress = compact.match(new RegExp(String.raw`(?:ul\.?|ulica)\s+.+?\d+[a-zA-Z]?(?:/\d+)?\s+(?:${cityAlternation})\s+(${nameWord}\s+${nameWord})(?=\s+(?:${cityAlternation}|ul\.?|ulica|trzeba|montaz|montaż|montowal|montował|montowali|kamera|kamery|kabel|przewod|przewód|puszka|puszki)\b|$)`, 'i'));
  if (afterAddress) {
    const name = cleanNameFragment(afterAddress[1]);
    if (isLikelyPersonName(name) && !/^(trzeba|mielec)\b/i.test(name)) return name;
  }

  const explicit = compact.match(/(?:klientka|klient|pan|pani|nazwisko|imię|imie)\s+(?:to\s+|jest\s+)?([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-']*(?:\s+[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-']*){1,3})/i);
  if (explicit) {
    const name = cleanNameFragment(explicit[1]);
    if (isLikelyPersonName(name) && !/^(trzeba|zamontowac|zamontować)\b/i.test(name)) return name;
  }

  const beforeAddress = compact.match(/^(.{3,80}?)(?=\s+(?:ul\.?|ulica|adres|przy ulicy|na adres|pod adresem)\s+)/i);
  if (beforeAddress) {
    const name = cleanNameFragment(beforeAddress[1]);
    if (isLikelyPersonName(name) && !/^(trzeba|zamontowac|zamontować)\b/i.test(name)) return name;
  }
  return '';
}

function parseBoxMaterialLoose(text, kind) {
  const source = String(text || '');
  const isElectrical = kind === 'electrical';
  const priced = parseBoxMaterial(source, isElectrical ? 'prad' : 'montaz', isElectrical ? 'Puszka prądowa' : 'Puszka montażowa pod kamerę', isElectrical ? 'electrical_box' : 'mounting_box_material');
  if (priced) return priced;

  const name = isElectrical ? 'Puszka prądowa' : 'Montaż puszki / uchwytu kamery';
  const key = isElectrical ? 'electrical_box' : 'box_holder';
  const catalog = findCatalogService('Kamery CCTV', name) || findCatalogService('Kamery CCTV', isElectrical ? 'Puszka prądowa' : 'Puszka montażowa pod kamerę');
  const price = number(catalog?.price_net, isElectrical ? 20 : 45);
  const patterns = isElectrical
    ? [/(\d+(?:[.]\d+)?)\s+puszk\w*\s+prad\w*/i, /puszk\w*\s+prad\w*\D{0,30}(\d+(?:[.]\d+)?)/i, /(jedna|dwie|dwa|trzy|cztery)\s+puszk\w*\s+prad\w*/i]
    : [/(\d+(?:[.]\d+)?)\s+puszk\w*(?:\s+(?:oryginaln\w*|montaz\w*|pod\s+kamer\w*))?/i, /(dwie|dwa|trzy|cztery|jedna)\s+puszk\w*(?:\s+(?:oryginaln\w*|montaz\w*|pod\s+kamer\w*))?/i];
  for (const re of patterns) {
    const m = source.match(re);
    if (!m) continue;
    const qty = number(baseNormalizeSpeechText(m[1]), number(m[1], 1));
    if (qty > 0) return buildVoiceItem({ category: 'Kamery CCTV', name, unit: 'szt', quantity: qty, priceNet: price, key });
  }
  return null;
}

function parseTranscriptAddress(rawText) {
  const raw = String(rawText || '').replace(/\\/g, ' / ').replace(/_/g, ' ');
  const candidates = [];
  const add = (street, numberPart, flat, index) => {
    let st = cleanAddressFragment(String(street || '').replace(/\bul\.?\s*/i, ''), true);
    st = st.replace(/^ul\.?\s+/i, '');
    st = st.replace(/\b(wycena|kamera|kamery|m4a|mp3|wav|start|godzina).*$/i, '').trim();
    if (!st || /^(m[oó]j dysk|dysk|urecorder|run|transkrypcja)$/i.test(st)) return;
    if (!/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(st)) st = titleCase(st);
    const nr = String(numberPart || '').trim() + (flat ? `/${String(flat).trim()}` : '');
    if (!nr || /\d{2}:\d{2}/.test(nr)) return;
    candidates.push({ value: `ul. ${st} ${nr}`, index: number(index, 0) });
  };

  const addressLike = /(?:^|[\s\/])(?:ul\.?\s*)?([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-]{2,}(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\-]{2,}){0,2})\s+(\d+[a-zA-Z]?)(?:\s*(?:\/|przez)\s*(\d+[a-zA-Z]?))?(?=(?:\s|,|\.|-)+(?:wycena|kamer|start|m4a|mp3|wav|$))/gi;
  for (const m of raw.matchAll(addressLike)) add(m[1], m[2], m[3], m.index);

  const timedStart = raw.match(/\[00:00:0?1\]\s*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]+?)\s+(\d+[a-zA-Z]?)(?:\s*(?:\/|przez)\s*(\d+[a-zA-Z]?))?,?\s*start/i);
  if (timedStart) add(timedStart[1], timedStart[2], timedStart[3], 0);

  if (!candidates.length) return '';
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0].value;
}

function parseClientAddress(rawText, normalizedText) {
  const transcriptAddress = parseTranscriptAddress(rawText);
  if (transcriptAddress) return transcriptAddress;

  const compact = cleanDictationSpaces(rawText);
  const cityAlternation = KNOWN_CITIES.map(escapeRegExp).join('|');
  const candidates = [];
  const addCandidate = (street, nr, city, index) => {
    if (!street || !nr) return;
    const address = cleanAddressFragment(`${street} ${nr}`, true);
    candidates.push({ address: joinAddressAndCity(address, titleCase(city || parseCity(compact) || '')), index: number(index, 0) });
  };

  for (const match of compact.matchAll(new RegExp(String.raw`(?:^|\s)(?:ul\.?|ulica)\s+([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]{2,50}?)\s+(\d+[a-zA-Z]?(?:/\d+)?)\s+(${cityAlternation})\b`, 'ig'))) addCandidate(match[1], match[2], match[3], match.index);
  for (const match of compact.matchAll(new RegExp(String.raw`(?:^|\s)(${cityAlternation})\s+(?:ul\.?|ulica)\s+([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]{2,50}?)\s+(\d+[a-zA-Z]?(?:/\d+)?)\b`, 'ig'))) addCandidate(match[2], match[3], match[1], match.index);
  for (const match of compact.matchAll(new RegExp(String.raw`(?:^|\s)(?:ul\.?|ulica)\s+([a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\- ]{2,50}?)\s+(\d+[a-zA-Z]?(?:/\d+)?)\b`, 'ig'))) {
    const tail = compact.slice(match.index, Math.min(compact.length, match.index + 95));
    const city = findKnownCityInText(tail) || parseCity(compact);
    addCandidate(match[1], match[2], city, match.index);
  }

  if (candidates.length) {
    const withCity = candidates.filter(c => /,\s*\S+/.test(c.address));
    return (withCity.length ? withCity : candidates).sort((a, b) => b.index - a.index)[0].address;
  }

  const explicitStreet = compact.match(/(?:adres|ulica|ul\.?|przy\s+ulicy)\s+(.{3,140})/i);
  if (explicitStreet) {
    const rawAddress = cutAtAddressStop(explicitStreet[1]);
    const cityFromAddress = findKnownCityInText(rawAddress);
    const address = cleanAddressFragment(removeKnownCityFromAddress(rawAddress), true);
    return joinAddressAndCity(address, parseCity(compact) || cityFromAddress);
  }
  return '';
}

function parseSmartCommand(rawText) {
  const isTranscript = isVisitTranscript(rawText);
  const focusedText = buildFocusedTranscriptText(rawText);
  const text = normalizeSpeechText(focusedText);
  const client = parseClientData(rawText, text);
  const itemText = stripClientFragmentsForItems(text);
  const transcriptInfo = analyzeVisitTranscript(rawText, focusedText);
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
  if (/podglad.{0,30}(telefon|aplikacj)|podgląd.{0,30}(telefon|aplikacj)/i.test(text) && !items.some(i => /podgląd zdalny|podglad zdalny/i.test(i.name))) {
    const catalog = findCatalogService('Kamery CCTV', 'Uruchomienie podglądu zdalnego');
    items.push(buildVoiceItem({ category: 'Kamery CCTV', name: 'Uruchomienie podglądu zdalnego', unit: 'usł', quantity: 1, priceNet: number(catalog?.price_net, 150), key: 'remote_preview' }));
  }
  const suppressedKeys = new Set(special.suppressedKeys || []);

  const found = findVoiceMatches(itemText).filter(match => !suppressedKeys.has(match.rule.key));
  for (const match of found) {
    if (items.some(item => item._voiceKey === match.rule.key)) continue;
    const context = getItemContext(itemText, match.index);
    if (isTranscript && ['camera', 'ptz', 'box_holder', 'electrical_box'].includes(match.rule.key) && !hasExplicitQuantityForTranscript(context, match.rule.key)) continue;
    const quantityInfo = match.rule.key === 'camera'
      ? { quantity: extractCameraQuantity(itemText) || parseQuantityForRule(context, match.rule).quantity, unit: match.rule.unit }
      : parseQuantityForRule(context, match.rule);
    const price = parsePriceNear(context, quantityInfo.unit || match.rule.unit);
    const catalog = findCatalogService(match.rule.category, match.rule.name);
    items.push(buildVoiceItem({
      category: match.rule.category,
      name: match.rule.name,
      unit: quantityInfo.unit || match.rule.unit,
      quantity: quantityInfo.quantity,
      priceNet: price !== null ? price : number(catalog?.price_net, 0),
      key: match.rule.key
    }));
  }

  const mergedItems = mergeParserItems(items);
  const detectedTypes = detectTypes(itemText);
  const detectedType = detectedTypes.includes('Kamery CCTV') || /wycena\s+kamer|kamera|kamery|monitoring/i.test(focusedText)
    ? 'Kamery CCTV'
    : (mergedItems.find(i => i.category !== 'Przewody / Okablowanie' && i.category !== 'Złącza / Akcesoria')?.category || detectedTypes[0] || mergedItems[0]?.category || '');

  const clauses = itemText.split(/[.;,\n]+|\s+oraz\s+/).map(x => x.trim()).filter(Boolean);
  for (const clause of clauses) {
    const hasKnown = found.some(match => clause.includes(match.keyword)) || special.usedFragments.some(fragment => clause.includes(fragment));
    const looksLikePrice = /\d+[,.]?\d*\s*(zł|zl|pln|m|mb|km|szt|godz)/i.test(clause);
    if (!hasKnown && looksLikePrice && !/dojazd/.test(clause) && !looksLikeCableClause(clause) && !looksLikeAccessoryClause(clause) && !/listw/i.test(clause)) unknown.push(clause);
  }

  const learnedApplied = applyLearnedCorrections(rawText, mergedItems);
  const surchargeSuggestions = detectSurchargeSuggestions(rawText, itemText);
  const missingData = detectMissingData(rawText, { client, items: mergedItems, detectedType, distanceKm, distanceRate, freeKm, transcriptInfo });
  for (const f of transcriptInfo.followUps || []) if (!missingData.includes(f)) missingData.push(f);
  for (const item of mergedItems) delete item._voiceKey;
  return { client, items: mergedItems, detectedType, distanceKm, distanceRate, freeKm, unknown, learnedApplied, missingData, surchargeSuggestions, transcriptInfo };
}

function parseCameraTypeBreakdown(text) {
  const source = String(text || '');
  const out = [];
  const add = (qty, name, fallback, key) => {
    const catalog = findCatalogService('Kamery CCTV', name);
    out.push(buildVoiceItem({ category: 'Kamery CCTV', name, unit: 'szt', quantity: qty, priceNet: number(catalog?.price_net, fallback), key }));
  };
  const tube = source.match(/(\d+(?:[.]\d+)?)\s+kamer\w*\s+(?:tubow\w*|zewnetrzn\w*|zewnętrzn\w*)/i);
  const ptz = source.match(/(\d+(?:[.]\d+)?)\s+kamer\w*\s+(?:obrotow\w*|ptz)/i);
  const total = extractCameraQuantity(source) || 0;
  if (tube) add(number(tube[1], 1), 'Montaż kamery IP zewnętrznej', 260, 'camera_tube');
  if (ptz) add(number(ptz[1], 1), 'Montaż kamery obrotowej PTZ', 420, 'camera_ptz');
  if (!tube && !ptz && total > 0 && /obrotow\w*|ptz/i.test(source)) add(total, 'Montaż kamery obrotowej PTZ', 420, 'camera_ptz');
  return out;
}

function parseListwaVoiceItems(text) {
  const items = [];
  const usedFragments = [];
  const source = String(text || '');
  const patterns = [
    /(\d+(?:[.]\d+)?)\s*(?:m|mb)\s+[^,.!?;]{0,60}?listw\w*/gi,
    /listw\w*[^,.!?;]{0,40}?(\d+(?:[.]\d+)?)\s*(?:m|mb)/gi,
    /korytk\w*[^,.!?;]{0,40}?(\d+(?:[.]\d+)?)\s*(?:m|mb)/gi
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) {
      const qty = number(m[1], 0);
      if (qty <= 0) continue;
      const exists = items.some(x => number(x.quantity, 0) === qty && x.name === 'Maskowanie przewodu listwą');
      if (exists) continue;
      const catalog = findCatalogService('Kamery CCTV', 'Maskowanie przewodu listwą') || findCatalogService('Przewody / Okablowanie', 'Prowadzenie przewodu w listwie');
      items.push(buildVoiceItem({ category: 'Kamery CCTV', name: 'Maskowanie przewodu listwą', unit: 'mb', quantity: qty, priceNet: number(catalog?.price_net, 10), key: 'masking_strip' }));
      usedFragments.push(m[0]);
    }
  }
  return { items, usedFragments };
}

function detectMissingData(rawText, result) {
  const text = normalizeSpeechText(rawText);
  const missing = [];
  const name = result.client?.name || state.clientName || '';
  const phone = result.client?.phone || state.clientPhone || '';
  const address = result.client?.address || state.clientAddress || '';
  const isTranscript = result.transcriptInfo?.isTranscript || isVisitTranscript(rawText);
  const hasDateInText = /\b(jutro|dzisiaj|dziś|pojutrze|poniedzial\w*|poniedział\w*|wtork\w*|srod\w*|środ\w*|czwart\w*|piatk\w*|piątk\w*|sobot\w*|niedziel\w*|\d{1,2}[.\-/]\d{1,2}(?:[.\-/]\d{2,4})?)\b/i.test(rawText);
  const hasCamera = /kamer\w*|monitoring|cctv/i.test(text) || result.items.some(item => /kamer|monitoring|cctv/i.test(item.name));
  const hasCableWords = /\b(kabel|kabla|przewod|przewodu|przewód|przewody|skretk\w*|skrętk\w*|ydyp|ydy|listw\w*|korytk\w*)\b/i.test(text);
  const hasCableItem = result.items.some(item => String(item.unit || '').toLowerCase() === 'mb' || /kabel|przewod|przewód|skretk|skrętk|rg6|listw/i.test(item.name));

  if (!name) missing.push(isTranscript ? 'imię i nazwisko klienta — w transkrypcji nie ma jednoznacznej deklaracji klienta' : 'imię i nazwisko klienta');
  if (!phone) missing.push('numer telefonu klienta');
  if (!address) missing.push('adres / miejscowość montażu');
  if (!hasDateInText) missing.push('data lub termin wizyty nie wynika z dyktowania — sprawdź datę w formularzu');
  if (result.distanceKm === null && number(state.distanceKm, 0) <= 0) missing.push('dojazd w km albo informacja, że dojazd nie jest liczony');
  if (!/netto|brutto/i.test(rawText)) missing.push('czy podane ceny są netto czy brutto — program domyślnie traktuje je jako netto');
  if (/kabel\s+zasilaj\w*|przewod\w*\s+zasilaj\w*/i.test(text) && !/(kabel\s+zasilaj\w*|przewod\w*\s+zasilaj\w*)\D{0,35}\d+(?:[.]\d+)?\s*(?:m|mb)/i.test(text)) missing.push('kabel zasilający: brak długości — nie doliczono go automatycznie');

  if (hasCamera) {
    if (!/poe|wi\s*-?\s*fi|wifi|bezprzewod|gniazdko|zasilaj|prad|prąd/i.test(text)) missing.push('przy kamerach: czy są PoE / przewodowe czy Wi‑Fi');
    if (!/zewnetrzn|zewnętrzn|wewnetrzn|wewnętrzn|elewacj|sufit|scian|ścian|komin|maszt|strych|wysoko|drabin|dach|klatce|schodowej|podbitk|rynnie|rynn/i.test(text)) missing.push('przy kamerach: miejsce montażu i warunki dostępu');
    if (!/rejestrator|nvr|dvr|switch|dysk|karta|nagrywa|zapis/i.test(text)) missing.push('przy kamerach: czy jest rejestrator / switch PoE / zapis nagrań');
    if (isTranscript && !/\b\d+\s+kamer/i.test(text)) missing.push('liczba kamer do wyceny jest niepewna — transkrypcja opisuje warianty, ale nie podaje jasnej ilości');
  }
  if (hasCableWords && !hasCableItem) missing.push('przy przewodach: długość w metrach i typ przewodu');
  if (isTranscript && /strych|poddasz|podbitk|sąsiad|sasiad/i.test(text)) missing.push('sprawdzić dostęp do strychu / podbitki / sąsiada przed ostateczną ofertą');
  if (looksLikeAccessoryClause(text) && !result.items.some(item => item.category === 'Złącza / Akcesoria')) missing.push('przy złączach / osprzęcie: typ i ilość, np. F kompresyjne, F nakręcane, RJ45 Cat 6, rozgałęźnik 2-drożny');
  return [...new Set(missing)];
}

function applyParsedResult(raw, result) {
  if (result.client.name) state.clientName = result.client.name;
  if (result.client.phone) state.clientPhone = result.client.phone;
  if (result.client.address) state.clientAddress = result.client.address;
  if (result.distanceKm !== null) state.distanceKm = result.distanceKm;
  if (result.distanceRate !== null) state.distanceRate = result.distanceRate;
  if (result.freeKm !== null) state.freeKm = result.freeKm;
  if (result.detectedType) state.jobType = result.detectedType;
  const note = result.transcriptInfo?.isTranscript ? buildTranscriptNoteForQuote(result.transcriptInfo, raw) : raw;
  state.notes = appendUniqueNote(state.notes, note);
  state.services.push(...result.items.map(item => ({ ...item, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()) })));
}

function buildTranscriptNoteForQuote(info, raw) {
  const lines = ['Analiza transkrypcji wizyty:'];
  if (info.findings?.length) lines.push('Fakty: ' + info.findings.join('; '));
  if (info.options?.length) lines.push('Warianty/opcje: ' + info.options.join('; '));
  if (info.rejected?.length) lines.push('Odrzucone: ' + info.rejected.join('; '));
  if (info.followUps?.length) lines.push('Do sprawdzenia: ' + info.followUps.join('; '));
  const rawAddress = parseTranscriptAddress(raw);
  if (rawAddress) lines.push('Adres źródłowy: ' + rawAddress);
  return lines.join('\n');
}

function createQuoteFromParsedResult(raw, result) {
  const quote = createEmptyQuote();
  quote.clientName = result.client.name || '';
  quote.clientPhone = result.client.phone || '';
  quote.clientAddress = result.client.address || '';
  quote.jobType = result.detectedType || 'Kamery CCTV';
  quote.notes = result.transcriptInfo?.isTranscript ? buildTranscriptNoteForQuote(result.transcriptInfo, raw) : (raw || '');
  quote.distanceKm = result.distanceKm !== null ? result.distanceKm : 0;
  quote.distanceRate = result.distanceRate !== null ? result.distanceRate : 2;
  quote.freeKm = result.freeKm !== null ? result.freeKm : 20;
  quote.services = result.items.map(item => ({ ...item, id: item.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())) }));
  return quote;
}

function seedBuiltInLearningForInstaller() {
  const remote = VOICE_ITEM_RULES.find(rule => rule.key === 'remote_preview');
  if (remote) {
    ['podgląd na telefon', 'podglad na telefon', 'podgląd w aplikacji', 'podglad w aplikacji'].forEach(k => { if (!remote.keywords.includes(k)) remote.keywords.push(k); });
  }
  const cable = VOICE_ITEM_RULES.find(rule => rule.key === 'cable_lan');
  if (cable) {
    ['korytko', 'listwa maskująca', 'listwy maskujące', 'listwy mastujące'].forEach(k => { if (!cable.keywords.includes(k)) cable.keywords.push(k); });
  }
}

function hasExplicitQuantityForTranscript(context, key) {
  const text = normalizeSpeechText(context || '');
  const qtyWord = '(?:\\d+(?:[.]\\d+)?|jeden|jedna|jedno|dwa|dwie|trzy|cztery|piec|pięć|szesc|sześć|siedem|osiem|dziewiec|dziewięć|dziesiec|dziesięć)';
  if (key === 'camera' || key === 'ptz') return new RegExp('\\b' + qtyWord + '\\s+kamer\\w*', 'i').test(text);
  if (key === 'box_holder' || key === 'electrical_box') return new RegExp('\\b' + qtyWord + '\\s+puszk\\w*', 'i').test(text);
  return false;
}

function renderArchiveLearningView() {
  const box = $('archiveLearningView');
  if (!box) return;
  const rows = Object.entries(INSTALLER_ARCHIVE_TRAINING.categories)
    .map(([name, count]) => `<div class="archive-learning-pill"><strong>${escapeHtml(name)}</strong><span>${count} trafień w archiwum</span><small>Reguły używane przy analizie transkrypcji, korektach nazw i wykrywaniu wariantów.</small></div>`)
    .join('');
  box.innerHTML = rows + `<div class="archive-learning-pill"><strong>Słownik błędów transkrypcji</strong><span>${INSTALLER_BUILTIN_PHRASE_RULES.length} wbudowanych zamian</span><small>Pełne rozmowy nie są wbudowane w aplikację; zapisane są tylko wzorce i korekty.</small></div>`;
}

function installerStripTranscriptNoise(rawText) {
  return String(rawText || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^=+$/.test(line) && !/^-+$/.test(line))
    .filter(line => !/^RUN:|^large\s*\||^temperature=|^\[INFO\]|^\[ERROR\]|^\[Wykryty język|^TRANSKRYPCJA:|^F:\\|^[-=]/i.test(line))
    .map(line => line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/g, '').trim())
    .filter(line => line && !/^(dziękuję|dziekuje|tak|no|aha|okej|dobra|super|do widzenia|wielkie dzięki.*kolejnych odcinkach)$/i.test(line))
    .join('. ');
}

function installerLikelyAddressName(name) {
  const n = String(name || '').toLowerCase();
  return /skiego$|ckiego$|kiego$|owej$|owa$|owska$|arska$|erska$|owa$|ego$|iej$|na$|ska$|szereg|kosmonaut|partyzant|wolnosci|wolności|ogrodowa|sielska|kossaka|limanowskiego|poniatowskiego|bajana|modelarska|lwowska|ducha|dzialkowcow|działkowców/i.test(n);
}

function installerCleanTitleFromTranscript(rawText) {
  const raw = String(rawText || '');
  const m = raw.match(/TRANSKRYPCJA:\s*([^\n\r]+?\.(?:m4a|mp3|wav|aac))/i) || raw.match(/URecorder[^\n\r\\/]*[\\/](.+?\.(?:m4a|mp3|wav|aac))/i);
  let title = m ? m[1] : '';
  title = title.replace(/.*[\\/]/g, '').replace(/\.(m4a|mp3|wav|aac)$/i, '');
  return title.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function installerAddressFromPhrase(source, preferNoStreetPrefix = false) {
  const text = String(source || '').replace(/_/g, ' ').replace(/\b(przez)\s+(\d+[a-z]?)\b/gi, '/$2').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const patterns = [
    /\bul\.?\s+([A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ .-]{2,60}?)\s+(\d+[a-zA-Z]?(?:\s*\/\s*\d+[a-zA-Z]?)?)/i,
    /\b([A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}){0,2})\s+(\d+[a-zA-Z]?(?:\s*\/\s*\d+[a-zA-Z]?)?)/i
  ];
  const stopTail = /\b(wycena|kamera|kamery|montaz|montaż|router|internet|tp\s*-?\s*link|podlaczenie|podłączenie|v\d+|fv\d+|start|godzina|u mnie|rozliczenie|naprawa|zakladanie|zakładanie|txt|m4a)\b.*$/i;
  for (const pat of patterns) {
    const m = text.match(pat);
    if (!m) continue;
    let street = cleanAddressFragment(m[1].replace(stopTail, '').trim(), false);
    let nr = String(m[2] || '').replace(/\s+/g, '').replace(/\/+/g, '/');
    if (!street || !nr || /\d{1,2}:\d{2}/.test(nr)) continue;
    const prefix = preferNoStreetPrefix || (!/^ul\.?/i.test(source) && !installerLikelyAddressName(street)) ? '' : 'ul. ';
    return `${prefix}${street} ${nr}`.replace(/\s+/g, ' ').trim();
  }
  return '';
}

function installerScoreJobTypes(text) {
  const src = normalizeSpeechText(text);
  const scores = {};
  const add = (cat, pts) => { scores[cat] = (scores[cat] || 0) + pts; };
  const count = (re) => (src.match(re) || []).length;
  add('Kamery CCTV', count(/\b(kamera|kamery|kamer|monitoring|rejestrator|nvr|dvr|poe|podglad zdalny|obrotow|ptz|tubow)\b/g) * 5);
  add('Sieć / Wi‑Fi', count(/\b(router|internet|wifi|wi-fi|lan|rj45|switch|tp-link|access point|mesh|modem|swiatlowod|światłowód)\b/g) * 4);
  add('Anteny / Sygnał', count(/\b(antena|anteny|antenowy|dvb|satelit|konwerter|talerz|dekoder|mux|polsat|canal|sygnal)\b/g) * 4);
  add('TV / Montaż', count(/\b(telewizor|tv|uchwyt|wieszak|smart tv|powiesic|powiesić|wniesienie)\b/g) * 4);
  add('Komputery / Telefony', count(/\b(laptop|komputer|windows|telefon|samsung|huawei|drukarka|facebook|poczta|haslo|hasło|tablet|dysk)\b/g) * 3);
  add('Prace drobne', count(/\b(klamka|zamek|drzwi|zawias)\b/g) * 5);
  add('Domofon', count(/\b(domofon|wideodomofon|unifon|elektrozaczep|furtka)\b/g) * 5);
  add('Alarm', count(/\b(alarm|czujka|pir|sygnalizator|centrala alarmowa)\b/g) * 5);
  if (/\b(przewod|przewód|kabel|listwa|korytko|peszel|cat\s*\d|rg6|ydyp)\b/.test(src)) add('Przewody / Okablowanie', 2);
  if (/\b(zlacze|złącze|wtyk|rj45|beczka|rozgaleznik|rozgałęźnik|zasilacz|wzmacniacz)\b/.test(src)) add('Złącza / Akcesoria', 2);
  return Object.entries(scores).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
}

function installerSplitSentences(rawText) {
  const cleaned = installerStripTranscriptNoise(rawText);
  return cleaned.split(/(?<=[.!?])\s+|[\n;]+/).map(x => x.trim()).filter(Boolean);
}

function installerClauseHasDecision(clause, isTranscript) {
  if (!isTranscript) return true;
  if (INSTALLER_DECISION_PHRASES.test(clause)) return true;
  if (/\b\d+\s+(?:kamer|kabli|przewod|przewód|m|mb|puszk|złącz|zlacz|rj45|gniazd|router|anten|telewizor)/i.test(clause)) return true;
  return !INSTALLER_CONTEXT_STOP_PHRASES.test(clause);
}

function parseArchiveTrainedServiceItems(text, isTranscript) {
  const items = [];
  const usedFragments = [];
  const add = (category, name, unit, qty, fallback, key, fragment) => {
    if (isTranscript && !installerClauseHasDecision(fragment || text, true)) return;
    if (items.some(i => i._voiceKey === key && i.name === name)) return;
    const catalog = findCatalogService(category, name);
    items.push(buildVoiceItem({ category, name, unit, quantity: qty || 1, priceNet: number(catalog?.price_net, fallback), key }));
    if (fragment) usedFragments.push(fragment);
  };
  const clauses = String(text || '').split(/[.;\n]+|\s+oraz\s+/).map(x => x.trim()).filter(Boolean);
  for (const clause of clauses) {
    if (/router|tp\s*-?\s*link|access point/i.test(clause)) add('Sieć / Wi‑Fi', /access point/i.test(clause) ? 'Konfiguracja access pointa' : 'Konfiguracja routera', 'usł', 1, 180, 'router_config_archive', clause);
    if (/repeater|wzmacniacz\s+wifi|wzmacniacz\s+wi-fi/i.test(clause)) add('Sieć / Wi‑Fi', 'Konfiguracja repeatera Wi‑Fi', 'usł', 1, 130, 'wifi_repeater_archive', clause);
    if (/mesh/i.test(clause)) add('Sieć / Wi‑Fi', 'Konfiguracja sieci mesh', 'usł', 1, 240, 'wifi_mesh_archive', clause);
    if (/drukark/i.test(clause)) add('Sieć / Wi‑Fi', 'Konfiguracja drukarki sieciowej', 'usł', 1, 100, 'network_printer_archive', clause);
    if (/ustawien\w* anten|ustawic\w* anten|ustawić\w* anten|sygnal|sygnał|pomiar/i.test(clause) && /anten|dvb|sat/i.test(clause)) add('Anteny / Sygnał', /sat|satelit/i.test(clause) ? 'Ustawienie anteny satelitarnej' : 'Ustawienie anteny DVB-T', 'usł', 1, /sat|satelit/i.test(clause) ? 220 : 180, 'antenna_alignment_archive', clause);
    if (/montaz\w* anten|montaż\w* anten|zakladanie\w* anten|zakładanie\w* anten/i.test(clause)) add('Anteny / Sygnał', /sat|satelit|talerz/i.test(clause) ? 'Montaż anteny satelitarnej' : 'Montaż anteny DVB-T', 'szt', 1, /sat|satelit|talerz/i.test(clause) ? 320 : 280, 'antenna_mount_archive', clause);
    if (/konwerter/i.test(clause)) add('Anteny / Sygnał', /quad/i.test(clause) ? 'Wymiana konwertera QUAD' : 'Wymiana konwertera TWIN', 'szt', 1, /quad/i.test(clause) ? 130 : 110, 'lnb_archive', clause);
    if (/dekoder/i.test(clause)) add('Anteny / Sygnał', 'Konfiguracja dekodera', 'usł', 1, 90, 'decoder_archive', clause);
    if (/telewizor|\btv\b/i.test(clause) && /wieszak|uchwyt|powiesic|powiesić|montaz|montaż/i.test(clause)) add('TV / Montaż', 'Montaż telewizora na ścianie', 'szt', 1, 180, 'tv_wall_mount_archive', clause);
    if (/smart\s*tv|konfigurac\w* telewizor/i.test(clause)) add('TV / Montaż', 'Konfiguracja telewizora / Smart TV', 'usł', 1, 120, 'smart_tv_archive', clause);
    if (/laptop|komputer|windows/i.test(clause) && /instal|konfigur|napraw|diagnoz|system/i.test(clause)) add('Komputery / Telefony', /windows|system/i.test(clause) ? 'Instalacja / konfiguracja Windows' : 'Diagnostyka komputera / laptopa', 'usł', 1, /windows|system/i.test(clause) ? 180 : 120, 'computer_archive', clause);
    if (/telefon|samsung|huawei|android/i.test(clause) && /konfigur|przywrac|reklamac|aplikac|konto|poczta|facebook/i.test(clause)) add('Komputery / Telefony', /reklamac|przywrac/i.test(clause) ? 'Przywracanie telefonu po serwisie / reklamacji' : 'Konfiguracja telefonu', 'usł', 1, /reklamac|przywrac/i.test(clause) ? 120 : 100, 'phone_archive', clause);
    if (/klamk/i.test(clause)) add('Prace drobne', 'Montaż / naprawa klamki', 'szt', 1, 120, 'door_handle_archive', clause);
    if (/zamek|zamka/i.test(clause)) add('Prace drobne', 'Wymiana zamka', 'szt', 1, 150, 'lock_archive', clause);
  }
  return { items, usedFragments };
}

function isLikelyHumanName(text) {
  const value = String(text || '').trim();
  if (!value || value.split(/\s+/).length < 2) return false;
  if (/(ulica|mielec|wadowice|ogrodowa|sielska|limanowskiego|kossaka|bajana|wolnosci|wolności|top gaz|fitcake|szkola|szkoła|centrum|medyczne|mój dysk|urecorder|trzeba|montaz|montaż|kamera|router|internet)/i.test(value)) return false;
  return /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+$/.test(value);
}

function installerKnownCityFromText(text) {
  const cities = ['Mielec','Tarnów','Tarnow','Rzeszów','Rzeszow','Dębica','Debica','Kolbuszowa','Przecław','Przeclaw','Radomyśl','Radomysl','Wadowice Górne','Wadowice Dolne','Złotniki','Zlotniki','Trzciana','Borowa','Malinie','Ruda','Jamy','Połaniec','Polaniec','Grochowe','Czermin','Chorzelów','Chorzelow','Tuszów Narodowy','Tuszow Narodowy','Wampierzów','Wampierzow','Łysaków','Lysakow','Wola Pławska','Wola Plawska','Trześń','Trzesn'];
  const source = String(text || '');
  for (const city of cities) {
    const re = new RegExp(`\\b${escapeRegExp(city)}\\b`, 'i');
    if (re.test(source)) return titleCase(city);
  }
  return '';
}

function installerJoinAddressCity(address, city) {
  const a = String(address || '').replace(/,\s*$/,'').trim();
  const c = String(city || '').trim();
  if (!a) return c;
  if (!c || new RegExp(`\\b${escapeRegExp(c)}\\b`, 'i').test(a)) return a;
  return `${a}, ${c}`;
}

function installerTranscriptItemCertain(item, focusedText) {
  const name = String(item.name || '').toLowerCase();
  const text = normalizeSpeechText(focusedText || '');
  if (/montaz kamery|montaż kamery|kamera ip|kamera obrotowa|kamera tubowa/.test(name)) return /\b\d+\s+kamer/.test(text) && INSTALLER_DECISION_PHRASES.test(text);
  if (/router|access point|repeater|mesh/.test(name)) return /\b(zakladanie routera|zakładanie routera|konfiguracja routera|montaz routera|montaż routera|podlaczenie internetu|podłączenie internetu|robimy internet|do wyceny.*router)\b/i.test(focusedText);
  if (/rozgałęźnik|rozgaleznik|złącze|zlacze|wtyk|rj45|beczka|zasilacz|wzmacniacz/.test(name)) return /\b\d+\s*(?:szt|złącz|zlacz|wtyk|rj45|beczk|rozga)/i.test(text) && !INSTALLER_CONTEXT_STOP_PHRASES.test(focusedText);
  if (String(item.unit || '').toLowerCase() === 'mb') return /\b\d+(?:[.]\d+)?\s*(?:m|mb)\b/i.test(text) && !INSTALLER_CONTEXT_STOP_PHRASES.test(focusedText);
  if (/podglad zdalny|podgląd zdalny/.test(name)) return /klient.*podglad|klient.*podgląd|chce.*podglad|chce.*podgląd|ma byc.*podglad|ma być.*podgląd/i.test(focusedText);
  if (/diagnostyka|serwis/.test(name)) return false;
  return INSTALLER_DECISION_PHRASES.test(focusedText);
}

function installerParseCameraBreakdownV25(text) {
  const source = String(text || '');
  const total = extractCameraQuantity(source) || 0;
  let tubeQty = 0;
  let ptzQty = 0;

  const explicitTube = source.match(/(\d+(?:[.]\d+)?)\s+kamer\w*\s+(?:tubow\w*|zewnetrzn\w*|zewnętrzn\w*)/i);
  if (explicitTube) tubeQty = number(explicitTube[1], 0);
  if (!tubeQty && /\bczy\s+kamer\w*\s+tubow\w*\b/i.test(source)) tubeQty = 3;

  const explicitPtzBefore = source.match(/(\d+(?:[.]\d+)?)\s+kamer\w*\s+(?:obrotow\w*|ptz)/i);
  if (explicitPtzBefore && !/zasilani\w*\s+\d+(?:[.]\d+)?\s+kamer/i.test(source.slice(Math.max(0, explicitPtzBefore.index - 25), explicitPtzBefore.index + explicitPtzBefore[0].length))) {
    ptzQty = number(explicitPtzBefore[1], 0);
  }
  if (/\b(?:1|jedna)\s+(?:kamera\s+)?(?:obrotow\w*|ptz)\b/i.test(source) || /\btubow\w*\s+(?:1|jedna)\s+(?:kamera\s+)?obrotow\w*/i.test(source)) ptzQty = 1;
  if (!ptzQty && total > 0 && tubeQty > 0 && /obrotow\w*|ptz/i.test(source)) ptzQty = Math.max(0, total - tubeQty);
  if (!tubeQty && total > 0 && ptzQty > 0 && /tubow\w*/i.test(source)) tubeQty = Math.max(0, total - ptzQty);
  if (total > 0 && tubeQty + ptzQty > total) {
    if (ptzQty > 1 && /zasilani\w*\s+\d+(?:[.]\d+)?\s+kamer/i.test(source)) ptzQty = 1;
    if (tubeQty + ptzQty > total && tubeQty > 0) tubeQty = Math.max(0, total - ptzQty);
  }
  return { total, tubeQty, ptzQty };
}

function installerAddCameraHardwareItemsV25(text, items) {
  const breakdown = installerParseCameraBreakdownV25(text);
  const add = (qty, name, key) => {
    if (!qty || qty <= 0) return;
    if (items.some(i => i._voiceKey === key || i.name === name)) return;
    const catalog = findCatalogService('Kamery CCTV', name);
    items.push(buildVoiceItem({ category: 'Kamery CCTV', name, unit: 'szt', quantity: qty, priceNet: number(catalog?.price_net, 0), key }));
  };
  add(breakdown.tubeQty, 'Kamera tubowa IP — materiał', 'camera_tube_hardware');
  add(breakdown.ptzQty, 'Kamera obrotowa PTZ — materiał', 'camera_ptz_hardware');
}

function parseDrillingVoiceItemV25(text) {
  const source = String(text || '');
  if (!/przewiert|przewierc|wiercen|otwor|otwór|przekuc|przebic|przebić/i.test(source)) return null;
  const qty = parseSurchargeQuantity(source, /przewiert\w*|przewierc\w*|wiercen\w*|otwor\w*|otwór\w*|przekuc\w*/i) || 1;
  const catalog = findCatalogService('Przewody / Okablowanie', 'Przewiert przez ścianę pod przewód') || findCatalogService('Kamery CCTV', 'Wiercenie przejścia pod przewód');
  return buildVoiceItem({ category: 'Przewody / Okablowanie', name: 'Przewiert przez ścianę pod przewód', unit: 'szt', quantity: qty, priceNet: number(catalog?.price_net, 35), key: 'drilling_wall' });
}

function installerCableNumberV29(value, fallback = 0) {
  return number(String(value || '').replace(',', '.'), fallback);
}

function installerDetectInternetCableLengthV29(text) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  const patterns = [
    /(?:przew[oó]d\w*|kabel\w*|skr[eę]tk\w*)\s+(?:internetow\w*|sieciow\w*|lan|utp)(?:[^.?!;]{0,220}?)(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b/i,
    /(?:internetow\w*|sieciow\w*|lan|utp|skr[eę]tk\w*|cat\s*5e?|kat\s*5e?|kategori\w*\s*5e?)(?:[^.?!;]{0,220}?)(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b/i,
    /(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b(?:[^.?!;]{0,120}?)(?:przew[oó]d\w*|kabel\w*|skr[eę]tk\w*)(?:[^.?!;]{0,80}?)(?:internetow\w*|sieciow\w*|lan|utp|cat\s*5e?|kat\s*5e?|kategori\w*\s*5e?)/i
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    const length = installerCableNumberV29(match?.[1], 0);
    if (length > 0) return length;
  }
  return 0;
}

function installerDetectInternetCableNameV29(text) {
  const source = String(text || '');
  if (/cat\s*6|kat\s*6|kategori\w*\s*6/i.test(source)) return 'Skrętka UTP Cat 6 CU';
  return 'Skrętka UTP Cat 5e CU';
}

function installerDetectElectricCableRunsV29(text) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  const runs = [];
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b(?:[^.?!;]{0,100}?)(?:przew[oó]d\w*|kabel\w*)(?:[^.?!;]{0,100}?)(?:elektryczn\w*|pr[aą]dow\w*|zasilaj\w*|ydyp|ydy)(?:[^.?!;]{0,80}?)(\d\s*(?:x|×|razy)\s*\d(?:[.,]\d)?|\d\s*(?:x|×|razy)\s*\d\s+\d)?/gi,
    /(?:przew[oó]d\w*|kabel\w*)(?:[^.?!;]{0,80}?)(?:elektryczn\w*|pr[aą]dow\w*|zasilaj\w*|ydyp|ydy)(?:[^.?!;]{0,120}?)(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b(?:[^.?!;]{0,80}?)(\d\s*(?:x|×|razy)\s*\d(?:[.,]\d)?|\d\s*(?:x|×|razy)\s*\d\s+\d)?/gi
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const length = installerCableNumberV29(match[1], 0);
      if (length <= 0) continue;
      const typeRaw = String(match[2] || source.slice(match.index || 0, (match.index || 0) + 140) || '').replace(/\s+/g, '').replace(',', '.').toLowerCase();
      let name = 'Przewód prądowy YDYp 3×1,5';
      let fallback = 3.5;
      let key = 'cable_power_ydyp_3x15';
      if (/3(?:x|×|razy)2\.5/.test(typeRaw)) {
        name = 'Przewód prądowy YDYp 3×2,5';
        fallback = 5.5;
        key = 'cable_power_ydyp_3x25';
      } else if (/2(?:x|×|razy)2\.5/.test(typeRaw) || /2(?:x|×|razy)25/.test(typeRaw)) {
        name = 'Przewód prądowy 2×2,5 — sprawdź typ';
        fallback = 4.5;
        key = 'cable_power_2x25_check';
      } else if (/2(?:x|×|razy)0\.5/.test(typeRaw)) {
        name = 'Przewód niskoprądowy 2×0,5';
        fallback = 1.5;
        key = 'cable_low_voltage_2x05';
      }
      runs.push({ length, name, fallback, key });
    }
  }
  const seen = new Set();
  return runs.filter(run => {
    const k = `${run.name}|${run.length}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function installerPatchCableItemsV29(rawText, result) {
  if (!result || !Array.isArray(result.items)) return result;
  const focused = buildFocusedTranscriptText(rawText);
  const normalized = normalizeSpeechText(focused);
  const additions = [];
  const internetLength = installerDetectInternetCableLengthV29(normalized);
  const hasInternetCableWords = /przew[oó]d\w*\s+(?:internetow\w*|sieciow\w*)|kabel\w*\s+(?:internetow\w*|sieciow\w*)|skr[eę]tk\w*|lan|utp|cat\s*5|kat\s*5|kategori\w*\s*5/i.test(normalized);

  if (internetLength > 0 && hasInternetCableWords) {
    const cableName = installerDetectInternetCableNameV29(normalized);
    result.items = result.items.filter(item => {
      const name = String(item.name || '');
      const category = String(item.category || '');
      const qty = number(item.quantity, 0);
      if (/Prowadzenie skr[eę]tki zewn[eę]trznej/i.test(name) && /Kamery CCTV/i.test(category) && qty === internetLength) return false;
      return true;
    });
    additions.push(buildVoiceItem({
      category: 'Przewody / Okablowanie',
      name: cableName,
      unit: 'mb',
      quantity: internetLength,
      priceNet: installerFindCatalogPriceV29('Przewody / Okablowanie', cableName, cableName.includes('Cat 6') ? 2 : 2),
      key: cableName.includes('Cat 6') ? 'cable_cat6_cu_v29' : 'cable_cat5e_cu_v29'
    }));
    additions.push(buildVoiceItem({
      category: 'Przewody / Okablowanie',
      name: 'Prowadzenie przewodu — standardowe',
      unit: 'mb',
      quantity: internetLength,
      priceNet: installerFindCatalogPriceV29('Przewody / Okablowanie', 'Prowadzenie przewodu — standardowe', 8),
      key: 'cable_labor_standard_internet_v29'
    }));
  }

  const electricRuns = installerDetectElectricCableRunsV29(normalized);
  if (electricRuns.length) {
    const has2x25 = electricRuns.some(run => /2×2,5/.test(run.name));
    if (has2x25 && !/2\s*(?:x|×|razy)\s*0[,.]?5/i.test(normalized)) {
      result.items = result.items.filter(item => !/2×0,5|2x0,5/i.test(String(item.name || '')));
    }
    for (const run of electricRuns) {
      additions.push(buildVoiceItem({
        category: 'Przewody / Okablowanie',
        name: run.name,
        unit: 'mb',
        quantity: run.length,
        priceNet: installerFindCatalogPriceV29('Przewody / Okablowanie', run.name, run.fallback),
        key: run.key
      }));
      additions.push(buildVoiceItem({
        category: 'Przewody / Okablowanie',
        name: 'Prowadzenie przewodu — standardowe',
        unit: 'mb',
        quantity: run.length,
        priceNet: installerFindCatalogPriceV29('Przewody / Okablowanie', 'Prowadzenie przewodu — standardowe', 8),
        key: `${run.key}_labor`
      }));
    }
  }

  if (additions.length) result.items = mergeParserItems([...(result.items || []), ...additions]);
  return result;
}

function installerPatchRouterMaterialV29(rawText, result) {
  if (!result || !Array.isArray(result.items)) return result;
  const normalized = normalizeSpeechText(buildFocusedTranscriptText(rawText));
  const modelMention = normalized.match(/router\s+(?:d\s*-?\s*link|tp\s*-?\s*link|mercusys|asus|tenda|netgear)?\s*([a-z]*\s*\d{3,5}[a-z0-9-]*)?/i);
  if (!modelMention) return result;
  const onlyMentionedAsHardware = !/(konfiguracj\w*|ustawien\w*|ustawi[ćc]|skonfigurowa[ćc]|podl[aą]czy[ćc]|uruchomi[ćc]).{0,35}router/i.test(normalized);
  if (!onlyMentionedAsHardware) return result;
  const routerName = /ax\s*1500|x\s*1500/i.test(normalized) ? 'Router Wi‑Fi 6 — materiał' : 'Router Wi‑Fi 6 — materiał';
  result.items = result.items.filter(item => !/^Konfiguracja routera$/i.test(String(item.name || '')));
  const exists = result.items.some(item => normalizeMaterialName(item.name) === normalizeMaterialName(routerName));
  if (!exists) {
    const price = getSuggestedMaterialPrice(routerName, 'Sieć / Wi‑Fi');
    result.items.push(buildVoiceItem({
      category: 'Sieć / Wi‑Fi',
      name: routerName,
      unit: 'szt',
      quantity: 1,
      priceNet: number(price, installerFindCatalogPriceV29('Sieć / Wi‑Fi', routerName, 220)),
      key: 'router_wifi6_material_v29'
    }));
  }
  return result;
}

function installerPatchAddressV29(result) {
  if (result?.client?.address) {
    result.client.address = String(result.client.address).replace(/^ul\.\s*Adres\s+/i, 'ul. ');
  }
  return result;
}

function installerV31Text(rawText) {
  return normalizeSpeechText(String(rawText || '')).toLowerCase();
}

function installerV31Norm(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
}

function installerV31WordNumber(value) {
  const text = installerV31Norm(value);
  if (/\b(?:jedna|jeden|jedno|1)\b/.test(text)) return 1;
  if (/\b(?:dwie|dwa|2)\b/.test(text)) return 2;
  if (/\b(?:trzy|3)\b/.test(text)) return 3;
  if (/\b(?:cztery|4)\b/.test(text)) return 4;
  if (/\b(?:piec|5)\b/.test(text)) return 5;
  if (/\b(?:szesc|6)\b/.test(text)) return 6;
  if (/\b(?:siedem|7)\b/.test(text)) return 7;
  if (/\b(?:osiem|8)\b/.test(text)) return 8;
  return 0;
}

function installerV31CameraCounts(rawText) {
  const text = installerV31Text(rawText);
  const total = extractCameraQuantity(text) || 0;
  let wifi = 0;
  const wifiNear = text.match(/\b(\d+|jedna|jeden|jedno|dwie|dwa|trzy|cztery|piec|pięc|szesc|sześć)\s+(?:z\s+nich\s+)?(?:kamer\w*\s+)?(?:bezprzewodow\w*|wi\s*-?\s*fi|wifi)\b/i)
    || text.match(/\b(?:bezprzewodow\w*|wi\s*-?\s*fi|wifi)\s+(?:ma\s+byc\s+|będzie\s+|bedzie\s+)?(?:kamera\s+)?(\d+|jedna|jeden|jedno|dwie|dwa|trzy|cztery|piec|pięc|szesc|sześć)\b/i)
    || text.match(/\b(\d+|jedna|jeden|jedno|dwie|dwa|trzy|cztery|piec|pięc|szesc|sześć)\s+z\s+nich\s+(?:jest\s+|ma\s+byc\s+|będzie\s+|bedzie\s+)?(?:bezprzewodow\w*|wi\s*-?\s*fi|wifi)\b/i);
  if (wifiNear) wifi = installerV31WordNumber(wifiNear[1]) || number(wifiNear[1], 0);
  if (!wifi && /(?:piata|piąta)\s+kamera[^.?!]{0,80}(?:wi\s*-?\s*fi|wifi|bezprzewodow)/i.test(text)) wifi = 1;
  if (!wifi && total > 0 && /(?:jedna|1)\s+z\s+nich\s+(?:jest\s+)?(?:bezprzewodow\w*|wi\s*-?\s*fi|wifi)/i.test(text)) wifi = 1;
  if (!wifi && total > 0 && /(?:wi\s*-?\s*fi|wifi|bezprzewodow)/i.test(text) && /\b(?:inna?m?|drugim|nowym)\s+budynk/i.test(text)) wifi = 1;
  if (total > 0 && wifi > total) wifi = total;
  const wired = total > 0 ? Math.max(0, total - wifi) : 0;
  return { total, wifi, wired };
}

function installerV31HasAtticToGroundConnection(rawText) {
  const text = installerV31Text(rawText);
  return /(strych\w*[^.?!]{0,180}(?:parter|dol|dołu|dolu|na\s+dol|na\s+dół)|(?:parter|dol|dołu|dolu|na\s+dol|na\s+dół)[^.?!]{0,180}strych\w*)/i.test(text)
    && /(polacz|połącz|laczyc|łączyć|zlaczyc|złączyć|id[aą]\s+na|ida\s+na|schodz[aą]|zejsc|zejść)/i.test(text);
}

function installerV31HasExplicitCableLength(rawText) {
  const text = installerV31Text(rawText);
  return /\b\d+(?:[,.]\d+)?\s*(?:m|mb|metr\w*)\b/i.test(text)
    || /\b(?:piec|pięc|dziesiec|dziesięć|pietnascie|piętnaście|dwadziescia|dwadzieścia|trzydziesci|trzydzieści)\s+metr/i.test(text);
}

function installerV31IsBogusAddress(address, rawText) {
  const addr = installerV31Norm(address);
  if (!addr) return false;
  if (/\b(kamer|kamera|kamery|hikvis|mpix|megapiksel|rejestrator|nvr|wifi|wi fi|bezprzewod)\b/.test(addr)) return true;
  if (!/\b(ul\.?|ulica|miejscowosc|adres|mielec|tarnow|rzeszow|debica|kolbuszowa|wadowice|borowa|czermin|chorzelow|trzesn|przeclaw|radomysl)\b/.test(addr) && /\b\d+\b/.test(addr) && /\bkamer/.test(installerV31Norm(rawText))) return true;
  return false;
}

function installerV31Price(category, name, fallback) {
  if (typeof installerFindCatalogPriceV29 === 'function') return installerFindCatalogPriceV29(category, name, fallback);
  const catalog = findCatalogService(category, name);
  return number(catalog?.price_net, fallback);
}

function installerV31AddOrSet(items, item) {
  const key = `${item.category}|${installerV31Norm(item.name)}|${item.unit}`;
  const found = items.find(existing => `${existing.category}|${installerV31Norm(existing.name)}|${existing.unit}` === key);
  if (found) {
    found.quantity = item.quantity;
    found.priceNet = number(found.priceNet, item.priceNet);
    if (item._voiceKey) found._voiceKey = item._voiceKey;
  } else {
    items.push(item);
  }
}

function installerV31RemoveBadCableGuesses(rawText, result) {
  if (!result || !Array.isArray(result.items)) return;
  const text = installerV31Text(rawText);
  const noRealLength = !installerV31HasExplicitCableLength(rawText);
  const alreadyPrepared = /kable?\s+s[aą]\s+ju[zż]\s+(?:przeci[aą]gni[eę]te|gotowe|po[łl]o[zż]one)|wszystko\s+jest\s+na\s+skr[eę]tkach|skr[eę]tkach\s+zrobione/i.test(text);
  result.items = result.items.filter(item => {
    const name = installerV31Norm(item.name);
    const qty = number(item.quantity, 0);
    if (noRealLength && /prowadzenie.*skretki|prowadzenie.*przewodu|przewod.*2x0[,.]?5|przewod.*2×0[,.]?5/.test(name)) return false;
    if (alreadyPrepared && /prowadzenie.*skretki|skretka utp|przewod.*cat/.test(name) && qty <= 1) return false;
    return true;
  });
}

function installerV31PatchCameraMounts(rawText, result) {
  const counts = installerV31CameraCounts(rawText);
  if (!counts.total || !result || !Array.isArray(result.items)) return counts;
  if (!counts.wifi) return counts;
  const cameraMountRe = /monta[zż] kamery ip zewn[eę]trznej|montaz kamery ip zewnetrznej|monta[zż] kamery ip wewn[eę]trznej|montaz kamery ip wewnetrznej/i;
  result.items = result.items.filter(item => !cameraMountRe.test(String(item.name || '')));
  if (counts.wired > 0) {
    installerV31AddOrSet(result.items, buildVoiceItem({
      category: 'Kamery CCTV',
      name: 'Montaż kamery IP zewnętrznej',
      unit: 'szt',
      quantity: counts.wired,
      priceNet: installerV31Price('Kamery CCTV', 'Montaż kamery IP zewnętrznej', 260),
      key: 'camera_wired_v31'
    }));
  }
  installerV31AddOrSet(result.items, buildVoiceItem({
    category: 'Kamery CCTV',
    name: 'Montaż kamery Wi‑Fi',
    unit: 'szt',
    quantity: counts.wifi,
    priceNet: installerV31Price('Kamery CCTV', 'Montaż kamery Wi‑Fi', 230),
    key: 'camera_wifi_v31'
  }));
  return counts;
}

function installerV31PatchRj45(rawText, result, counts) {
  if (!result || !Array.isArray(result.items)) return;
  const text = installerV31Text(rawText);
  if (!/(rj\s*-?\s*45|rjek|rjki|pozarabia|zarobi[cć]|zacisn[aą][cć]|zacisk)/i.test(text)) return;
  const wired = counts?.wired || installerV31CameraCounts(rawText).wired || 0;
  if (!wired) return;
  const atticJoin = installerV31HasAtticToGroundConnection(rawText);
  const rjQty = atticJoin ? wired * 3 : wired * 2;
  const couplerQty = atticJoin ? wired : 0;
  result.items = result.items.filter(item => !/zaciskanie wtyku rj45|zarabianie końcówki rj45|zarabianie koncowki rj45|wtyk rj45 cat 5e utp|wtyk rj45 cat 6 utp|łącznik rj45|lacznik rj45|beczka lan/i.test(String(item.name || '')));
  installerV31AddOrSet(result.items, buildVoiceItem({
    category: 'Złącza / Akcesoria',
    name: 'Zaciskanie wtyku RJ45',
    unit: 'szt',
    quantity: rjQty,
    priceNet: installerV31Price('Złącza / Akcesoria', 'Zaciskanie wtyku RJ45', 12),
    key: 'rj45_labor_v31'
  }));
  installerV31AddOrSet(result.items, buildVoiceItem({
    category: 'Złącza / Akcesoria',
    name: 'Wtyk RJ45 Cat 5e UTP',
    unit: 'szt',
    quantity: rjQty,
    priceNet: installerV31Price('Złącza / Akcesoria', 'Wtyk RJ45 Cat 5e UTP', 0.6),
    key: 'rj45_plug_v31'
  }));
  if (couplerQty > 0) {
    installerV31AddOrSet(result.items, buildVoiceItem({
      category: 'Złącza / Akcesoria',
      name: 'Łącznik RJ45 / beczka LAN',
      unit: 'szt',
      quantity: couplerQty,
      priceNet: installerV31Price('Złącza / Akcesoria', 'Łącznik RJ45 / beczka LAN', 8),
      key: 'rj45_coupler_v31'
    }));
  }
}

function installerV31PatchNvr(rawText, result, counts) {
  if (!result || !Array.isArray(result.items)) return;
  const text = installerV31Text(rawText);
  const total = counts?.total || installerV31CameraCounts(rawText).total || 0;
  if (!/(rejestrator|nvr)/i.test(text)) return;
  if (/\b(kupic|kupi[cć]|trzeba\s+kupi[cć]|nowy\s+rejestrator|rejestrator\s+nowy)/i.test(text)) {
    const nvrName = total > 4 ? 'Rejestrator NVR 8 kanałów — materiał' : 'Rejestrator NVR 4 kanały — materiał';
    installerV31AddOrSet(result.items, buildVoiceItem({
      category: 'Kamery CCTV',
      name: nvrName,
      unit: 'szt',
      quantity: 1,
      priceNet: installerV31Price('Kamery CCTV', nvrName, total > 4 ? 560 : 390),
      key: 'nvr_material_v31'
    }));
  }
  if (/zainstalowa[cć]|podlaczyc|podłączy[cć]|do\s+przygotowanego\s+miejsca|stary\s+rejestrator/i.test(text)) {
    installerV31AddOrSet(result.items, buildVoiceItem({
      category: 'Kamery CCTV',
      name: 'Montaż / podłączenie rejestratora NVR',
      unit: 'usł',
      quantity: 1,
      priceNet: installerV31Price('Kamery CCTV', 'Montaż / podłączenie rejestratora NVR', 120),
      key: 'nvr_mount_v31'
    }));
  }
}

function installerV31PatchSurcharges(rawText, result) {
  if (!result) return;
  const hasDrillingItem = (result.items || []).some(item => /przewiert przez ścianę|przewiert przez sciane|wiercenie przejścia|wiercenie przejscia/i.test(String(item.name || '')));
  if (hasDrillingItem && Array.isArray(result.surchargeSuggestions)) {
    result.surchargeSuggestions = result.surchargeSuggestions.filter(s => s.key !== 'surcharge_drilling' && !/przewiert|przekucie/i.test(String(s.item?.name || '')));
  }
}

function installerV31PatchMissing(rawText, result, counts) {
  if (!result) return;
  const text = installerV31Text(rawText);
  const missing = new Set(result.missingData || []);
  if (counts?.wired && /rj\s*-?\s*45|pozarabia|zarobi[cć]/i.test(text) && installerV31HasAtticToGroundConnection(rawText)) {
    missing.add(`RJ45 policzono wariantem pełnym: ${counts.wired * 3} szt. dla ${counts.wired} kamer przewodowych; sprawdź, czy stare końcówki na strychu są do użycia — wtedy może wystarczyć ${counts.wired * 2} szt.`);
    missing.add(`łączniki RJ45 / beczki LAN policzono: ${counts.wired} szt. do połączenia kabli strych–parter`);
  }
  if (counts?.wifi && /podlaczyc[^.?!]{0,80}pr[aą]d|podłączyć[^.?!]{0,80}pr[aą]d|zasil/i.test(text) && !installerV31HasExplicitCableLength(rawText)) {
    missing.add('przy kamerze Wi‑Fi: sprawdzić długość i sposób doprowadzenia zasilania — program nie zgaduje metrów przewodu');
  }
  if (/(nowymi\s+kamerami|5\s+kamer|piec\s+kamer|pięć\s+kamer)/i.test(text) && !/(kupic|kupi[cć]).{0,50}kamer/i.test(text)) {
    missing.add('sprawdzić, czy kamery są po stronie klienta, czy też mają wejść jako materiały do zakupu');
  }
  if (/(rejestrator|nvr)/i.test(text) && !/dysk|hdd|tb|terabajt/i.test(text)) {
    missing.add('sprawdzić dysk do rejestratora: pojemność, czy jest nowy, czy zostaje stary');
  }
  result.missingData = [...missing];
}

function installerV33Normalize(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[„”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function installerV33NormNoPl(value) {
  return installerV33Normalize(value).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');
}

function installerV33ParseNumber(value, fallback = null) {
  const raw = String(value ?? '').replace(/\u00a0/g, ' ').trim();
  if (!raw) return fallback;
  const match = raw.match(/-?\d{1,3}(?:[\s.]?\d{3})*(?:[,.]\d+)?|-?\d+(?:[,.]\d+)?/);
  if (!match) return fallback;
  let s = match[0].replace(/\s+/g, '');
  if (/\.\d{3}(?:\D|$)/.test(s)) s = s.replace(/\./g, '');
  s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function installerV33IsUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function installerV33IsOrdinalCell(value) {
  return /^\d{1,3}[.)]?$/.test(String(value || '').trim());
}

function installerV33IsUnitCell(value) {
  return /^(szt\.?|sztuki?|kpl\.?|komplet|komplety|usł\.?|usl\.?|usługa|usluga|mb|m|metr|metry|tor|tory|godz\.?|h|km)$/i.test(String(value || '').trim());
}

function installerV33NormalizeUnit(value, fallback = 'szt') {
  const v = installerV33NormNoPl(value).replace(/\./g, '');
  if (/^(szt|sztuka|sztuki)$/.test(v)) return 'szt';
  if (/^(kpl|komplet|komplety)$/.test(v)) return 'kpl';
  if (/^(usl|usluga)$/.test(v)) return 'usł';
  if (/^(mb|m|metr|metry)$/.test(v)) return v === 'm' ? 'm' : 'mb';
  if (/^(tor|tory)$/.test(v)) return 'tor';
  if (/^(godz|h)$/.test(v)) return 'godz';
  if (/^km$/.test(v)) return 'km';
  return fallback || 'szt';
}

function installerV33LooksLikeMoneyCell(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/\b(zł|zl|pln)\b/i.test(raw) || /zł/i.test(raw)) return /\d/.test(raw);
  const compact = raw.replace(/\s+/g, '');
  return /^-?\d{1,6}[,.]\d{1,2}$/.test(compact);
}

function installerV33ParseMoneyCell(value) {
  return installerV33LooksLikeMoneyCell(value) ? installerV33ParseNumber(value, null) : null;
}

function installerV33InferKind(group, name, desc, explicitKind = '') {
  const explicit = installerV33NormNoPl(explicitKind);
  if (/material/.test(explicit)) return 'material';
  if (/robocizna|usluga|praca/.test(explicit)) return 'labor';
  const src = installerV33NormNoPl([group, name, desc].join(' '));
  if (/\b(montaz|demontaz|konfiguracja|uruchomienie|inicjalizacja|test|sprawdzenie|inwentaryzacja|oznaczenie|uporzadkowanie|zarabianie|zaciskanie|przewiert|wiercenie|podlaczenie|przeszkolenie|odbior|ustawienie|serwis|robocizna)\b/.test(src)) return 'labor';
  if (/\b(kamera|hikvision|hilook|ezviz|rejestrator|nvr|dvr|dysk|hdd|skyhawk|puszka|uchwyt|adapter|wtyk|wtyki|rj45|patchcord|beczka|lacznik|łącznik|przewod|przewód|kabel|ydy|ydyp|korytko|rura|peszel|kolki|kołki|wkrety|wkręty|opaski|dlawnice|dławnice|izolacja|uszczelnienie|zasilacz|switch|router|most wifi|aplikacja)\b/.test(src)) return 'material';
  return 'labor';
}

function installerV33CategoryFromText(group, name, desc, kind = '') {
  const src = installerV33NormNoPl([group, name, desc].join(' '));
  if (/\b(rj45|rj-45|wtyk|wtyki|beczka|lacznik|łącznik|patchcord|keystone|zlacze|złącze|rozgaleznik|rozgałęźnik|adapter)\b/.test(src)) return 'Złącza / Akcesoria';
  if (/\b(przewod|przewód|kabel|skr[eę]tka|cat\s*5|cat\s*6|ydy|ydyp|korytko|rura|peszel|ochrona przewod|przewiert|wiercenie|przekucie)\b/.test(src)) return 'Przewody / Okablowanie';
  if (/\b(kamera|kamery|monitoring|cctv|hikvision|hilook|ezviz|rejestrator|nvr|dvr|poe|dysk|hdd|skyhawk|puszka.*kamer|ptz)\b/.test(src)) return 'Kamery CCTV';
  if (/\b(router|wifi|wi-fi|lan|switch|access point|mesh|most wifi)\b/.test(src)) return 'Sieć / Wi‑Fi';
  if (/\b(antena|antenowy|konwerter|dekoder|dvb|satelit|sygnal|sygnał)\b/.test(src)) return 'Anteny / Sygnał';
  if (/\b(telewizor|smart tv|uchwyt tv|wieszak)\b/.test(src)) return 'TV / Montaż';
  if (/\b(domofon|wideodomofon|unifon|elektrozaczep)\b/.test(src)) return 'Domofon';
  if (/\b(alarm|czujka|pir|sygnalizator)\b/.test(src)) return 'Alarm';
  if (/\b(doplat|dopłat|trudny|wysokosc|wysokość|komin|maszt|kopanie)\b/.test(src)) return 'Dopłaty / Trudne warunki';
  return kind === 'material' ? 'Złącza / Akcesoria' : 'Serwis';
}

function installerV33MakeItem({ group = '', name = '', desc = '', quantity = 1, unit = 'szt', priceNet = 0, total = null, kind = '', parser = 'structured', source = '' }) {
  const cleanName = installerV33Normalize(name || group || 'Pozycja z tekstu');
  const inferredKind = kind || installerV33InferKind(group, cleanName, desc);
  const category = installerV33CategoryFromText(group, cleanName, desc, inferredKind);
  const item = buildVoiceItem({
    category,
    name: cleanName,
    unit: installerV33NormalizeUnit(unit, inferredKind === 'labor' ? 'usł' : 'szt'),
    quantity: number(quantity, 1),
    priceNet: round2(number(priceNet, 0)),
    key: `v33_${parser}_${installerV33NormNoPl(cleanName).slice(0, 40)}`
  });
  item.itemKind = inferredKind;
  item.parserSource = parser;
  item.parserKey = item._voiceKey;
  item.sourceParser = parser;
  item.sourceDescription = installerV33Normalize(desc || source || '');
  if (total !== null) item.sourceTotalNet = round2(total);
  return item;
}

function installerV33SplitStructuredLine(line, forcedMode = '') {
  const raw = String(line || '').replace(/\u00a0/g, ' ').trim();
  if (!raw) return null;
  if (forcedMode === 'markdown' || /^\s*\|.*\|\s*$/.test(raw)) {
    const cells = raw.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(installerV33Normalize).filter(Boolean);
    if (cells.length >= 4) return { mode: 'markdown', cells };
  }
  if (raw.includes('\t')) {
    const cells = raw.split('\t').map(installerV33Normalize);
    if (cells.filter(Boolean).length >= 5) return { mode: 'tsv', cells };
  }
  if ((raw.match(/;/g) || []).length >= 4) {
    const cells = raw.split(';').map(installerV33Normalize);
    if (cells.filter(Boolean).length >= 5) return { mode: 'csv-semicolon', cells };
  }
  if (/\s{3,}/.test(raw) && (raw.match(/(?:zł|zl|pln)/gi) || []).length >= 2) {
    const cells = raw.split(/\s{3,}/).map(installerV33Normalize);
    if (cells.filter(Boolean).length >= 5) return { mode: 'fixed-width', cells };
  }
  return null;
}

function installerV33LooksLikeHeader(cells) {
  const joined = installerV33NormNoPl((cells || []).join(' '));
  if (/\b(lp|nr|kategoria|nazwa|opis|ilosc|ilość|jm|jednostka|cena|razem|typ)\b/.test(joined) && !/\d+[,.]\d+\s*(zl|zł|pln)/.test(joined)) return true;
  if (/^-+$/.test(joined.replace(/\s+/g, ''))) return true;
  return false;
}

function installerV33RowFromCells(cells, mode = 'structured') {
  const cleanCells = (cells || []).map(installerV33Normalize);
  if (cleanCells.length < 5 || installerV33LooksLikeHeader(cleanCells)) return null;
  const priceIndexes = [];
  cleanCells.forEach((cell, index) => {
    if (installerV33ParseMoneyCell(cell) !== null) priceIndexes.push(index);
  });
  if (!priceIndexes.length) return null;

  const firstPriceIndex = priceIndexes[0];
  const lastPriceIndex = priceIndexes[priceIndexes.length - 1];
  const total = installerV33ParseMoneyCell(cleanCells[lastPriceIndex]);
  let unitPrice = priceIndexes.length >= 2 ? installerV33ParseMoneyCell(cleanCells[priceIndexes[priceIndexes.length - 2]]) : null;

  let unitIndex = -1;
  for (let i = firstPriceIndex - 1; i >= 0; i--) {
    if (installerV33IsUnitCell(cleanCells[i])) { unitIndex = i; break; }
  }
  let unit = unitIndex >= 0 ? cleanCells[unitIndex] : 'szt';
  let quantity = 1;
  if (unitIndex > 0) quantity = installerV33ParseNumber(cleanCells[unitIndex - 1], 1);
  else {
    for (let i = firstPriceIndex - 1; i >= 0; i--) {
      if (/^\d+(?:[,.]\d+)?$/.test(cleanCells[i])) { quantity = installerV33ParseNumber(cleanCells[i], 1); break; }
    }
  }
  if (unitPrice === null && total !== null) unitPrice = quantity > 0 ? total / quantity : total;
  if (unitPrice === null) return null;

  let explicitKind = '';
  for (let i = cleanCells.length - 1; i >= 0; i--) {
    const n = installerV33NormNoPl(cleanCells[i]);
    if (/^(material|robocizna|usluga)$/.test(n)) { explicitKind = cleanCells[i]; break; }
  }

  let startIndex = installerV33IsOrdinalCell(cleanCells[0]) ? 1 : 0;
  const beforeQtyEnd = unitIndex > startIndex ? unitIndex - 1 : firstPriceIndex;
  let candidates = cleanCells.slice(startIndex, beforeQtyEnd).filter(x => x && !installerV33IsUrl(x) && !installerV33LooksLikeMoneyCell(x));
  candidates = candidates.filter(x => !/^(material|robocizna|usluga)$/i.test(installerV33NormNoPl(x)));
  if (!candidates.length) return null;

  const group = candidates[0] || '';
  let name = candidates.length >= 2 ? candidates[1] : candidates[0];
  const desc = candidates.length >= 3 ? candidates.slice(2).join(' — ') : '';
  if (installerV33NormNoPl(name).length < 3 && desc) name = desc;

  const kind = installerV33InferKind(group, name, desc, explicitKind);
  const expectedTotal = round2(quantity * unitPrice);
  const mismatch = total !== null && Math.abs(expectedTotal - round2(total)) > 0.05;
  return {
    group,
    name,
    desc,
    quantity,
    unit,
    unitPrice,
    total,
    kind,
    parser: mode,
    warning: mismatch ? `Różnica w pozycji „${name}”: ilość × cena = ${money(expectedTotal)}, a w tabeli razem = ${money(total)}.` : ''
  };
}

function installerV33ParseStructuredTable(rawText) {
  const rows = [];
  const warnings = [];
  const modes = new Set();
  for (const line of String(rawText || '').replace(/\r/g, '\n').split('\n')) {
    const split = installerV33SplitStructuredLine(line);
    if (!split) continue;
    const row = installerV33RowFromCells(split.cells, split.mode);
    if (!row) continue;
    rows.push(row);
    modes.add(split.mode);
    if (row.warning) warnings.push(row.warning);
  }
  if (rows.length < 2) return null;
  return { parser: [...modes].join(' + ') || 'structured-table', rows, warnings, confidence: rows.length >= 5 ? 0.98 : 0.88 };
}

function installerV33ParseLooseLine(rawLine, sectionKind = '') {
  const line = installerV33Normalize(rawLine);
  if (!line || !/\d/.test(line) || !/(?:zł|zl|pln)/i.test(line)) return null;
  if (/^(netto|brutto|vat|razem|suma)\b/i.test(line)) return null;

  const prefix = String.raw`(?:[-*•]\s*)?(?:\d{1,3}[.)]\s*)?`;
  const units = String.raw`(szt\.?|kpl\.?|usł\.?|usl\.?|mb|m|tor|godz\.?)`;
  const nameQtyMatch = line.match(new RegExp(`^${prefix}(.+?)\\s+(\\d+(?:[,.]\\d+)?)\\s*${units}\\s+(\\d{1,3}(?:[\\s.]?\\d{3})*(?:[,.]\\d{1,2})?|\\d+(?:[,.]\\d{1,2})?)\\s*(?:zł|zl|pln)(?:\\s*(?:/|za)\\s*${units})?`, 'i'));
  if (nameQtyMatch) {
    const name0 = installerV33Normalize(nameQtyMatch[1]).replace(/\b(razem|łącznie|lacznie|suma)\b.*$/i, '').trim();
    const qty0 = installerV33ParseNumber(nameQtyMatch[2], 1);
    const unit0 = installerV33NormalizeUnit(nameQtyMatch[3], 'szt');
    const price0 = installerV33ParseNumber(nameQtyMatch[4], 0);
    const isTotal0 = qty0 > 1 && /\b(razem|łącznie|lacznie|suma)\b/i.test(line) && !/\/\s*(szt|kpl|usł|usl|mb|m|tor|godz)/i.test(line);
    if (name0) return { group: sectionKind === 'material' ? 'Materiał' : (sectionKind === 'labor' ? 'Robocizna' : ''), name: name0, desc: '', quantity: qty0, unit: unit0, unitPrice: isTotal0 && qty0 > 0 ? price0 / qty0 : price0, total: isTotal0 ? price0 : round2(qty0 * price0), kind: installerV33InferKind(sectionKind, name0, '', sectionKind), parser: 'lista' };
  }
  let match = line.match(new RegExp(`^${prefix}(?:(\\d+(?:[,.]\\d+)?)\\s*${units}\\s*(?:x|×|-)?\\s*)?(.+?)\\s+(\\d{1,3}(?:[\\s.]?\\d{3})*(?:[,.]\\d{1,2})?|\\d+(?:[,.]\\d{1,2})?)\\s*(?:zł|zl|pln)(?:\\s*(?:/|za)\\s*${units})?`, 'i'));
  if (!match) {
    match = line.match(new RegExp(`^${prefix}(.+?)\\s+(\\d+(?:[,.]\\d+)?)\\s*${units}\\s+(\\d{1,3}(?:[\\s.]?\\d{3})*(?:[,.]\\d{1,2})?|\\d+(?:[,.]\\d{1,2})?)\\s*(?:zł|zl|pln)`, 'i'));
    if (match) {
      const name2 = installerV33Normalize(match[1]).replace(/\b(razem|łącznie|lacznie)\b.*$/i, '').trim();
      const qty2 = installerV33ParseNumber(match[2], 1);
      const unit2 = installerV33NormalizeUnit(match[3], 'szt');
      const price2 = installerV33ParseNumber(match[4], 0);
      const isTotal2 = /\b(razem|łącznie|lacznie|suma)\b/i.test(line);
      return { group: sectionKind === 'material' ? 'Materiał' : (sectionKind === 'labor' ? 'Robocizna' : ''), name: name2, desc: '', quantity: qty2, unit: unit2, unitPrice: isTotal2 && qty2 > 0 ? price2 / qty2 : price2, total: isTotal2 ? price2 : round2(qty2 * price2), kind: installerV33InferKind(sectionKind, name2, '', sectionKind), parser: 'lista' };
    }
    return null;
  }

  const qty = installerV33ParseNumber(match[1], 1);
  const unit = installerV33NormalizeUnit(match[2] || match[5] || 'szt', 'szt');
  let name = installerV33Normalize(match[3]).replace(/\b(razem|łącznie|lacznie|suma)\b.*$/i, '').trim();
  const price = installerV33ParseNumber(match[4], 0);
  if (!name || name.length < 3) return null;
  const isTotal = qty > 1 && /\b(razem|łącznie|lacznie|suma)\b/i.test(line) && !/\/\s*(szt|kpl|usł|usl|mb|m|tor|godz)/i.test(line);
  return {
    group: sectionKind === 'material' ? 'Materiał' : (sectionKind === 'labor' ? 'Robocizna' : ''),
    name,
    desc: '',
    quantity: qty,
    unit,
    unitPrice: isTotal && qty > 0 ? price / qty : price,
    total: isTotal ? price : round2(qty * price),
    kind: installerV33InferKind(sectionKind, name, '', sectionKind),
    parser: 'lista'
  };
}

function installerV33ParseSectionedList(rawText) {
  const rows = [];
  const warnings = [];
  let sectionKind = '';
  const lines = String(rawText || '').replace(/\r/g, '\n').split('\n');
  for (const rawLine of lines) {
    const normalized = installerV33NormNoPl(rawLine);
    if (/^\s*(materialy|material|sprzet|sprzęt|zakupy)\s*[:\-]/i.test(normalized)) { sectionKind = 'material'; continue; }
    if (/^\s*(robocizna|uslugi|usluga|prace|montaz)\s*[:\-]/i.test(normalized)) { sectionKind = 'labor'; continue; }
    const row = installerV33ParseLooseLine(rawLine, sectionKind);
    if (row) rows.push(row);
  }
  if (rows.length < 2) return null;
  return { parser: 'lista/sekcje', rows, warnings, confidence: rows.length >= 4 ? 0.82 : 0.72 };
}

function installerV33ParseJsonQuote(rawText) {
  const source = String(rawText || '').trim();
  if (!source || !/^[\[{]/.test(source)) return null;
  try {
    const parsed = JSON.parse(source);
    const candidates = [];
    if (Array.isArray(parsed)) candidates.push(...parsed);
    if (Array.isArray(parsed.services)) candidates.push(...parsed.services);
    if (Array.isArray(parsed.items)) candidates.push(...parsed.items);
    if (Array.isArray(parsed.quotes) && parsed.quotes[0]?.services) candidates.push(...parsed.quotes[0].services);
    if (Array.isArray(parsed.records) && parsed.records[0]?.services) candidates.push(...parsed.records[0].services);
    const rows = candidates
      .map(item => ({
        group: item.category || '',
        name: item.name || item.title || '',
        desc: item.description || item.note || '',
        quantity: number(item.quantity ?? item.qty ?? 1, 1),
        unit: item.unit || 'szt',
        unitPrice: number(item.priceNet ?? item.price_net ?? item.price ?? 0, 0),
        total: null,
        kind: item.itemKind || item.kind || '',
        parser: 'json'
      }))
      .filter(row => row.name && row.unitPrice >= 0);
    if (!rows.length) return null;
    return { parser: 'json', rows, warnings: ['Wklejono JSON z pozycjami — sprawdź, czy nie powinien być importowany przez Kopia JSON zamiast parsera.'], confidence: 0.9 };
  } catch {
    return null;
  }
}

function installerV33BuildStructuredResult(rawText, parsed) {
  const items = [];
  const warnings = [...(parsed.warnings || [])];
  for (const row of parsed.rows || []) {
    const item = installerV33MakeItem({
      group: row.group,
      name: row.name,
      desc: row.desc,
      quantity: row.quantity,
      unit: row.unit,
      priceNet: row.unitPrice,
      total: row.total,
      kind: row.kind,
      parser: row.parser || parsed.parser,
      source: row.source || ''
    });
    items.push(item);
  }
  const merged = mergeParserItems(items);
  for (const item of merged) {
    item.parserSource = item.sourceParser || parsed.parser || 'structured';
    item.parserKey = item._voiceKey || item.name;
    item.learningSignature = `v33|${item.parserSource}|${installerV33NormNoPl(item.name)}|${item.unit}|${number(item.priceNet, 0)}`;
  }

  const client = parseClientData(rawText, normalizeSpeechText(rawText));
  const distance = parseDistance(normalizeSpeechText(rawText));
  const freeKm = parseFreeKm(normalizeSpeechText(rawText));
  const detectedType = installerV33DetectTypeFromItems(rawText, merged);
  const totals = installerV33TotalsByKind(merged);
  const parserReport = {
    parser: parsed.parser || 'structured',
    parsersAvailable: INSTALLER_V33_STRUCTURED_PARSERS,
    items: merged.length,
    materialsNet: totals.material,
    laborNet: totals.labor,
    totalNet: totals.total,
    warnings
  };
  const missingData = installerV33StructuredMissing(rawText, merged, parserReport, { client, distanceKm: distance?.km ?? null, freeKm: freeKm ?? null });
  return {
    client,
    items: merged,
    detectedType,
    distanceKm: distance ? distance.km : null,
    distanceRate: distance?.rate ?? null,
    freeKm: freeKm !== null ? freeKm : null,
    unknown: warnings,
    learnedApplied: [],
    missingData,
    surchargeSuggestions: [],
    transcriptInfo: { isTranscript: false, findings: [], options: [], rejected: [], followUps: [] },
    parserReport
  };
}

function installerV33DetectTypeFromItems(rawText, items) {
  const text = installerV33NormNoPl([rawText, ...(items || []).map(i => `${i.category} ${i.name}`)].join(' '));
  const scores = installerScoreJobTypes ? installerScoreJobTypes(text) : [];
  if (scores.length) return scores[0][0];
  const first = (items || []).find(i => i.category && !/Złącza|Przewody|Dopłaty/i.test(i.category));
  return first?.category || 'Serwis';
}

function installerV33TotalsByKind(items) {
  const out = { material: 0, labor: 0, total: 0 };
  for (const item of items || []) {
    const value = number(item.quantity, 1) * number(item.priceNet, 0);
    out.total += value;
    const kind = item.itemKind || classifyQuoteItem(item).key;
    if (kind === 'material') out.material += value;
    else out.labor += value;
  }
  out.material = round2(out.material);
  out.labor = round2(out.labor);
  out.total = round2(out.total);
  return out;
}

function installerV33StructuredMissing(rawText, items, report, context) {
  const missing = [];
  if (!context.client?.name) missing.push('imię i nazwisko klienta — tabela/oferta zwykle tego nie zawiera');
  if (!context.client?.phone) missing.push('numer telefonu klienta');
  if (!context.client?.address) missing.push('adres / miejscowość montażu');
  if (context.distanceKm === null && number(state.distanceKm, 0) <= 0) missing.push('dojazd w km albo informacja, że dojazd nie jest liczony');
  if (!/netto|brutto/i.test(rawText)) missing.push('czy podane ceny są netto czy brutto — program przyjął netto');
  if (report.warnings?.length) missing.push(`sprawdzić ostrzeżenia parsera: ${report.warnings.length}`);
  const materialWithoutKind = items.filter(item => !item.itemKind).length;
  if (materialWithoutKind) missing.push(`część pozycji nie miała kolumny Materiał/Robocizna — program dopasował typ automatycznie: ${materialWithoutKind}`);
  if ((items || []).some(item => /dysk|hdd|skyhawk/i.test(item.name)) && !(items || []).some(item => /rejestrator|nvr|dvr/i.test(item.name))) missing.push('jest dysk, ale nie wykryto rejestratora — sprawdź kompletność oferty');
  if ((items || []).some(item => /kamera/i.test(item.name)) && !(items || []).some(item => /rejestrator|nvr|dvr|zapis|podgląd|podglad/i.test(item.name))) missing.push('są kamery, ale nie wykryto zapisu/podglądu/rejestratora — sprawdź zakres');
  return [...new Set(missing)];
}

function installerV33RunStructuredParsers(rawText) {
  const parsers = [
    installerV33ParseJsonQuote,
    installerV33ParseStructuredTable,
    installerV33ParseSectionedList
  ];
  const candidates = parsers.map(fn => fn(rawText)).filter(Boolean);
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.rows?.length || 0) - (a.rows?.length || 0) || b.confidence - a.confidence);
  const best = candidates[0];
  if ((best.rows?.length || 0) < 2 && best.parser !== 'json') return null;
  return installerV33BuildStructuredResult(rawText, best);
}

function installerV33ParserReportHtml(report) {
  if (!report) return '';
  const warnings = report.warnings?.length
    ? `<details class="preview-warning"><summary>Ostrzeżenia parsera (${report.warnings.length})</summary><ul>${report.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul></details>`
    : '';
  const available = report.parsersAvailable?.length
    ? `<small>Aktywne parsery: ${report.parsersAvailable.map(escapeHtml).join(', ')}</small>`
    : '';
  return `<details class="preview-block" open><summary>Raport parsera: ${escapeHtml(report.parser || 'strukturalny')}</summary>
    <div class="preview-muted">Wykryto pozycji: <b>${number(report.items, 0)}</b>. Materiały: <b>${money(report.materialsNet)}</b>, robocizna: <b>${money(report.laborNet)}</b>, razem: <b>${money(report.totalNet)}</b>.</div>
    ${available}
    ${warnings}
  </details>`;
}

function installerV34Norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function installerV34Number(value, fallback = 0) {
  const v = installerV34Norm(value);
  if (/^\d+(?:[.,]\d+)?$/.test(v)) return number(v.replace(',', '.'), fallback);
  const map = {
    jeden: 1, jedna: 1, jedno: 1, jednej: 1,
    dwa: 2, dwie: 2,
    trzy: 3,
    cztery: 4,
    piec: 5,
    szesc: 6,
    siedem: 7,
    osiem: 8,
    dziewiec: 9,
    dziesiec: 10
  };
  return map[v] || fallback;
}

function installerV34CameraBreakdown(rawText) {
  const source = installerV34Norm(rawText);
  const qtyWord = '(\\d+(?:[.,]\\d+)?|jeden|jedna|jedno|jednej|dwa|dwie|trzy|cztery|piec|pi[eę]c|szesc|sze[sś]c|siedem|osiem|dziewiec|dziewi[eę]c|dziesiec|dziesi[eę]c)';
  const read = (match) => match ? installerV34Number(match[1], 0) : 0;

  const total = extractCameraQuantity(source) || read(source.match(new RegExp('\\b' + qtyWord + '\\s+kamer\\w*\\b', 'i')));

  let ptz = 0;
  let tube = 0;

  const ptzPatterns = [
    new RegExp('\\b' + qtyWord + '\\s+(?:szt\\.?\\s*)?(?:kamer\\w*\\s+)?(?:obrotow\\w*|ptz)\\b', 'i'),
    new RegExp('\\b(?:obrotow\\w*|ptz)\\s+(?:kamer\\w*\\s+)?' + qtyWord + '\\b', 'i')
  ];
  for (const re of ptzPatterns) {
    const m = source.match(re);
    if (m) { ptz = installerV34Number(m[1], 0); break; }
  }

  const tubePatterns = [
    new RegExp('\\b' + qtyWord + '\\s+(?:szt\\.?\\s*)?(?:kamer\\w*\\s+)?(?:tubow\\w*|tubowa|tubowe|tubowych|tuba)\\b', 'i'),
    new RegExp('\\b(?:tubow\\w*|tubowa|tubowe|tubowych|tuba)\\s+(?:kamer\\w*\\s+)?' + qtyWord + '\\b', 'i')
  ];
  for (const re of tubePatterns) {
    const m = source.match(re);
    if (m) { tube = installerV34Number(m[1], 0); break; }
  }

  if (total > 0 && ptz > 0 && tube === 0 && /tubow|tuba/.test(source)) tube = Math.max(0, total - ptz);
  if (total > 0 && tube > 0 && ptz === 0 && /obrotow|ptz/.test(source)) ptz = Math.max(0, total - tube);
  if (total > 0 && ptz + tube > total) {
    if (ptz > total) ptz = total;
    if (ptz + tube > total) tube = Math.max(0, total - ptz);
  }

  return { total, ptz, tube };
}

function installerV34HasTypedCameraBreakdown(rawText) {
  const b = installerV34CameraBreakdown(rawText);
  return b.total > 0 && (b.ptz > 0 || b.tube > 0);
}

function installerV34PatchCameraItems(rawText, result) {
  if (!result || !Array.isArray(result.items)) return;
  const b = installerV34CameraBreakdown(rawText);
  if (!b.total || (!b.ptz && !b.tube)) return;

  const cameraMountRe = /monta[zż] kamery.*(?:ip|zewn[eę]trznej|wewn[eę]trznej|tubowej|obrotowej|ptz|wi.?fi)|montaz kamery.*(?:ip|zewnetrznej|wewnetrznej|tubowej|obrotowej|ptz|wi.?fi)/i;
  result.items = result.items.filter(item => !cameraMountRe.test(String(item.name || '')) || /materia[lł]|— materiał|-- material/i.test(String(item.name || '')));

  const add = (qty, name, fallback, key) => {
    if (!qty || qty <= 0) return;
    result.items.push(buildVoiceItem({
      category: 'Kamery CCTV',
      name,
      unit: 'szt',
      quantity: qty,
      priceNet: installerV34CatalogPrice('Kamery CCTV', name, fallback),
      key
    }));
  };

  add(b.ptz, 'Montaż kamery obrotowej PTZ', 420, 'camera_ptz_mount_v34');
  add(b.tube, 'Montaż kamery tubowej', 250, 'camera_tube_mount_v34');
  result.items = mergeParserItems(result.items || []);
}

function installerV34PatchCameraBoxes(rawText, result) {
  if (!result || !Array.isArray(result.items)) return;
  const text = installerV34Norm(rawText);
  if (!/puszk\w*/i.test(text) || !/kamer\w*/i.test(text)) return;

  const qtyWord = '(\\d+(?:[.,]\\d+)?|jeden|jedna|jedno|jednej|dwa|dwie|trzy|cztery|piec|pi[eę]c|szesc|sze[sś]c|siedem|osiem|dziewiec|dziewi[eę]c|dziesiec|dziesi[eę]c)';
  const m = text.match(new RegExp('\\b' + qtyWord + '\\s+puszk\\w*', 'i'));
  const totalCameras = installerV34CameraBreakdown(rawText).total || extractCameraQuantity(text) || 0;
  const qty = m ? installerV34Number(m[1], 0) : totalCameras;
  if (!qty || qty <= 0) return;

  // Fraza „puszki pod kamery” oznacza materiał. Robociznę montażu kamer program ma liczyć osobno.
  const materialName = 'Puszka montażowa pod kamerę';
  const shouldBeMaterial = /puszk\w*\s+pod\s+(?:te\s+)?kamer|puszk\w*\s+do\s+kamer|puszk\w*\s+montaz/i.test(text);
  if (!shouldBeMaterial) return;

  result.items = result.items.filter(item => !/monta[zż] puszki\s*\/\s*uchwytu kamery|montaz puszki\s*\/\s*uchwytu kamery|puszka monta[zż]owa pod kamer[eę]/i.test(String(item.name || '')));
  const box = buildVoiceItem({
    category: 'Kamery CCTV',
    name: materialName,
    unit: 'szt',
    quantity: qty,
    priceNet: installerV34CatalogPrice('Kamery CCTV', materialName, installerV34CatalogPrice('Kamery CCTV', 'Montaż puszki / uchwytu kamery', 45)),
    key: 'mounting_box_material_v34'
  });
  box.itemKind = 'material';
  result.items.push(box);
  result.items = mergeParserItems(result.items || []);
}

function installerV34PatchMissing(rawText, result) {
  if (!result) return;
  result.missingData = detectMissingData(rawText, {
    client: result.client,
    items: result.items || [],
    detectedType: result.detectedType,
    distanceKm: result.distanceKm,
    distanceRate: result.distanceRate,
    freeKm: result.freeKm,
    transcriptInfo: result.transcriptInfo
  });
}

function installerV35Norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function installerV35EscRe(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function installerV35QtyWordPattern() {
  return '(\\d+(?:[.,]\\d+)?|jeden|jedna|jedno|jednej|dwa|dwie|trzy|cztery|piec|szesc|siedem|osiem|dziewiec|dziesiec)';
}

function installerV35Number(value, fallback = 0) {
  const v = installerV35Norm(value).replace(',', '.');
  if (/^\d+(?:\.\d+)?$/.test(v)) return number(v, fallback);
  const map = {
    jeden: 1, jedna: 1, jedno: 1, jednej: 1,
    dwa: 2, dwie: 2,
    trzy: 3,
    cztery: 4,
    piec: 5,
    szesc: 6,
    siedem: 7,
    osiem: 8,
    dziewiec: 9,
    dziesiec: 10
  };
  return map[v] || fallback;
}

function installerV35WordsAlt(words) {
  return (words || [])
    .map(installerV35Norm)
    .filter(Boolean)
    .map(installerV35EscRe)
    .join('|');
}

function installerV35FindQtyForWords(source, words) {
  const alt = installerV35WordsAlt(words);
  if (!alt) return 0;
  const qty = installerV35QtyWordPattern();
  const patterns = [
    new RegExp('\\b' + qty + '\\s+(?:szt\\.?\\s*)?(?:kamer\\w*\\s+)?(?:' + alt + ')\\b', 'i'),
    new RegExp('\\b' + qty + '\\s+(?:szt\\.?\\s*)?(?:' + alt + ')\\s+kamer\\w*\\b', 'i'),
    new RegExp('\\b(?:' + alt + ')\\s+(?:kamer\\w*\\s+)?' + qty + '\\b', 'i')
  ];
  for (const re of patterns) {
    const m = source.match(re);
    if (m) return installerV35Number(m[1], 0);
  }
  return 0;
}

function installerV35ExtractCameraBreakdown(rawText) {
  const source = installerV35Norm(rawText);
  const qty = installerV35QtyWordPattern();
  let total = 0;
  try { total = extractCameraQuantity(source) || 0; } catch { total = 0; }
  if (!total) {
    const m = source.match(new RegExp('\\b' + qty + '\\s+kamer\\w*\\b', 'i'));
    if (m) total = installerV35Number(m[1], 0);
  }

  const out = { total, types: {}, typedTotal: 0, unknown: 0, warnings: [] };
  for (const type of INSTALLER_V35_PARSER_DICTIONARY.cameraTypes) {
    let value = installerV35FindQtyForWords(source, type.words);
    out.types[type.key] = value;
  }

  const remainingWords = ['reszta', 'pozostale', 'pozostala', 'pozostalych'];
  if (total > 0 && remainingWords.some(w => source.includes(w))) {
    for (const type of INSTALLER_V35_PARSER_DICTIONARY.cameraTypes) {
      const alt = installerV35WordsAlt(type.words);
      if (!alt) continue;
      const re = new RegExp('\\b(?:reszta|pozostale|pozostala|pozostalych)\\s+(?:kamer\\w*\\s+)?(?:' + alt + ')\\b', 'i');
      if (!re.test(source)) continue;
      const currentSum = Object.entries(out.types).filter(([key]) => key !== type.key).reduce((sum, [, v]) => sum + number(v, 0), 0);
      out.types[type.key] = Math.max(0, total - currentSum);
    }
  }

  out.typedTotal = Object.values(out.types).reduce((sum, v) => sum + number(v, 0), 0);
  if (total > 0 && out.typedTotal > 0 && out.typedTotal < total) {
    out.unknown = round2(total - out.typedTotal);
    out.warnings.push(`liczba kamer: wykryto typ dla ${out.typedTotal} z ${total}; brakuje typu dla ${out.unknown} szt.`);
  }
  if (total > 0 && out.typedTotal > total) {
    out.warnings.push(`liczba kamer: suma typów (${out.typedTotal}) jest większa niż liczba kamer (${total}).`);
  }
  return out;
}

function installerV35LooksMaterial(item) {
  const name = installerV35Norm(item?.name);
  if (/material|kamera .*material|puszka montazowa pod kamere|rejestrator .*material|dysk .*material|switch .*material|zasilacz .*material|wtyki|wtyk|rj45|patchcord|beczka|lacznik|kabel|przewod|skretka|peszel|korytko/.test(name)) return true;
  return false;
}

function installerV35MarkKinds(result) {
  for (const item of result?.items || []) {
    const name = installerV35Norm(item.name);
    if (installerV35LooksMaterial(item)) item.itemKind = 'material';
    if (/^montaz kamery|^konfiguracja|^uruchomienie|^test|^sprawdzenie|^zarabianie|^prowadzenie|^przewiert|^wiercenie|^podlaczenie/.test(name)) {
      if (!/puszka montazowa pod kamere|material/.test(name)) item.itemKind = 'labor';
    }
  }
}

function installerV35PatchCameraItems(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  const b = installerV35ExtractCameraBreakdown(rawText);
  if (!b.total && !b.typedTotal) return;
  if (b.typedTotal <= 0) return;

  const cameraMountRe = /monta[zż] kamery.*(?:ip|zewn[eę]trznej|wewn[eę]trznej|tubowej|obrotowej|ptz|kopułkowej|kopulkowej|wi.?fi)|montaz kamery.*(?:ip|zewnetrznej|wewnetrznej|tubowej|obrotowej|ptz|kopulkowej|wi.?fi)/i;
  result.items = result.items.filter(item => !cameraMountRe.test(String(item.name || '')) || installerV35LooksMaterial(item));

  const add = (qty, type) => {
    if (!qty || qty <= 0) return;
    const item = buildVoiceItem({
      category: 'Kamery CCTV',
      name: type.name,
      unit: 'szt',
      quantity: qty,
      priceNet: installerV35CatalogPrice('Kamery CCTV', type.name, type.fallbackPrice),
      key: `camera_${type.key}_mount_v35`
    });
    item.itemKind = 'labor';
    result.items.push(item);
  };

  for (const type of INSTALLER_V35_PARSER_DICTIONARY.cameraTypes) add(b.types[type.key], type);
  result.items = mergeParserItems(result.items || []);
}

function installerV35PatchCameraBoxes(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  const text = installerV35Norm(rawText);
  if (!/puszk|baza|adapter|uchwyt/.test(text) || !/kamer/.test(text)) return;
  const qty = (() => {
    const q = installerV35QtyWordPattern();
    const m = text.match(new RegExp('\\b' + q + '\\s+(?:szt\\.?\\s*)?(?:puszk\\w*|baz\\w*|adapter\\w*|uchwyt\\w*)', 'i'));
    if (m) return installerV35Number(m[1], 0);
    return installerV35ExtractCameraBreakdown(rawText).total || 0;
  })();
  if (!qty || qty <= 0) return;

  const materialName = 'Puszka montażowa pod kamerę';
  result.items = result.items.filter(item => !/monta[zż] puszki\s*\/\s*uchwytu kamery|montaz puszki\s*\/\s*uchwytu kamery|puszka monta[zż]owa pod kamer[eę]/i.test(String(item.name || '')));
  const item = buildVoiceItem({
    category: 'Kamery CCTV',
    name: materialName,
    unit: 'szt',
    quantity: qty,
    priceNet: installerV35CatalogPrice('Kamery CCTV', materialName, 60),
    key: 'mounting_box_material_v35'
  });
  item.itemKind = 'material';
  result.items.push(item);
  result.items = mergeParserItems(result.items || []);
}

function installerV35DetectNegations(rawText) {
  const t = installerV35Norm(rawText);
  const has = (re) => re.test(t);
  return {
    noCameraMaterial: has(/(?:kamery|kamerki|kamera).{0,40}(?:klient\w*\s+ma\s+swoje|sa\s+klienta|swoje|wlasne|dostarcza\s+klient)|(?:nie\s+(?:kupowac|doliczac)|bez)\s+(?:nowych\s+)?kamer/i),
    noCameraMount: has(/bez\s+montazu|montazu\s+nie\s+(?:liczyc|doliczac|robic)|tylko\s+konfiguracj|same\s+ustawienia/i),
    noRecorderMaterial: has(/(?:rejestrator|nvr|dvr).{0,45}(?:nie\s+trzeba\s+kupowac|bez\s+zakupu|klient\w*\s+ma|jest\s+juz|sa\s+na\s+miejscu)|(?:bez|nie\s+doliczac)\s+(?:rejestratora|nvr|dvr)/i),
    noRecorderAll: has(/(?:rejestrator|nvr|dvr).{0,25}(?:nie\s+trzeba|nie\s+bedzie)|bez\s+rejestratora/i) && !has(/konfiguracj|podlaczyc|podłąc|uruchom/i),
    noCables: has(/(?:przewody|kable|skretka).{0,60}(?:sa\s+)?(?:juz\s+)?(?:polozone|poprowadzone|pociagniete|przeciagniete|gotowe)|(?:bez|nie\s+doliczac)\s+(?:kabli|przewodow|okablowania|skretki)/i),
    noBoxes: has(/(?:puszek|puszki|baz|adapterow|uchwytow).{0,35}(?:nie\s+(?:trzeba|doliczac|liczyc|kupowac)|klient\w*\s+ma\s+swoje)|bez\s+puszek/i),
    noDisk: has(/(?:dysk|hdd).{0,35}(?:nie\s+trzeba|nie\s+doliczac|klient\w*\s+ma|jest\s+juz)|bez\s+dysku/i),
    noPreview: has(/(?:podglad|aplikacj).{0,35}(?:nie\s+trzeba|nie\s+doliczac)|bez\s+podgladu/i)
  };
}

function installerV35PushUnique(list, value) {
  if (!value) return;
  if (!Array.isArray(list)) return;
  if (!list.includes(value)) list.push(value);
}

function installerV35ApplyNegations(rawText, result) {
  if (!result || !Array.isArray(result.items)) return;
  const neg = installerV35DetectNegations(rawText);
  const before = result.items.length;
  const removedNotes = [];

  const removeIf = (predicate, note) => {
    const oldLen = result.items.length;
    result.items = result.items.filter(item => !predicate(item));
    if (result.items.length !== oldLen) removedNotes.push(note);
  };

  if (neg.noCameraMount) {
    removeIf(item => /^monta[zż] kamery|^montaz kamery|przewiert|wiercenie|puszka monta[zż]owa pod kamer|monta[zż] puszki/i.test(String(item.name || '')), 'pominięto montaż kamer/puszek/przewiert, bo tekst zawiera negację montażu');
  }
  if (neg.noCameraMaterial) {
    removeIf(item => /kamera .*materia[lł]|kamera .*material/i.test(String(item.name || '')), 'pominięto kamery jako materiał, bo z tekstu wynika, że klient ma własne albo nie kupować kamer');
  }
  if (neg.noRecorderMaterial) {
    removeIf(item => /rejestrator|\bnvr\b|\bdvr\b/i.test(String(item.name || '')) && installerV35LooksMaterial(item), 'pominięto rejestrator jako materiał');
  }
  if (neg.noRecorderAll) {
    removeIf(item => /rejestrator|\bnvr\b|\bdvr\b/i.test(String(item.name || '')), 'pominięto rejestrator, bo tekst zawiera negację');
  }
  if (neg.noCables) {
    removeIf(item => /prowadzenie|okablowanie|kabel|przew[oó]d|skr[eę]tka|peszel|korytko|listwa/i.test(String(item.name || '')) && !/przewiert|wiercenie/i.test(String(item.name || '')), 'pominięto prowadzenie przewodów, bo tekst mówi, że przewody są gotowe');
  }
  if (neg.noBoxes) {
    removeIf(item => /puszk|baza|adapter|uchwyt kamery/i.test(String(item.name || '')), 'pominięto puszki/uchwyty, bo tekst zawiera negację');
  }
  if (neg.noDisk) {
    removeIf(item => /dysk|hdd/i.test(String(item.name || '')), 'pominięto dysk');
  }
  if (neg.noPreview) {
    removeIf(item => /podgl[aą]d|podglad|aplikacj/i.test(String(item.name || '')), 'pominięto podgląd/aplikację');
  }

  if (result.items.length !== before) {
    result.unknown = Array.isArray(result.unknown) ? result.unknown : [];
    for (const note of removedNotes) installerV35PushUnique(result.unknown, `Zastosowano negację: ${note}.`);
  }
}

function installerV35AddCameraQuantityWarnings(rawText, result) {
  if (!result) return;
  const b = installerV35ExtractCameraBreakdown(rawText);
  result.missingData = Array.isArray(result.missingData) ? result.missingData : [];
  for (const warning of b.warnings) installerV35PushUnique(result.missingData, warning);
}

function installerV35HasItem(result, re) {
  return (result?.items || []).some(item => re.test(`${item.category || ''} ${item.name || ''}`));
}

function installerV35AddCctvChecklistSuggestions(rawText, result) {
  if (!result) return;
  const text = installerV35Norm(rawText);
  const hasCctv = /kamera|kamery|kamer|monitoring|cctv|rejestrator|nvr|dvr|poe/.test(text) || installerV35HasItem(result, /kamera|monitoring|cctv|rejestrator|nvr|dvr/i);
  if (!hasCctv) return;
  const neg = installerV35DetectNegations(rawText);
  result.missingData = Array.isArray(result.missingData) ? result.missingData : [];

  if (!neg.noRecorderMaterial && !neg.noRecorderAll && !installerV35HasItem(result, /rejestrator|\bnvr\b|\bdvr\b/i)) installerV35PushUnique(result.missingData, 'CCTV: sprawdzić, czy rejestrator/NVR/DVR ma wejść do oferty');
  if (!neg.noDisk && !installerV35HasItem(result, /dysk|hdd|nagran/i)) installerV35PushUnique(result.missingData, 'CCTV: sprawdzić, czy doliczyć dysk do nagrań');
  if (!neg.noPreview && !installerV35HasItem(result, /podgl[aą]d|podglad|aplikacj|telefon/i)) installerV35PushUnique(result.missingData, 'CCTV: sprawdzić, czy doliczyć podgląd w telefonie / aplikacji');
  if (!neg.noCables && !installerV35HasItem(result, /rj45|rj-45|zarabianie|wtyk|test.*przew|okablowanie|skr[eę]tka|kabel|przew[oó]d/i)) installerV35PushUnique(result.missingData, 'CCTV: sprawdzić RJ45, zakończenia przewodów i test par');
  if (!neg.noBoxes && /kamer/.test(text) && !installerV35HasItem(result, /puszk|baza|uchwyt/i)) installerV35PushUnique(result.missingData, 'CCTV: sprawdzić puszki / uchwyty pod kamery');
  if (!/poe|zasil|switch|wi\s*-?fi|wifi|bezprzewod/i.test(text) && !installerV35HasItem(result, /poe|zasil|switch|wi.?fi/i)) installerV35PushUnique(result.missingData, 'CCTV: sprawdzić zasilanie / PoE / switch');
}

function installerV35RefreshMissing(rawText, result) {
  if (!result) return;
  try {
    result.missingData = detectMissingData(rawText, {
      client: result.client,
      items: result.items || [],
      detectedType: result.detectedType,
      distanceKm: result.distanceKm,
      distanceRate: result.distanceRate,
      freeKm: result.freeKm,
      transcriptInfo: result.transcriptInfo
    });
  } catch {
    result.missingData = Array.isArray(result.missingData) ? result.missingData : [];
  }
  installerV35AddCameraQuantityWarnings(rawText, result);
  installerV35AddCctvChecklistSuggestions(rawText, result);
}

function installerV35PolishCameraLabel(name, qty) {
  const n = installerV35Norm(name);
  const q = number(qty, 1);
  const one = q === 1;
  if (/obrotow|ptz/.test(n)) return one ? '1 kamera obrotowa PTZ' : `${q} kamery obrotowe PTZ`;
  if (/tubow|tuba/.test(n)) return one ? '1 kamera tubowa' : `${q} kamery tubowe`;
  if (/kopulk|dome|sufit/.test(n)) return one ? '1 kamera kopułkowa' : `${q} kamery kopułkowe`;
  if (/wi-?fi|wifi|bezprzewod/.test(n)) return one ? '1 kamera Wi‑Fi' : `${q} kamery Wi‑Fi`;
  return one ? '1 kamera IP' : `${q} kamery IP`;
}

function installerV35ServicePhrase(item) {
  const name = String(item.name || '');
  const n = installerV35Norm(name);
  const q = number(item.quantity, 1);
  if (/montaz kamery/.test(n)) return installerV35PolishCameraLabel(name, q);
  if (/puszka montazowa pod kamere|montaz puszki\s*\/\s*uchwytu/.test(n)) return q === 1 ? '1 puszka montażowa pod kamerę' : `${q} puszki montażowe pod kamery`;
  if (/przewiert|wiercenie|przekucie/.test(n)) return q === 1 ? '1 przewiert pod przewód' : `${q} przewierty pod przewód`;
  if (/konfiguracja rejestratora|rejestrator nvr|rejestrator dvr/.test(n) && !installerV35LooksMaterial(item)) return 'konfiguracja rejestratora';
  if (/podglad|podglad zdalny|aplikacj/.test(n)) return 'uruchomienie podglądu w telefonie';
  if (/zarabianie.*rj45|rj45/.test(n) && !installerV35LooksMaterial(item)) return q === 1 ? 'zarobienie 1 końcówki RJ45' : `zarobienie ${q} końcówek RJ45`;
  return `${q}× ${name}`;
}

function installerV35JoinNatural(parts) {
  const clean = [...new Set((parts || []).map(p => String(p || '').trim()).filter(Boolean))];
  if (!clean.length) return 'zakres do ustalenia';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} oraz ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} oraz ${clean[clean.length - 1]}`;
}

function installerV351PatchCameraBoxesFixed(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  const text = installerV35Norm(rawText);
  if (!/pusz|baza|adapter|uchwyt/.test(text) || !/kamer/.test(text)) return;
  const q = installerV35QtyWordPattern();
  const m = text.match(new RegExp('\\b' + q + '\\s+(?:szt\\.?\\s*)?(?:pusz\\w*|baz\\w*|adapter\\w*|uchwyt\\w*)', 'i'));
  const qty = m ? installerV35Number(m[1], 0) : (installerV35ExtractCameraBreakdown(rawText).total || 0);
  if (!qty || qty <= 0) return;

  const materialName = 'Puszka montażowa pod kamerę';
  result.items = result.items.filter(item => !/monta[zż] puszki\s*\/\s*uchwytu kamery|montaz puszki\s*\/\s*uchwytu kamery|puszka monta[zż]owa pod kamer[eę]|puszka montazowa pod kamere/i.test(String(item.name || '')));
  const item = buildVoiceItem({
    category: 'Kamery CCTV',
    name: materialName,
    unit: 'szt',
    quantity: qty,
    priceNet: installerV35CatalogPrice('Kamery CCTV', materialName, 60),
    key: 'mounting_box_material_v351'
  });
  item.itemKind = 'material';
  result.items.push(item);
  result.items = mergeParserItems(result.items || []);
}

function installerV351PatchExplicitCctvLabor(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  const text = installerV35Norm(rawText);
  const add = (condition, name, fallback, key) => {
    if (!condition) return;
    if (result.items.some(item => installerV35Norm(item.name) === installerV35Norm(name))) return;
    const item = buildVoiceItem({
      category: 'Kamery CCTV',
      name,
      unit: 'usł',
      quantity: 1,
      priceNet: installerV35CatalogPrice('Kamery CCTV', name, fallback),
      key
    });
    item.itemKind = 'labor';
    result.items.push(item);
  };
  add(/konfiguracj\w*.{0,35}(?:rejestrator|nvr|dvr)|(?:rejestrator|nvr|dvr).{0,35}konfiguracj\w*/i.test(text), 'Konfiguracja rejestratora NVR', 350, 'nvr_config_v351');
  add(/podglad|aplikacj|hik-connect|ezviz|telefon/i.test(text), 'Uruchomienie podglądu zdalnego', 150, 'remote_preview_v351');
}

function installerV351SmsPriority(item) {
  const n = installerV35Norm(item?.name);
  if (/montaz kamery/.test(n)) return 10;
  if (/puszka|baza|uchwyt/.test(n)) return 20;
  if (/przewiert|wiercenie|przekucie/.test(n)) return 30;
  if (/konfiguracja/.test(n)) return 40;
  if (/podglad|aplikacj/.test(n)) return 50;
  return 90;
}

function installerV352Plural(q, one, few, many) {
  const n = Math.abs(Math.floor(number(q, 0)));
  if (n === 1) return one;
  const last = n % 10;
  const last2 = n % 100;
  if (last >= 2 && last <= 4 && !(last2 >= 12 && last2 <= 14)) return few;
  return many;
}

function installerV36Norm(rawText) {
  return installerV35Norm ? installerV35Norm(rawText) : normalizeSpeechText(String(rawText || '')).toLowerCase();
}

function installerV36HasInstallIntent(rawText) {
  const text = installerV36Norm(rawText);
  return /trzeba|założyć|zalozyc|zamontowac|zamontować|montaz|montaż|instalacj|podlaczyc|podłączyć|uruchomic|uruchomić/.test(text);
}

function installerV36MaxQty(result, re) {
  let qty = 0;
  for (const item of result?.items || []) {
    if (re.test(installerV36Norm(item.name || ''))) qty = Math.max(qty, number(item.quantity, 0));
  }
  return qty;
}

function installerV36AddLaborFromCameraMaterials(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  if (!installerV36HasInstallIntent(rawText)) return;
  const neg = installerV35DetectNegations ? installerV35DetectNegations(rawText) : {};
  if (neg.noCameraMount) return;

  const addLabor = (qty, name, fallback, key) => {
    if (!qty || qty <= 0) return;
    const n = installerV36Norm(name);
    if (result.items.some(item => installerV36Norm(item.name || '') === n)) return;
    const item = buildVoiceItem({
      category: 'Kamery CCTV',
      name,
      unit: 'szt',
      quantity: qty,
      priceNet: installerV35CatalogPrice ? installerV35CatalogPrice('Kamery CCTV', name, fallback) : fallback,
      key
    });
    item.itemKind = 'labor';
    result.items.push(item);
  };

  const tubeQty = installerV36MaxQty(result, /kamera tubow|kamera tuba|tubowa.*material|tubowa.*materiał/);
  const ptzQty = installerV36MaxQty(result, /kamera obrotow|ptz/);

  if (tubeQty && !installerV36MaxQty(result, /montaz kamery tubow|montaż kamery tubow/)) {
    addLabor(tubeQty, 'Montaż kamery tubowej', 250, 'camera_tube_mount_v36');
  }
  if (ptzQty && !installerV36MaxQty(result, /montaz kamery obrotow|montaż kamery obrotow|montaz.*ptz|montaż.*ptz/)) {
    addLabor(ptzQty, 'Montaż kamery obrotowej PTZ', 420, 'camera_ptz_mount_v36');
  }
}

function installerV36RenameWifiCameraMaterials(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  const text = installerV36Norm(rawText);
  const allWifi = /wszystk\w*.{0,30}kamer\w*.{0,30}(?:wifi|wi\s*-?fi|bezprzewod)/i.test(text)
    || /kamer\w*.{0,40}(?:wifi|wi\s*-?fi|bezprzewod)/i.test(text);
  if (!allWifi) return;
  for (const item of result.items) {
    const n = installerV36Norm(item.name || '');
    if (/kamera tubow/.test(n) && /material|materia[lł]/.test(n)) item.name = 'Kamera tubowa Wi‑Fi — materiał';
    if (/kamera obrotow|ptz/.test(n) && /material|materia[lł]/.test(n)) item.name = 'Kamera obrotowa PTZ Wi‑Fi — materiał';
  }
}

function installerV36FixFalseAddress(rawText, result) {
  if (!result || !result.client) return;
  const address = installerV36Norm(result.client.address || '');
  const text = installerV36Norm(rawText);
  if (/^ul\.?\s*tego\s+\d+\b/.test(address) && /do\s+tego\s+\d+\s+(?:pusz|kamer|uchwyt|przew|kab|szt)/.test(text)) {
    result.client.address = '';
    result.unknown = Array.isArray(result.unknown) ? result.unknown : [];
    installerV35PushUnique(result.unknown, 'Nie wpisano adresu: fragment „do tego 4 …” wyglądał jak fałszywy adres, a nie ulica.');
  }
}

function installerV36CameraTypedQtyFromItems(result) {
  const tube = installerV36MaxQty(result, /kamera tubow|montaz kamery tubow|montaż kamery tubow|tubowa/);
  const ptz = installerV36MaxQty(result, /kamera obrotow|montaz kamery obrotow|montaż kamery obrotow|ptz/);
  const dome = installerV36MaxQty(result, /kopulk|kopułk|dome/);
  return tube + ptz + dome;
}

function installerV36FixCameraQuantityWarnings(rawText, result) {
  if (!result || !Array.isArray(result.missingData)) return;
  const total = (installerV35ExtractCameraBreakdown ? installerV35ExtractCameraBreakdown(rawText).total : 0) || extractCameraQuantity(rawText) || 0;
  if (!total) return;
  const typed = installerV36CameraTypedQtyFromItems(result);
  if (typed >= total) {
    result.missingData = result.missingData.filter(item => !/^liczba kamer:/i.test(String(item || '')));
  }
}

function installerV36HandleOptionalWifiExtender(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  const text = installerV36Norm(rawText);
  const optionalWifi = /(?:ewentualnie|opcjonalnie|jeżeli|jesli|jeśli|gdyby|w razie).{0,80}(?:wzmacniacz|repeater|repeter|access point|ap).{0,80}(?:wifi|wi\s*-?fi|sygnal|sygnał)/i.test(text)
    || /(?:wzmacniacz|repeater|repeter|access point|ap).{0,80}(?:wifi|wi\s*-?fi|sygnal|sygnał).{0,80}(?:ewentualnie|opcjonalnie|jeżeli|jesli|jeśli|gdyby|w razie)/i.test(text);
  if (!optionalWifi) return;

  result.items = result.items.filter(item => !/test i optymalizacja wi|optymalizacja wi|wzmacniacz|repeater|repeter|access point/i.test(String(item.name || '')));
  result.missingData = Array.isArray(result.missingData) ? result.missingData : [];
  installerV35PushUnique(result.missingData, 'Opcjonalnie: wzmacniacz / repeater Wi‑Fi doliczyć tylko po sprawdzeniu, że sygnał przy kamerze jest za słaby.');

  result.surchargeSuggestions = Array.isArray(result.surchargeSuggestions) ? result.surchargeSuggestions : [];
  if (!result.surchargeSuggestions.some(s => /wzmacniacz|repeater|repeter|wi/i.test(String(s.item?.name || '')))) {
    const item = buildVoiceItem({
      category: 'Sieć / Wi‑Fi',
      name: 'Wzmacniacz / repeater Wi‑Fi — opcjonalnie',
      unit: 'szt',
      quantity: 1,
      priceNet: installerV35CatalogPrice ? installerV35CatalogPrice('Sieć / Wi‑Fi', 'Wzmacniacz / repeater Wi‑Fi', 120) : 120,
      key: 'optional_wifi_extender_v36'
    });
    item.itemKind = 'material';
    result.surchargeSuggestions.push({
      key: 'optional_wifi_extender_v36',
      reason: 'Tekst mówi, że wzmacniacz Wi‑Fi jest opcjonalny i zależy od pomiaru sygnału.',
      item
    });
  }
}

function installerV361Norm(rawText) {
  return (typeof installerV35Norm === 'function')
    ? installerV35Norm(rawText)
    : String(rawText || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
}

function installerV361Number(value, fallback = 0) {
  if (typeof installerV35Number === 'function') return installerV35Number(value, fallback);
  const v = installerV361Norm(value).replace(',', '.');
  const map = { jeden: 1, jedna: 1, jedno: 1, jednej: 1, dwa: 2, dwie: 2, trzy: 3, cztery: 4, piec: 5, szesc: 6, siedem: 7, osiem: 8, dziewiec: 9, dziesiec: 10 };
  return /^\d+(?:\.\d+)?$/.test(v) ? number(v, fallback) : (map[v] || fallback);
}

function installerV361QtyPattern() {
  return '(\\d+(?:[.,]\\d+)?|jeden|jedna|jedno|jednej|dwa|dwie|trzy|cztery|piec|szesc|siedem|osiem|dziewiec|dziesiec)';
}

function installerV361AccessoryWords() {
  return '(?:zlacz\\w*|złąc\\w*|złacz\\w*|zlace\\w*|zlacze\\w*|wtyk\\w*|wtycz\\w*|koncow\\w*|końc\\w*|koncowek|końcówek|rj\\s*-?\\s*45|rjek|rjki|rj-ki|beczk\\w*|rozgaleznik\\w*|rozgał\\w*|rozdzielacz\\w*|splitter\\w*|odgaleznik\\w*|odgał\\w*|gniazd\\w*|keystone|modul\\w*|moduł\\w*|zasilacz\\w*|wzmacniacz\\w*|separator\\w*|oslon\\w*|osłon\\w*|patch\\s*panel)';
}

function installerV361AllCamerasWifi(rawText) {
  const text = installerV361Norm(rawText);
  return /(?:wszystk\w*|obie|oba|calosc|całość).{0,70}(?:wifi|wi\s*-?\s*fi|bezprzewod)/i.test(text)
    || /(?:wifi|wi\s*-?\s*fi|bezprzewod).{0,70}(?:wszystk\w*|obie|oba|calosc|całość).{0,30}kamer/i.test(text)
    || /kamer\w*.{0,60}(?:wifi|wi\s*-?\s*fi|bezprzewod)/i.test(text);
}

function installerV361WifiMaterialName(typeKey, defaultName, allWifi) {
  if (!allWifi) return defaultName;
  if (typeKey === 'tube') return 'Kamera tubowa Wi‑Fi — materiał';
  if (typeKey === 'ptz') return 'Kamera obrotowa PTZ Wi‑Fi — materiał';
  if (typeKey === 'dome') return 'Kamera kopułkowa Wi‑Fi — materiał';
  return 'Kamera Wi‑Fi — materiał';
}

function installerV361PatchCameraMaterials(rawText, result) {
  if (!result || !Array.isArray(result.items) || result.parserReport) return;
  if (typeof installerV35ExtractCameraBreakdown !== 'function' || !INSTALLER_V35_PARSER_DICTIONARY?.cameraTypes) return;
  const breakdown = installerV35ExtractCameraBreakdown(rawText);
  const allWifi = installerV361AllCamerasWifi(rawText);
  if (!breakdown || breakdown.typedTotal <= 0) {
    if (allWifi) installerV36RenameWifiCameraMaterials(rawText, result);
    return;
  }

  result.items = result.items.filter(item => {
    const n = installerV361Norm(item.name || '');
    const isCameraMaterial = /kamera/.test(n) && /material|materia[lł]/.test(n);
    return !(String(item.category || '') === 'Kamery CCTV' && isCameraMaterial);
  });

  for (const type of INSTALLER_V35_PARSER_DICTIONARY.cameraTypes) {
    const qty = number(breakdown.types?.[type.key], 0);
    if (!qty || qty <= 0) continue;
    const defaultName = type.materialName || 'Kamera IP zewnętrzna — materiał';
    const name = installerV361WifiMaterialName(type.key, defaultName, allWifi);
    const price = getSuggestedMaterialPrice(name, 'Kamery CCTV') ?? getSuggestedMaterialPrice(defaultName, 'Kamery CCTV');
    const catalog = findCatalogService('Kamery CCTV', defaultName) || findCatalogService('Kamery CCTV', name);
    const item = buildVoiceItem({
      category: 'Kamery CCTV',
      name,
      unit: 'szt',
      quantity: qty,
      priceNet: number(price ?? catalog?.price_net, 0),
      key: `camera_${type.key}_hardware_v361`
    });
    item.itemKind = 'material';
    result.items.push(item);
  }
}

function installerV361FixFalseAddress(rawText, result) {
  if (!result || !result.client || !result.client.address) return;
  const address = installerV361Norm(result.client.address).replace(/^ul\.?\s+/, '');
  const text = installerV361Norm(rawText);
  const falseStart = /^(prowadzenie|polozenie|położenie|przeciagniecie|przeciagniecie|przewod|przewodu|kabel|kabla|skretka|skretki|skrętka|skrętki|kamera|kamery|montaz|montaż|zrobienie|zarobienie|koncowki|końcówki|wtyki|do tego)\s+\d+\b/i.test(address);
  const technicalTail = new RegExp(address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:m|mb|km|szt|zl|zł|cat|kat|rj\\s*-?\\s*45|kamer|puszk|przewod|przewód|skretk|skrętk)', 'i').test(text);
  if (falseStart || technicalTail) {
    result.client.address = '';
    result.unknown = Array.isArray(result.unknown) ? result.unknown : [];
    installerV35PushUnique(result.unknown, 'Nie wpisano adresu: wykryty fragment wyglądał jak opis techniczny, nie adres klienta.');
  }
}

function installerV361PatchRj45MaterialAndLabor(rawText, result) {
  if (!result || !Array.isArray(result.items)) return;
  const text = installerV361Norm(rawText);
  if (!/(rj\s*-?\s*45|rjki|rjek|koncowek|koncowki|wtyk)/i.test(text)) return;
  const qty = parseAccessoryQuantity(text);
  if (!qty || qty <= 0) return;
  const laborIntent = /(zacis|zarob|zakoncz|zakonczyc|zakonczenie|zakończ|zakończenie|zaciś|zaciśnie|zarobić|zarobienie)/i.test(text);
  const cat6 = /cat\s*6|kat\s*6|kategori\w*\s*6/i.test(text) || result.items.some(item => /skr[eę]tka utp cat 6|cat 6/i.test(String(item.name || '')));
  const materialName = cat6 ? 'Wtyk RJ45 Cat 6 UTP' : 'Wtyk RJ45 Cat 5e UTP';
  const hasMaterial = result.items.some(item => /wtyk rj45/i.test(String(item.name || '')) && !/zaciskanie/i.test(String(item.name || '')));
  if (!hasMaterial) {
    const catalog = findCatalogService('Złącza / Akcesoria', materialName);
    const item = buildVoiceItem({
      category: 'Złącza / Akcesoria',
      name: materialName,
      unit: 'szt',
      quantity: qty,
      priceNet: number(catalog?.price_net, cat6 ? 0.9 : 0.6),
      key: cat6 ? 'rj45_cat6_material_v361' : 'rj45_cat5e_material_v361'
    });
    item.itemKind = 'material';
    result.items.push(item);
  }
  result.items = result.items.filter(item => {
    const n = installerV361Norm(item.name || '');
    if (!/zaciskanie wtyku rj45|zarabianie.*rj45/.test(n)) return true;
    if (laborIntent) {
      item.quantity = qty;
      item.itemKind = 'labor';
      return true;
    }
    return false;
  });
}

function installerV361NormalizeRj45Quantity(rawText, result) {
  if (!result || !Array.isArray(result.items)) return;
  const text = installerV361Norm(rawText);
  const qty = parseAccessoryQuantity(text);
  if (!qty || qty <= 1 || !/(rj\s*-?\s*45|rjki|rjek|koncowek|koncowki|wtyk)/i.test(text)) return;
  for (const item of result.items) {
    const n = installerV361Norm(item.name || '');
    if (/rj\s*-?\s*45|rj45/.test(n) && number(item.quantity, 0) === 1) item.quantity = qty;
  }
}


/*
 * Pomocnik Instalatora PWA — moduł: parser-ai.js
 * Integracja parsera OpenAI i mapowanie wyniku AI.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

function normalizeAiParserMode(value) {
  return String(value || '').toLowerCase() === 'ai' ? 'ai' : 'local';
}

function renderAnalysisModeHint(settings = readSettingsFromForm()) {
  const hint = $('analysisModeHint');
  const button = $('analyzeVoiceBtn');
  const mode = normalizeAiParserMode(settings.aiParserMode);
  const isAi = mode === 'ai';
  if (hint) {
    hint.textContent = isAi
      ? `Tryb aktywny: AI OpenAI (${normalizeAiModel(settings.aiModel)}). Wynik zawsze sprawdzisz przed zatwierdzeniem.`
      : 'Tryb aktywny: parser lokalny — działa bez internetu. Wynik zawsze sprawdzisz przed zatwierdzeniem.';
  }
  if (button && !button.disabled) button.textContent = 'Analizuj wizytę';
}

async function analyzeVoiceCommandUsingSelectedMode() {
  const voiceField = $('voiceCommand');
  const notesText = String($('notes')?.value || '').trim();
  if (!String(voiceField?.value || '').trim() && notesText) {
    voiceField.value = notesText;
    updateVoiceSelectionActions();
    showInfo('Użyto notatek z wizyty jako tekstu do analizy.');
  }

  const settings = readSettingsFromForm();
  renderAnalysisModeHint(settings);
  if (normalizeAiParserMode(settings.aiParserMode) === 'ai') {
    await analyzeVoiceCommandWithAiFromField();
    return;
  }
  analyzeVoiceCommandFromField();
}

function normalizeAiModel(value) {
  const model = String(value || '').trim();
  return model || 'gpt-4o-mini';
}

function getSelectedAiModel(fallback = 'gpt-4o-mini') {
  const el = $('aiModel');
  const selected = String(el?.value || '').trim();
  return normalizeAiModel(selected || fallback);
}

function fillAiModelSelect() {
  const select = $('aiModel');
  if (!select || select.dataset.ready === '1') return;
  const current = normalizeAiModel(loadSettings().aiModel || select.value || 'gpt-4o-mini');
  select.innerHTML = AI_MODEL_OPTIONS.map(model => `<option value="${escapeAttr(model.value)}">${escapeHtml(model.label)}</option>`).join('');
  const known = AI_MODEL_OPTIONS.some(model => model.value === current);
  if (!known) {
    const option = document.createElement('option');
    option.value = current;
    option.textContent = `${current} — zapisany wcześniej`;
    select.appendChild(option);
  }
  select.value = current;
  select.dataset.ready = '1';
}

function maskAiKey(key) {
  const clean = String(key || '').trim();
  if (!clean) return '';
  if (clean.length <= 12) return '********';
  return `${clean.slice(0, 7)}...${clean.slice(-4)}`;
}

function renderAiParserStatus(text = '') {
  const box = $('aiParserStatus');
  if (!box) return;
  const settings = loadSettings();
  const mode = normalizeAiParserMode(settings.aiParserMode);
  const key = String(settings.aiOpenAiKey || '').trim();
  const model = normalizeAiModel(settings.aiModel);
  const last = settings.aiLastTestAt ? ` Ostatni test: ${formatDateTime(settings.aiLastTestAt)}.` : '';
  box.classList.remove('ok', 'error');
  if (text) {
    box.textContent = text;
    return;
  }
  if (mode !== 'ai') {
    box.textContent = 'Parser lokalny — AI wyłączone.';
    return;
  }
  if (!key) {
    box.textContent = 'AI włączone, ale brakuje klucza OpenAI.';
    box.classList.add('error');
    return;
  }
  box.textContent = `AI włączone — model: ${model}, klucz: ${maskAiKey(key)}.${last}`;
  box.classList.add('ok');
}


function aiReadSettingsFromFormPatch(settings) {
  return {
    ...settings,
    aiOpenAiKey: $('aiOpenAiKey') ? $('aiOpenAiKey').value.trim() : (settings.aiOpenAiKey || ''),
    aiModel: getSelectedAiModel(settings.aiModel || 'gpt-4o-mini')
  };
}

function openAiHeaders(settings = loadSettings()) {
  const key = String(settings.aiOpenAiKey || '').trim();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  };
}

function buildAiPrompt(text, catalogHints) {
  const hints = Array.isArray(catalogHints) ? catalogHints.slice(0, 8) : [];
  return [
    'TEKST WIZYTY / TRANSKRYPCJA:',
    text,
    '',
    'SKRÓT CENNIKA APLIKACJI, jeśli podano:',
    JSON.stringify(hints).slice(0, 12000)
  ].join('\n');
}

function extractOpenAiOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text;
  const chunks = [];
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if (typeof content.text === 'string') chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

async function callOpenAiParser(raw, settings) {
  const key = String(settings.aiOpenAiKey || '').trim();
  if (!key) throw new Error('Brakuje klucza OpenAI. Wklej go w Ustawieniach AI i kliknij „Zapisz wszystkie ustawienia”.');
  if (raw.length > 12000) throw new Error('Tekst jest za długi. Skróć transkrypcję.');

  const payload = {
    model: normalizeAiModel(settings.aiModel),
    store: false,
    temperature: 0.1,
    max_output_tokens: 3500,
    input: [
      {
        role: 'system',
        content: [
          'Jesteś precyzyjnym parserem wycen instalatora w Polsce.',
          'Zwracasz tylko dane zgodne ze schematem JSON.',
          'Nie licz cen i nie wymyślaj cen. Ceny dobiera lokalna aplikacja z cennika.',
          'Rozpoznawaj klienta, adres, telefon, typ zlecenia, pozycje, ilości, jednostki, wykluczenia i ostrzeżenia.',
          'Jeżeli tekst mówi: bez rejestratora, bez dysku, nie trzeba rejestratora — dodaj do excluded i nie dodawaj tej pozycji do wyceny.',
          'Jeżeli tekst mówi o kamerach, dodaj osobno montaż kamer i osobno materiał kamer, chyba że wyraźnie chodzi tylko o robociznę.',
          'Jeżeli tekst mówi o przewodzie/kablu i metrach, dodaj osobno materiał cable oraz robociznę cable_labor.',
          'Dla zdań typu wszystkie będą Wi-Fi ustaw connectivity=wifi dla wszystkich kamer.',
          'Dla podbitka, strych, drabina, trudne przeciąganie ustaw difficulty=hard lub dodaj ostrzeżenie.',
          'Nie traktuj liczb technicznych jako adresu, jeśli są przy metrach, sztukach, kablach, kamerach albo sprzęcie.'
        ].join(' ')
      },
      {
        role: 'user',
        content: buildAiPrompt(raw, buildAiCatalogHints())
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'installer_visit_parse',
        strict: true,
        schema: AI_PARSE_SCHEMA
      }
    }
  };

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: openAiHeaders(settings),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI HTTP ${response.status}`;
    throw new Error(message);
  }
  const outputText = extractOpenAiOutputText(data);
  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    throw new Error('OpenAI nie zwróciło poprawnego JSON-a. Spróbuj ponownie albo użyj parsera lokalnego.');
  }
  return { ok: true, model: data.model || payload.model, usage: data.usage || null, result: parsed };
}

async function testOpenAiKeyConnection() {
  const settings = readSettingsFromForm();
  const key = String(settings.aiOpenAiKey || '').trim();
  if (!key) {
    renderAiParserStatus('Wklej klucz OpenAI i kliknij „Zapisz wszystkie ustawienia”.');
    $('aiParserStatus')?.classList.add('error');
    showInfo('Wklej klucz OpenAI w ustawieniach AI.');
    return;
  }
  renderAiParserStatus('Testuję OpenAI...');
  try {
    const testData = await callOpenAiParser('Test: Jan Kowalski, Warszawa, montaż jednej kamery IP.', settings);
    const testedSettings = { ...settings, aiParserMode: 'ai', aiLastTestAt: new Date().toISOString() };
    if ($('aiParserMode')) $('aiParserMode').value = testedSettings.aiParserMode;
    renderAnalysisModeHint(testedSettings);
    renderAiParserStatus(`Połączenie z OpenAI działa. Model: ${testData.model || normalizeAiModel(testedSettings.aiModel)}. Kliknij „Zapisz wszystkie ustawienia”, aby zachować konfigurację.`);
    showInfo('Połączenie z OpenAI działa. Konfiguracja nie została jeszcze zapisana.');
  } catch (error) {
    renderAiParserStatus(`Błąd OpenAI: ${error.message}`);
    $('aiParserStatus')?.classList.add('error');
    showInfo(`Błąd OpenAI: ${error.message}`);
  }
}

async function analyzeVoiceCommandWithAiFromField() {
  const raw = $('voiceCommand').value.trim();
  if (!raw) {
    showInfo('Wpisz albo podyktuj treść wizyty, potem kliknij „Analizuj wizytę”.');
    return;
  }
  syncFromForm();
  const settings = readSettingsFromForm();
  if (!String(settings.aiOpenAiKey || '').trim()) {
    showInfo('Brakuje klucza OpenAI. Wklej go w Ustawieniach AI i kliknij „Zapisz wszystkie ustawienia”.');
    renderAiParserStatus('Brakuje klucza OpenAI.');
    $('aiParserStatus')?.classList.add('error');
    return;
  }

  const analyzeBtn = $('analyzeVoiceBtn');
  const oldAnalyzeText = analyzeBtn?.textContent;
  try {
    if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.textContent = 'AI analizuje...'; }
    showInfo('AI analizuje opis wizyty. Po chwili pokaże podgląd do zatwierdzenia.');

    const data = await callOpenAiParser(raw, settings);
    const parsed = data.result || data;
    const result = convertAiParseToAppResult(raw, parsed, data);
    pendingParse = { raw, result };
    renderParserPreview(raw, result);
    const detectedCount = result.items.length;
    const changedFields = countDetectedClientAndTripFields(result);
    showInfo(
      detectedCount || changedFields
        ? `AI rozpoznało dane do sprawdzenia. Kliknij „Zatwierdź rozbicie”, jeśli wszystko się zgadza. Pozycji: ${detectedCount}.`
        : 'AI nie znalazło pewnych pozycji do wyceny. Sprawdź fragmenty niepewne albo rozbij tekst ręcznie.'
    );
  } catch (error) {
    showInfo(`Nie udało się użyć AI: ${error.message}. Możesz przełączyć tryb na parser lokalny w ustawieniach.`);
    renderAiParserStatus(`Błąd AI: ${error.message}`);
    $('aiParserStatus')?.classList.add('error');
  } finally {
    if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.textContent = oldAnalyzeText || 'Analizuj wizytę'; }
    renderAnalysisModeHint(settings);
  }
}

function buildAiCatalogHints() {
  const important = [];
  const wantedCategories = ['Kamery CCTV', 'Przewody / Okablowanie', 'Złącza / Akcesoria', 'Sieć / Wi‑Fi', 'Dopłaty / Trudne warunki', 'Serwis'];
  for (const category of wantedCategories) {
    const rows = (CATALOG[category] || []).slice(0, 60).map(item => ({ name: item.name, unit: item.unit }));
    if (rows.length) important.push({ category, items: rows });
  }
  return important;
}

function aiNormText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‑–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function aiFindCatalogService(category, name) {
  const wanted = aiNormText(name);
  if (!wanted) return null;
  const categories = category && CATALOG[category] ? [category] : CATEGORIES;
  for (const cat of categories) {
    const exact = (CATALOG[cat] || []).find(item => aiNormText(item.name) === wanted);
    if (exact) return { ...exact, category: cat };
  }
  for (const cat of categories) {
    const loose = (CATALOG[cat] || []).find(item => {
      const n = aiNormText(item.name);
      return n.includes(wanted) || wanted.includes(n);
    });
    if (loose) return { ...loose, category: cat };
  }
  return null;
}

function aiNumber(value, fallback = 0) {
  const n = number(value, fallback);
  return Number.isFinite(n) ? n : fallback;
}

function aiCleanQuantity(value, fallback = 1) {
  const qty = aiNumber(value, fallback);
  return qty > 0 ? qty : fallback;
}

function aiCameraMountName(item) {
  const type = String(item.cameraType || '').toLowerCase();
  const conn = String(item.connectivity || '').toLowerCase();
  if (type === 'ptz') return 'Montaż kamery obrotowej PTZ';
  if (type === 'tube') return 'Montaż kamery tubowej';
  if (type === 'dome') return 'Montaż kamery kopułkowej';
  if (conn === 'wifi') return 'Montaż kamery Wi‑Fi';
  return 'Montaż kamery IP zewnętrznej';
}

function aiCameraMaterialName(item) {
  const type = String(item.cameraType || '').toLowerCase();
  const conn = String(item.connectivity || '').toLowerCase();
  if (conn === 'wifi') {
    if (type === 'tube') return 'Kamera tubowa Wi‑Fi — materiał';
    if (type === 'ptz') return 'Kamera obrotowa PTZ Wi‑Fi — materiał';
    if (type === 'dome') return 'Kamera kopułkowa Wi‑Fi — materiał';
    return 'Kamera Wi‑Fi — materiał';
  }
  if (conn === 'lte') return 'Kamera 4G LTE — materiał';
  if (type === 'ptz') return 'Kamera obrotowa PTZ — materiał';
  if (type === 'tube') return 'Kamera tubowa IP — materiał';
  if (type === 'dome') return 'Kamera kopułkowa IP — materiał';
  return 'Kamera IP zewnętrzna — materiał';
}

function aiCableName(item, raw) {
  const source = aiNormText(`${item.name || ''} ${item.notes || ''} ${raw || ''}`);
  if (/cat\s*6|kat\s*6|kategoria\s*6/.test(source)) return 'Skrętka UTP Cat 6 CU';
  if (/cat\s*5e|kat\s*5e|kategoria\s*5e/.test(source)) return 'Skrętka UTP Cat 5e CU';
  if (/rg\s*6|anten/.test(source)) return 'Kabel antenowy RG6 CU';
  if (/2\s*(x|×|razy)\s*0[,.]?5/.test(source)) return 'Przewód niskoprądowy 2×0,5';
  return 'Skrętka UTP Cat 5e CU';
}

function aiCableLaborName(item, raw) {
  const difficulty = String(item.difficulty || '').toLowerCase();
  const source = aiNormText(`${item.name || ''} ${item.notes || ''} ${raw || ''}`);
  if (difficulty === 'hard' || /trudn|strych|poddasz|dach|podbit|przeciagn|przeciag|korytk|elewacj/.test(source)) return 'Prowadzenie przewodu — trudne';
  if (/peszl/.test(source)) return 'Prowadzenie przewodu w peszlu';
  if (/ziemi|grunt|wykop/.test(source)) return 'Prowadzenie przewodu w ziemi';
  return 'Prowadzenie przewodu — standardowe';
}

function aiBuildItem({ category, name, unit = 'szt', quantity = 1, fallbackPrice = 0, kind = '', key = '' }) {
  const catalog = aiFindCatalogService(category, name);
  const finalCategory = catalog?.category || category || 'Serwis';
  const finalName = catalog?.name || name;
  const finalUnit = catalog?.unit || unit || 'szt';
  let price = catalog ? number(catalog.price_net, fallbackPrice) : fallbackPrice;
  if (kind === 'material') {
    const suggested = getSuggestedMaterialPrice(finalName, finalCategory);
    if (suggested !== null) price = suggested;
  }
  const item = buildVoiceItem({
    category: finalCategory,
    name: finalName,
    unit: finalUnit,
    quantity,
    priceNet: price,
    key: key || `ai_${aiNormText(finalName).slice(0, 50)}`
  });
  if (kind) item.itemKind = kind;
  item.parserSource = 'ai';
  item.parserKey = key || finalName;
  item.learningSignature = `ai|${aiNormText(finalName)}|${finalUnit}|${number(price, 0)}`;
  return item;
}

function aiSwitchName(item, raw) {
  const source = aiNormText(`${item.name || ''} ${item.notes || ''} ${raw || ''}`);
  if (/16\s*port/.test(source)) return 'Switch PoE 16-port — materiał';
  if (/8\s*port/.test(source)) return 'Switch PoE 8-port';
  return 'Switch PoE 4-port';
}

function aiRecorderName(item, raw) {
  const source = aiNormText(`${item.name || ''} ${item.notes || ''} ${raw || ''}`);
  if (/8\s*(kan|ch)/.test(source)) return 'Rejestrator NVR 8 kanałów — materiał';
  if (/dvr/.test(source)) return 'Rejestrator DVR 4 kanały — materiał';
  return 'Rejestrator NVR 4 kanały — materiał';
}

function aiMapOneItem(raw, item) {
  if (!item || item.includeInQuote === false) return null;
  const type = String(item.type || item.canonicalType || '').toLowerCase();
  const qty = aiCleanQuantity(item.quantity, 1);
  const rawName = String(item.name || item.nameHint || '').trim();
  const categoryHint = String(item.category || item.categoryHint || '').trim();
  const unitHint = String(item.unit || '').trim() || 'szt';

  if (rawName && type === 'other_material') {
    return aiBuildItem({ category: categoryHint || 'Serwis', name: rawName, unit: unitHint, quantity: qty, fallbackPrice: 0, kind: 'material', key: 'ai_other_material' });
  }
  if (rawName && type === 'other_labor') {
    return aiBuildItem({ category: categoryHint || 'Serwis', name: rawName, unit: unitHint, quantity: qty, fallbackPrice: 0, kind: 'labor', key: 'ai_other_labor' });
  }

  switch (type) {
    case 'camera_mount':
      return aiBuildItem({ category: 'Kamery CCTV', name: aiCameraMountName(item), unit: 'szt', quantity: qty, fallbackPrice: 260, kind: 'labor', key: 'ai_camera_mount' });
    case 'camera_material':
      return aiBuildItem({ category: 'Kamery CCTV', name: aiCameraMaterialName(item), unit: 'szt', quantity: qty, fallbackPrice: 240, kind: 'material', key: 'ai_camera_material' });
    case 'junction_box':
      return aiBuildItem({ category: 'Kamery CCTV', name: 'Puszka montażowa pod kamerę', unit: 'szt', quantity: qty, fallbackPrice: 60, kind: 'material', key: 'ai_camera_box' });
    case 'cable':
      return aiBuildItem({ category: 'Przewody / Okablowanie', name: aiCableName(item, raw), unit: 'mb', quantity: qty, fallbackPrice: /cat\s*6|kat\s*6/i.test(`${rawName} ${raw}`) ? 2 : 1.6, kind: 'material', key: 'ai_cable' });
    case 'cable_labor':
      return aiBuildItem({ category: 'Przewody / Okablowanie', name: aiCableLaborName(item, raw), unit: 'mb', quantity: qty, fallbackPrice: 8, kind: 'labor', key: 'ai_cable_labor' });
    case 'drilling':
      return aiBuildItem({ category: 'Przewody / Okablowanie', name: 'Przewiert przez ścianę pod przewód', unit: 'szt', quantity: qty, fallbackPrice: 35, kind: 'labor', key: 'ai_drilling' });
    case 'remote_view':
      return aiBuildItem({ category: 'Kamery CCTV', name: 'Uruchomienie podglądu zdalnego', unit: 'usł', quantity: qty, fallbackPrice: 150, kind: 'labor', key: 'ai_remote_view' });
    case 'switch_poe':
      return aiBuildItem({ category: 'Kamery CCTV', name: aiSwitchName(item, raw), unit: 'szt', quantity: qty, fallbackPrice: 190, kind: 'material', key: 'ai_switch_poe' });
    case 'recorder':
      return aiBuildItem({ category: 'Kamery CCTV', name: aiRecorderName(item, raw), unit: 'szt', quantity: qty, fallbackPrice: 390, kind: 'material', key: 'ai_recorder' });
    case 'disk':
      return aiBuildItem({ category: 'Kamery CCTV', name: 'Montaż dysku do rejestratora', unit: 'szt', quantity: qty, fallbackPrice: 80, kind: 'labor', key: 'ai_disk_labor' });
    case 'rj45_material':
      return aiBuildItem({ category: 'Złącza / Akcesoria', name: /cat\s*6|kat\s*6/i.test(`${rawName} ${raw}`) ? 'Wtyk RJ45 Cat 6 UTP' : 'Wtyk RJ45 Cat 5e UTP', unit: 'szt', quantity: qty, fallbackPrice: 0.9, kind: 'material', key: 'ai_rj45_material' });
    case 'rj45_labor':
      return aiBuildItem({ category: 'Złącza / Akcesoria', name: 'Zarabianie wtyku RJ45', unit: 'szt', quantity: qty, fallbackPrice: 12, kind: 'labor', key: 'ai_rj45_labor' });
    case 'wifi_extender':
      return aiBuildItem({ category: 'Sieć / Wi‑Fi', name: rawName || 'Wzmacniacz Wi‑Fi', unit: 'szt', quantity: qty, fallbackPrice: 120, kind: 'material', key: 'ai_wifi_extender' });
    case 'router_config':
      return aiBuildItem({ category: 'Sieć / Wi‑Fi', name: 'Konfiguracja routera', unit: 'usł', quantity: qty, fallbackPrice: 120, kind: 'labor', key: 'ai_router_config' });
    case 'network_device':
      if (rawName) return aiBuildItem({ category: categoryHint || 'Sieć / Wi‑Fi', name: rawName, unit: unitHint, quantity: qty, fallbackPrice: 0, kind: 'material', key: 'ai_network_device' });
      return null;
    default:
      if (rawName && categoryHint) return aiBuildItem({ category: categoryHint, name: rawName, unit: unitHint, quantity: qty, fallbackPrice: 0, kind: '', key: 'ai_fallback' });
      return null;
  }
}

function convertAiParseToAppResult(raw, ai, envelope = {}) {
  const client = ai?.client || {};
  const warnings = Array.isArray(ai?.warnings) ? ai.warnings : [];
  const excluded = Array.isArray(ai?.excluded) ? ai.excluded : [];
  const uncertain = Array.isArray(ai?.uncertain) ? ai.uncertain : [];
  const rawItems = Array.isArray(ai?.items) ? ai.items : [];
  const skipped = [];
  const items = rawItems.map(item => {
    const mapped = aiMapOneItem(raw, item);
    if (!mapped && item?.includeInQuote !== false) skipped.push(item.name || item.type || 'nieznana pozycja');
    return mapped;
  }).filter(Boolean);

  const mergedItems = mergeParserItems(items);
  installerV35MarkKinds({ items: mergedItems });
  const detectedType = ai?.detectedType && CATALOG[ai.detectedType] ? ai.detectedType : (mergedItems[0]?.category || 'Kamery CCTV');
  const result = {
    client: {
      name: String(client.name || '').trim(),
      phone: String(client.phone || '').trim(),
      address: String(client.address || '').trim()
    },
    items: mergedItems,
    detectedType,
    distanceKm: aiNumber(ai?.distanceKm, 0) > 0 ? aiNumber(ai.distanceKm, 0) : null,
    distanceRate: aiNumber(ai?.distanceRate, 0) > 0 ? aiNumber(ai.distanceRate, 0) : null,
    freeKm: aiNumber(ai?.freeKm, -1) >= 0 ? aiNumber(ai.freeKm, 0) : null,
    unknown: [...uncertain, ...skipped.map(x => `AI nie dopasowało pozycji: ${x}`)],
    learnedApplied: ['Rozbicie wykonane przez OpenAI bezpośrednio z aplikacji. Ceny nadal pochodzą z lokalnego cennika aplikacji.'],
    missingData: [],
    surchargeSuggestions: [],
    parserReport: {
      parser: `OpenAI${envelope.model ? ` / ${envelope.model}` : ''}`,
      parsersAvailable: ['AI structured JSON', 'lokalny cennik', 'ręczny podgląd'],
      warnings: [...warnings, ...excluded.map(x => `Wykluczono z wyceny: ${x}`)],
      items: mergedItems.length,
      materialsNet: mergedItems.filter(x => x.itemKind === 'material').reduce((sum, x) => sum + number(x.quantity, 0) * number(x.priceNet, 0), 0),
      laborNet: mergedItems.filter(x => x.itemKind === 'labor').reduce((sum, x) => sum + number(x.quantity, 0) * number(x.priceNet, 0), 0),
      totalNet: mergedItems.reduce((sum, x) => sum + number(x.quantity, 0) * number(x.priceNet, 0), 0)
    },
    transcriptInfo: {
      isTranscript: true,
      findings: Array.isArray(ai?.facts) ? ai.facts : [],
      options: Array.isArray(ai?.options) ? ai.options : [],
      rejected: excluded,
      followUps: [...uncertain, ...warnings]
    }
  };
  result.missingData = detectMissingData(raw, result);
  if (warnings.length) result.missingData.push(...warnings);
  return result;
}


/*
 * Pomocnik Instalatora PWA — moduł: sync.js
 * Synchronizacja danych i obsługa Dropbox.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */


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
  const settings = readSettingsFromForm();
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
    showDropboxStatus('Najpierw wybierz tryb Dropbox.', true);
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
  const settings = silent ? loadSettings() : readSettingsFromForm();
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
    const persistedSettings = loadSettings();
    saveSettings({ ...persistedSettings, lastDropboxSyncAt: new Date().toISOString() });
    renderSavedQuotes();
    renderCatalog();
    if (!silent) showDropboxStatus(`Synchronizacja zakończona. Aktywne wyceny: ${loadQuotes().length}. Rekordy z usuniętymi: ${loadQuoteRecords().length}. Konfigurację zapisuje przycisk „Zapisz wszystkie ustawienia”.`);
  } catch (error) {
    showDropboxStatus(`Błąd synchronizacji Dropbox: ${error.message}`, true);
  }
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


/*
 * Pomocnik Instalatora PWA — moduł: export.js
 * SMS, raport TXT, lista materiałów, PDF i drukowanie.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

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
  lines.push('');
  lines.push(buildMaterialsText(quote));
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

function renderClientMessagePreview() {
  const box = $('clientMessagePreview');
  if (!box) return;
  box.value = buildClientSms(state);
}

function buildClientSms(quote = state) {
  const totals = calculateTotals(quote);
  const job = quote.jobType || 'usługa instalacyjna';
  const address = quote.clientAddress ? ` pod adresem ${quote.clientAddress}` : '';
  const scope = summarizeServices(quote, 3);
  const date = quote.visitDate ? ` Termin: ${formatDate(quote.visitDate)}.` : '';
  const distance = totals.distanceNet > 0 ? ` Dojazd: ${money(totals.distanceNet)} netto.` : '';
  return normalizeSpaces(`Dzień dobry, wycena: ${job}${address}. Zakres: ${scope}. Razem: ${money(totals.gross)} brutto (${money(totals.net)} netto).${distance}${date}`);
}

function buildClientDescription(quote = state) {
  const totals = calculateTotals(quote);
  const lines = [];
  lines.push('Dzień dobry,');
  lines.push('');
  lines.push(`Przesyłam wycenę: ${quote.jobType || 'usługa instalacyjna'}${quote.clientAddress ? `, adres: ${quote.clientAddress}` : ''}.`);
  if (quote.visitDate) lines.push(`Planowany termin wizyty: ${formatDate(quote.visitDate)}.`);
  lines.push('');
  lines.push('Zakres prac:');
  if (quote.services.length) {
    quote.services.forEach(item => lines.push(`- ${formatServiceLine(item)}`));
  } else {
    lines.push('- zakres do ustalenia / brak pozycji w wycenie');
  }
  if (totals.distanceNet > 0) lines.push(`- dojazd: ${totals.billedKm} km płatne × ${money(quote.distanceRate)} = ${money(totals.distanceNet)} netto`);
  lines.push('');
  lines.push(`Razem netto: ${money(totals.net)}`);
  lines.push(`VAT: ${money(totals.vat)}`);
  lines.push(`Razem brutto: ${money(totals.gross)}`);
  lines.push('');
  lines.push('Kwoty są przygotowane na podstawie podanych danych. Jeżeli zakres prac zmieni się na miejscu, wycena może wymagać aktualizacji.');
  return lines.join('\n');
}

function buildMaterialsData(quote = state) {
  const materials = new Map();
  const tools = new Set();
  const checks = new Set();
  const allText = `${quote.jobType || ''} ${quote.notes || ''} ${(quote.services || []).map(item => item.name).join(' ')}`.toLowerCase();

  const addMaterial = (name, quantity = 1, unit = 'szt', note = '') => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    const cleanUnit = String(unit || 'szt').trim() || 'szt';
    const key = `${cleanName.toLowerCase()}|${cleanUnit}|${note}`;
    const current = materials.get(key) || { name: cleanName, quantity: 0, unit: cleanUnit, note };
    current.quantity = round2(number(current.quantity) + number(quantity, 1));
    materials.set(key, current);
  };
  const addTool = text => { if (text) tools.add(text); };
  const addCheck = text => { if (text) checks.add(text); };

  for (const item of quote.services || []) {
    const name = String(item.name || '');
    const lower = name.toLowerCase();
    const qty = Math.max(0, number(item.quantity, 1));
    const unit = String(item.unit || 'szt').toLowerCase();

    if (/montaż kamery|montaz kamery|kamera ip|kamera obrotowa|\bptz\b/.test(lower) && !/konfiguracja|podgląd|podglad|aplikacja|prowadzenie|okablowanie|serwis|diagnostyka/.test(lower)) {
      addMaterial(/ptz|obrotow/.test(lower) ? 'Kamery obrotowe PTZ' : 'Kamery IP', qty, 'szt');
      addTool('wiertarka / wkrętarka');
      addTool('kołki, wkręty i uszczelnienie');
    }
    if (/z puszką|z puszka/.test(lower)) addMaterial('Puszki montażowe pod kamery', qty, 'szt');
    if (/puszk.*montaż|puszk.*montaz|uchwyt.*kamer/.test(lower)) addMaterial('Puszki montażowe pod kamery', qty, 'szt');
    if (/puszk.*prąd|puszk.*prad|puszka elektrycz/.test(lower)) addMaterial('Puszki prądowe / elektryczne', qty, 'szt');

    if (/skrętka|skretka|cat\s*5e|cat\s*6|kat\s*5e|kat\s*6|utp|ftp|lan|rg6|antenowy|koncentryk|koncentryczny|przewód\w*|przewod\w*|ydyp|ydy|kabel/.test(lower)) {
      if (/prowadzenie|ciągnięcie|ciagniecie|ułożenie|ulozenie|robocizna/.test(lower)) {
        addCheck(`Przygotować przewód do trasy: ${qty} ${unit === 'mb' ? 'mb' : unit}`);
      } else if (unit === 'mb' || /mb|metr/.test(unit)) {
        addMaterial(name, qty, 'mb');
      } else {
        addMaterial(name, qty, item.unit || 'szt');
      }
      addTool('tester przewodów / miernik ciągłości');
      addTool('opaski, uchwyty, peszel albo listwy według trasy');
    }

    if (/rj45|końcówk.*rj45|koncowk.*rj45|wtyk.*rj45/.test(lower)) {
      addMaterial('Wtyki RJ45', qty, 'szt');
      addMaterial('Osłonki RJ45', qty, 'szt', 'opcjonalnie');
      addTool('zaciskarka RJ45');
      addTool('tester LAN');
    }
    if (/złącza f|zlacza f|złącze f|zlacze f|końcówk.* f|koncowk.* f|\bf-ki\b|\bfka\b/.test(lower)) {
      addMaterial('Złącza F', qty, 'szt');
      addTool('ściągacz izolacji / nóż do kabla antenowego');
    }

    if (/rozgałęźnik|rozgaleznik|rozgałeznik|rozdzielacz|splitter/.test(lower)) addMaterial(name, qty, 'szt');
    if (/wzmacniacz.*anten|anten.*wzmacniacz/.test(lower)) addMaterial(name, qty, 'szt');
    if (/zasilacz/.test(lower)) addMaterial(name, qty, 'szt');
    if (/separator.*anten|anten.*separator/.test(lower)) addMaterial(name, qty, 'szt');
    if (/gniazdo.*rtv|gniazdo.*sat|gniazdo.*lan|keystone|patch panel/.test(lower)) {
      addMaterial(name, qty, 'szt');
      addTool('zaciskarka / narzędzie LSA według typu osprzętu');
    }
    if (/beczka.*lan|łącznik.*rj45|lacznik.*rj45|beczka.*anten|przejście f|przejscie f|f-f/.test(lower)) addMaterial(name, qty, 'szt');
    if (/switch.*poe|poe.*switch/.test(lower)) addMaterial('Switch PoE', qty, 'szt');
    if (/dysk.*rejestrator|hdd|ssd/.test(lower)) addMaterial('Dysk do rejestratora', qty, 'szt');
    if (/rejestrator|\bnvr\b|\bdvr\b/.test(lower) && !/konfiguracja/.test(lower)) addMaterial('Rejestrator NVR/DVR', qty, 'szt');
    if (/konfiguracja rejestratora|uruchomienie podglądu|uruchomienie podgladu|aplikacj/.test(lower)) addCheck('Przygotować dane logowania, aplikację, dostęp do internetu i hasła klienta');
    if (/antena|dvb|satelit/.test(lower) && /montaż|montaz/.test(lower)) {
      addMaterial('Antena / osprzęt antenowy', qty, 'szt');
      addTool('miernik sygnału TV/SAT');
    }
    if (/wideodomofon|domofon|unifon/.test(lower)) addMaterial('Zestaw domofonu / wideodomofonu', qty, 'kpl');
    if (/elektrozaczep/.test(lower)) addMaterial('Elektrozaczep', qty, 'szt');
    if (/czujk.*pir|\bpir\b/.test(lower)) addMaterial('Czujki PIR', qty, 'szt');
    if (/sygnalizator/.test(lower)) addMaterial('Sygnalizator alarmowy', qty, 'szt');
    if (/pilot/.test(lower)) addMaterial('Piloty / baterie do pilotów', qty, 'szt');
  }

  if (/kamera|monitoring|poe|rejestrator|nvr|cctv/.test(allText)) {
    addTool('laptop lub telefon do konfiguracji kamer');
    addTool('próbnik zasilania / multimetr');
    addCheck('Sprawdzić zasilanie PoE/zasilacze i dostęp do routera');
  }
  if (/wysoko|drabina|komin|maszt|dach|elewacja|strych/.test(allText)) {
    addTool('drabina / sprzęt do pracy na wysokości');
    addCheck('Sprawdzić bezpieczeństwo pracy na wysokości i dostęp do miejsca montażu');
  }
  if (/przewiert|przekucie|kucie|ścian|scian|beton|cegła|cegla/.test(allText)) {
    addTool('wiertarka udarowa / SDS i odpowiednie wiertła');
    addCheck('Sprawdzić grubość ścian i trasę przewiertu');
  }
  if (/kopanie|ziemia|grunt|kostka|bruk|wykop/.test(allText)) {
    addTool('łopata / narzędzia do wykopu');
    addMaterial('Peszel/rura osłonowa do ziemi', 1, 'kpl', 'długość według trasy');
    addCheck('Sprawdzić przebieg instalacji w ziemi i miejsce położenia kostki/bruku');
  }
  if ([...materials.values()].some(item => item.unit === 'mb')) {
    addCheck('Doliczyć zapas przewodu około 10–15% względem trasy');
  }
  if (!materials.size) addCheck('Brak wykrytych materiałów — sprawdź ręcznie, co trzeba zabrać');

  return {
    materials: [...materials.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    tools: [...tools].sort((a, b) => a.localeCompare(b, 'pl')),
    checks: [...checks].sort((a, b) => a.localeCompare(b, 'pl'))
  };
}

function formatMaterialQuantity(item) {
  const quantity = number(item.quantity, 1);
  const shown = Number.isInteger(quantity) ? String(quantity) : String(quantity).replace('.', ',');
  return `${shown} ${item.unit || 'szt'}`;
}

function buildMaterialsText(quote = state) {
  const data = buildMaterialsData(quote);
  const lines = [];
  lines.push('LISTA MATERIAŁÓW DO ZABRANIA');
  lines.push(`Klient: ${quote.clientName || '-'}`);
  lines.push(`Adres: ${quote.clientAddress || '-'}`);
  if (quote.visitDate) lines.push(`Termin: ${formatDate(quote.visitDate)}`);
  lines.push('');
  lines.push('Materiały / osprzęt:');
  if (data.materials.length) data.materials.forEach(item => lines.push(`- ${formatMaterialQuantity(item)} — ${item.name}${item.note ? ` (${item.note})` : ''}`));
  else lines.push('- brak wykrytych materiałów');
  lines.push('');
  lines.push('Narzędzia / akcesoria:');
  if (data.tools.length) data.tools.forEach(item => lines.push(`- ${item}`));
  else lines.push('- standardowe narzędzia instalatora');
  lines.push('');
  lines.push('Do sprawdzenia przed wyjazdem:');
  if (data.checks.length) data.checks.forEach(item => lines.push(`- ${item}`));
  else lines.push('- brak dodatkowych uwag');
  return lines.join('\n');
}

function renderMaterialsPreview() {
  const box = $('materialsPreview');
  if (!box) return;
  const data = buildMaterialsData(state);
  const materialRows = data.materials.length
    ? data.materials.map(item => `<li><strong>${escapeHtml(formatMaterialQuantity(item))}</strong> — ${escapeHtml(item.name)}${item.note ? ` <span>${escapeHtml(item.note)}</span>` : ''}</li>`).join('')
    : '<li>Brak wykrytych materiałów — sprawdź ręcznie.</li>';
  const toolsRows = data.tools.length
    ? data.tools.map(item => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>Standardowe narzędzia instalatora.</li>';
  const checksRows = data.checks.length
    ? data.checks.map(item => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>Brak dodatkowych uwag.</li>';
  box.innerHTML = `
    <div class="materials-grid">
      <div><h3>Materiały / osprzęt</h3><ul>${materialRows}</ul></div>
      <div><h3>Narzędzia / akcesoria</h3><ul>${toolsRows}</ul></div>
      <div><h3>Do sprawdzenia</h3><ul>${checksRows}</ul></div>
    </div>`;
}

function copyMaterialsList(quote = state) {
  return copyTextToClipboard(buildMaterialsText(quote), 'Lista materiałów skopiowana do schowka.');
}

function summarizeServices(quote = state, maxItems = 3) {
  if (!quote.services?.length) return 'do ustalenia';
  const parts = quote.services.slice(0, maxItems).map(item => `${number(item.quantity, 1)}× ${item.name}`);
  const left = quote.services.length - parts.length;
  if (left > 0) parts.push(`+ ${left} poz.`);
  return parts.join(', ');
}

function formatServiceLine(item) {
  const total = number(item.quantity, 1) * number(item.priceNet);
  return `${item.name} — ${number(item.quantity, 1)} ${item.unit || 'usł'} × ${money(item.priceNet)} = ${money(total)} netto`;
}

function buildOfferHtml(quote = state) {
  const settings = loadSettings();
  const totals = calculateTotals(quote);
  const title = `Oferta ${quote.clientName || 'wycena'}`;
  const rows = quote.services?.length
    ? quote.services.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.unit || 'usł')}</td><td>${number(item.quantity, 1)}</td><td>${money(item.priceNet)}</td><td>${money(number(item.quantity, 1) * number(item.priceNet))}</td></tr>`).join('')
    : '<tr><td colspan="6">Brak pozycji w wycenie.</td></tr>';
  const distanceRow = totals.distanceNet > 0
    ? `<tr><td colspan="5">Dojazd: ${totals.billedKm} km płatne × ${money(quote.distanceRate)}</td><td>${money(totals.distanceNet)}</td></tr>`
    : '';
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;margin:0;background:#f5f7fb;color:#172033} .page{max-width:920px;margin:24px auto;background:white;padding:34px;border:1px solid #d9e2ef;border-radius:18px} .top{display:flex;justify-content:space-between;gap:18px;border-bottom:3px solid #1d5fa7;padding-bottom:18px;margin-bottom:22px} h1{margin:0;font-size:28px} h2{font-size:17px;margin:24px 0 10px}.muted{color:#667085}.box{border:1px solid #d9e2ef;border-radius:12px;padding:12px;background:#fbfdff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px} table{width:100%;border-collapse:collapse;margin-top:8px} th,td{border-bottom:1px solid #d9e2ef;padding:9px;text-align:left;vertical-align:top} th{font-size:12px;color:#667085;text-transform:uppercase} .totals{margin-left:auto;width:min(360px,100%);display:grid;gap:7px}.totals div{display:flex;justify-content:space-between;border:1px solid #d9e2ef;border-radius:10px;padding:9px;background:#fbfdff}.totals .gross{font-size:20px;font-weight:800;background:#ecfdf3;color:#067647}.actions{position:sticky;top:0;background:#f5f7fb;padding:10px;text-align:center}.actions button{padding:10px 16px;border-radius:10px;border:1px solid #1d5fa7;background:#1d5fa7;color:white;font-weight:800}.note{white-space:pre-wrap}.signature{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:60px}.line{border-top:1px solid #444;text-align:center;padding-top:8px;color:#667085}@media print{body{background:white}.actions{display:none}.page{margin:0;max-width:none;border:0;border-radius:0}.top{page-break-inside:avoid}}
</style>
</head>
<body>
<div class="actions"><button onclick="window.print()">Drukuj / zapisz jako PDF</button></div>
<main class="page">
  <section class="top">
    <div><div class="muted">${escapeHtml(settings.companyName)}</div><h1>Oferta / wycena</h1><div class="muted">Wygenerowano: ${formatDate(new Date().toISOString().slice(0, 10))}</div></div>
    <div class="box"><b>Razem brutto</b><br><span style="font-size:26px;font-weight:900;color:#067647">${money(totals.gross)}</span></div>
  </section>
  <section class="grid">
    <div class="box"><b>Klient</b><br>${escapeHtml(quote.clientName || '-')}<br>${escapeHtml(quote.clientPhone || '')}</div>
    <div class="box"><b>Adres / termin</b><br>${escapeHtml(quote.clientAddress || '-')}<br>${escapeHtml(formatDate(quote.visitDate))}</div>
  </section>
  <h2>Zakres</h2>
  <div class="box">${escapeHtml(quote.jobType || 'Usługa instalacyjna')}</div>
  <h2>Pozycje wyceny</h2>
  <table><thead><tr><th>Lp.</th><th>Pozycja</th><th>Jm.</th><th>Ilość</th><th>Cena netto</th><th>Razem netto</th></tr></thead><tbody>${rows}${distanceRow}</tbody></table>
  <h2>Podsumowanie</h2>
  <section class="totals">
    <div><span>Netto</span><b>${money(totals.net)}</b></div>
    <div><span>VAT</span><b>${money(totals.vat)}</b></div>
    <div class="gross"><span>Brutto</span><b>${money(totals.gross)}</b></div>
  </section>
  <h2>Uwagi</h2>
  <div class="box note">${escapeHtml(quote.notes || 'Brak dodatkowych uwag.')}</div>
  <h2>Warunki</h2>
  <div class="box">Oferta przygotowana na podstawie przekazanych informacji. Zmiana zakresu prac, materiałów lub warunków montażu może zmienić końcową cenę.</div>
  <section class="signature"><div class="line">Wykonawca</div><div class="line">Klient</div></section>
</main>
</body>
</html>`;
}

function generateOfferPdf(quote = state) {
  if (quote === state) syncFromForm();
  const html = buildOfferHtml(quote);
  const fileName = sanitizeFileName(`oferta_${quote.clientName || 'klient'}_${quote.visitDate || new Date().toISOString().slice(0, 10)}.html`);
  const win = window.open('', '_blank');
  if (!win) {
    downloadFile(fileName, html, 'text/html;charset=utf-8');
    showInfo('Przeglądarka zablokowała nowe okno. Pobrano plik HTML oferty — otwórz go i zapisz jako PDF z drukowania.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    try { win.print(); }
    catch { /* okno może być jeszcze ładowane */ }
  }, 450);
  showInfo('Otworzono ofertę. W oknie drukowania wybierz „Zapisz jako PDF”.');
}

async function copyTextToClipboard(text, okMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showInfo(okMessage || 'Tekst skopiowany do schowka.');
  } catch {
    downloadFile('tekst_do_klienta.txt', text, 'text/plain;charset=utf-8');
    showInfo('Nie udało się skopiować do schowka. Pobrano tekst jako plik TXT.');
  }
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


/*
 * Pomocnik Instalatora PWA — moduł: ui.js
 * Inicjalizacja, renderowanie interfejsu, PWA i funkcje wspólne.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

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
  applyTheme(settings.uiTheme || 'light');
  $('companyName').value = settings.companyName;
  $('vatRate').value = settings.vatRate;
  if ($('uiTheme')) $('uiTheme').value = normalizeTheme(settings.uiTheme);
  if ($('storageMode')) $('storageMode').value = settings.storageMode || 'local';
  if ($('dropboxToken')) $('dropboxToken').value = settings.dropboxAccessToken || '';
  if ($('dropboxPath')) $('dropboxPath').value = settings.dropboxPath || '/pomocnik_instalatora_data.json';
  if ($('dropboxAutoSync')) $('dropboxAutoSync').checked = !!settings.dropboxAutoSync;
  if ($('aiParserMode')) $('aiParserMode').value = settings.aiParserMode || 'local';
  if ($('aiOpenAiKey')) $('aiOpenAiKey').value = settings.aiOpenAiKey || '';
  fillAiModelSelect();
  if ($('aiModel')) $('aiModel').value = normalizeAiModel(settings.aiModel || 'gpt-4o-mini');
  renderAiParserStatus();
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
  $('saveQuoteBtn').addEventListener('click', saveCurrentQuote);
  $('shareSmsBtn').addEventListener('click', () => runShareAction(() => copyTextToClipboard(buildClientSms(state), 'SMS do klienta skopiowany do schowka.')));
  $('shareDescriptionBtn').addEventListener('click', () => runShareAction(() => copyTextToClipboard(buildClientDescription(state), 'Opis wyceny skopiowany do schowka.')));
  $('shareTxtBtn').addEventListener('click', () => runShareAction(() => downloadTxt(state)));
  $('sharePdfBtn').addEventListener('click', () => runShareAction(() => generateOfferPdf(state)));
  $('sharePrintBtn').addEventListener('click', () => runShareAction(() => window.print()));
  $('shareMaterialsBtn').addEventListener('click', () => runShareAction(() => copyMaterialsList(state)));
  $('shareReportBtn').addEventListener('click', () => runShareAction(copyReport));
  $('newQuoteBtn').addEventListener('click', newQuote);
  $('catalogSearch').addEventListener('input', renderCatalog);
  $('saveCatalogItemBtn').addEventListener('click', saveCatalogItemFromForm);
  $('clearCatalogEditorBtn').addEventListener('click', clearCatalogEditor);
  $('exportCatalogBtn').addEventListener('click', exportCatalog);
  $('importCatalogBtn').addEventListener('click', () => $('importCatalogFile').click());
  $('importCatalogFile').addEventListener('change', importCatalogFromFile);
  $('resetCatalogBtn').addEventListener('click', resetCatalogToDefault);
  $('saveSettingsBtn').addEventListener('click', saveSettingsFromForm);
  if ($('uiTheme')) $('uiTheme').addEventListener('change', () => {
    applyTheme($('uiTheme').value);
    showInfo('Podgląd motywu zmieniony. Kliknij „Zapisz wszystkie ustawienia”, aby zachować zmianę.');
  });
  if ($('aiParserMode')) $('aiParserMode').addEventListener('change', () => renderAnalysisModeHint(readSettingsFromForm()));
  if ($('aiModel')) $('aiModel').addEventListener('change', () => renderAnalysisModeHint(readSettingsFromForm()));
  $('clearDataBtn').addEventListener('click', clearLocalData);
  $('exportBackupBtn').addEventListener('click', exportBackup);
  $('importBackupBtn').addEventListener('click', () => $('importBackupFile').click());
  $('importBackupFile').addEventListener('change', importBackupFromFile);
  $('refreshAppBtn').addEventListener('click', refreshAppCache);
  $('savePhraseDictionaryBtn').addEventListener('click', savePhraseDictionaryFromForm);
  $('resetPhraseDictionaryBtn').addEventListener('click', resetPhraseDictionary);
  $('clearLearnedRulesBtn').addEventListener('click', clearLearnedRules);
  $('runParserTestBtn').addEventListener('click', runParserTest);
  $('fillExampleParserTestBtn').addEventListener('click', fillExampleParserTest);
  $('dropboxSyncBtn').addEventListener('click', () => syncDropbox('merge'));
  $('dropboxPullBtn').addEventListener('click', () => syncDropbox('pull'));
  $('dropboxPushBtn').addEventListener('click', () => syncDropbox('push'));
  $('dropboxTestBtn').addEventListener('click', testDropboxConnection);
  if ($('aiTestBtn')) $('aiTestBtn').addEventListener('click', testOpenAiKeyConnection);
  $('installBtn').addEventListener('click', installPwa);
  $('voiceBtn').addEventListener('click', startDictation);
  $('analyzeVoiceBtn').addEventListener('click', analyzeVoiceCommandUsingSelectedMode);
  $('loadTextFileBtn').addEventListener('click', () => $('voiceTextFile').click());
  $('voiceTextFile').addEventListener('change', importVoiceTextFile);
  $('selectVoiceBtn').addEventListener('click', selectAllVoiceText);
  $('copyVoiceSelectionBtn').addEventListener('click', copySelectedVoiceText);
  $('clearVoiceSelectionBtn').addEventListener('click', clearSelectedVoiceText);
  $('voiceCommand').addEventListener('select', updateVoiceSelectionActions);
  $('voiceCommand').addEventListener('input', updateVoiceSelectionActions);
  $('acceptParserBtn').addEventListener('click', acceptParserPreview);
  $('rejectParserBtn').addEventListener('click', rejectParserPreview);
  $('undoParseBtn').addEventListener('click', undoLastBreakdown);
  $('clearVoiceBtn').addEventListener('click', () => { $('voiceCommand').value = ''; rejectParserPreview(false); updateVoiceSelectionActions(); });
}


function runShareAction(action) {
  try {
    const result = action();
    if (result && typeof result.catch === 'function') {
      result.catch(error => showInfo(`Nie udało się wykonać operacji: ${error.message}`));
    }
  } catch (error) {
    showInfo(`Nie udało się wykonać operacji: ${error.message}`);
  } finally {
    const menu = $('shareMenu');
    if (menu) menu.open = false;
  }
}

function renderAll() {
  renderServices();
  renderSummary();
  renderChecklist();
  renderClientMessagePreview();
  renderMaterialsPreview();
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
      <td><input value="${escapeAttr(item.name)}" data-field="name">${quoteItemBadgesHtml(item)}</td>
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
        ${quoteItemBadgesHtml(item)}
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
  renderClientMessagePreview();
  renderMaterialsPreview();
}

function renderChecklist() {
  const list = CHECKLISTS[state.jobType] || [];
  $('checklist').innerHTML = list.map((text, index) => `
    <label class="check-item"><input type="checkbox" data-check="${index}"> <span>${escapeHtml(text)}</span></label>
  `).join('');
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
    node.querySelector('.sms').addEventListener('click', () => copyTextToClipboard(buildClientSms(quote), 'SMS z zapisanej wyceny skopiowany do schowka.'));
    node.querySelector('.pdf').addEventListener('click', () => generateOfferPdf(quote));
    node.querySelector('.materials').addEventListener('click', () => copyMaterialsList(quote));
    node.querySelector('.delete').addEventListener('click', () => deleteQuote(quote.id));
    wrap.appendChild(node);
  }
}

function normalizeSpaces(text) {
  return String(text || '').replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim();
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pl-PL');
}

function formatDateTime(value) {
  if (!value) return '';
  try { return new Date(value).toLocaleString('pl-PL'); }
  catch { return String(value); }
}

async function refreshAppCache() {
  const cachePrefix = 'pomocnik-instalatora-pwa-';
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix)).map(name => caches.delete(name)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations
      .filter(reg => String(reg.scope || '').includes(location.pathname.replace(/[^/]*$/, '')))
      .map(reg => reg.update()));
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

function splitAccessoryClauses(text) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const accessoryStart = '(?:zlacz|złacz|złącz|wtyk|wtyki|koncowk|końcówk|rj|rj45|rj-45|rjek|rjki|rj-ki|beczk|rozgaleznik|rozgałeznik|rozgałęźnik|rozdzielacz|splitter|odgaleznik|odgałęźnik|gniazd|keystone|modul|moduł|zasilacz|wzmacniacz|separator|oslonk|oslon|osłonk|osłon|patch)';
  const prepared = raw
    .replace(/(separatorem|separatorze)\s+(?=wzmacniacz\w*\s+anten)/gi, '$1, ')
    .replace(/(zasilacz\w*\s+anten\w*(?:\s+12\s*v)?(?:\s+z\s+separatorem)?)\s+(?=wzmacniacz\w*\s+anten)/gi, '$1, ');
  const parts = prepared.split(new RegExp('[,;\n]+|\\s+oraz\\s+|\\s+plus\\s+|\\s+i\\s+(?=(?:\\d+(?:[.]\\d+)?\\s*)?' + accessoryStart + ')', 'i'));
  return parts.map(x => x.trim()).filter(Boolean);
}

function looksLikeCableClause(text) {
  return /\b(kabel|kabla|kabli|przewod|przewodu|przewód|przewody|skretk\w*|skrętk\w*|cat\s*\d|kat\s*\d|rg\s*-?\s*6|rg6|antenow\w*|internetow\w*|zelowan\w*|żelowan\w*|ydyp|ydy|elektryczn\w*|prad\w*|prąd\w*)\b/i.test(text);
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

function showInfo(text) {
  const box = $('parserInfo');
  box.textContent = text;
  box.hidden = false;
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

function extractSpecialVoiceItems(text) {
  const items = [];
  const suppressedKeys = new Set();
  const usedFragments = [];

  const cameraTypeItems = parseCameraTypeBreakdown(text);
  if (cameraTypeItems.length) {
    items.push(...cameraTypeItems);
    suppressedKeys.add('camera');
    suppressedKeys.add('ptz');
    usedFragments.push('kamera');
  } else {
    const cameraBoxCombo = text.match(/(?:cena\s+za\s+)?(?:montaz|instalacj\w*)\s+(?:\d+(?:[.]\d+)?\s+)?(?:1\s+|jednej\s+)?kamer\w*\s+(?:i|z|plus)\s+puszk\w*(?:\s+to)?\s*(\d+(?:[.]\d+)?)\s*zł(?:\s+netto)?/i);
    if (cameraBoxCombo) {
      const qty = extractCameraQuantity(text) || 1;
      items.push(buildVoiceItem({ category: 'Kamery CCTV', name: 'Montaż kamery IP z puszką', unit: 'szt', quantity: qty, priceNet: number(cameraBoxCombo[1]), key: 'camera_box_combo' }));
      suppressedKeys.add('camera');
      suppressedKeys.add('box_holder');
      usedFragments.push(cameraBoxCombo[0]);
    } else {
      const cameraBreakdown = parseCameraPriceBreakdown(text);
      if (cameraBreakdown.length) {
        items.push(...cameraBreakdown);
        suppressedKeys.add('camera');
        usedFragments.push('kamera');
      }
    }
  }

  const appService = text.match(/(?:nauka\s+obslugi\s+aplikacji(?:\s+i\s+instalacja\s+aplikacji)?|instalacja\s+aplikacji(?:\s+i\s+nauka\s+obslugi)?)\s*(?:po|za|to|kosztuje|kosztuja)?\s*(\d+(?:[.]\d+)?)\s*zł/i);
  if (appService) {
    items.push(buildVoiceItem({ category: 'Serwis', name: 'Nauka obsługi i instalacja aplikacji', unit: 'usł', quantity: 1, priceNet: number(appService[1]), key: 'app_training' }));
    suppressedKeys.add('app_training');
    usedFragments.push(appService[0]);
  }

  const mountingBoxes = parseBoxMaterialLoose(text, 'mounting');
  if (mountingBoxes) {
    items.push(mountingBoxes);
    suppressedKeys.add('box_holder');
    usedFragments.push('puszk');
  }

  const electricalBoxes = parseBoxMaterialLoose(text, 'electrical');
  if (electricalBoxes) {
    items.push(electricalBoxes);
    suppressedKeys.add('electrical_box');
    usedFragments.push('prad');
  }

  const cableResult = parseCableVoiceItems(text);
  if (cableResult.items.length) {
    items.push(...cableResult.items);
    suppressedKeys.add('cable_lan');
    usedFragments.push(...cableResult.usedFragments);
  }

  const listwaResult = parseListwaVoiceItems(text);
  if (listwaResult.items.length) {
    items.push(...listwaResult.items);
    usedFragments.push(...listwaResult.usedFragments);
  }

  const accessoryResult = parseAccessoryVoiceItems(text);
  if (accessoryResult.items.length) {
    items.push(...accessoryResult.items);
    ['rj45', 'fplug'].forEach(key => suppressedKeys.add(key));
    usedFragments.push(...accessoryResult.usedFragments);
  }

  return { items, suppressedKeys: [...suppressedKeys], usedFragments };
}

function splitCableClausesEnhanced(text) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const pieces = [];
  const re = /(\d+(?:[.]\d+)?\s*(?:m|mb)\s+(?:[^,!?;]{0,70}?)(?:przewod\w*|przewód\w*|kabel\w*|skretk\w*|skrętk\w*|cat\s*\d|kat\s*\d|rg6|2\s*x\s*0[.]?5|2x0[.]?5|ydyp|ydy)[^,!?;]{0,100})/gi;
  for (const m of raw.matchAll(re)) pieces.push(m[1].trim());
  if (!pieces.length) return splitCableClauses(raw);
  return pieces;
}

function looksLikeAccessoryClause(text) {
  const source = String(text || '');
  const cleaned = source.replace(/gniazdk\w*/gi, ' ');
  return /\b(zlacze|zlacz\w*|złacze|zlacza|złacza|złacz\w*|złącz\w*|złąc\w*|wtyk\w*|koncowk\w*|końcówk\w*|rj\s*-?\s*45|rjek|rjki|rj-ki|beczk\w*|rozgaleznik|rozgałeznik\w*|rozgałęźnik\w*|rozdzielacz\w*|splitter|odgaleznik\w*|odgałęźnik\w*|gniazd\w*\s+(?:lan|rtv|sat|rj|anten)|keystone|modul\w*|moduł\w*|zasilacz\w*|wzmacniacz\w*|separator\w*|oslonk\w*|oslon\w*|osłonk\w*|osłon\w*|patch\s*panel)\b/i.test(cleaned);
}

function splitCableClauses(text) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const parts = raw.split(/[,;\n]+|\s+oraz\s+|\s+plus\s+|\s+i\s+(?=(?:\d|kabel|kabla|przewod|przewodu|przewód|skrętka|skretka|cat|kat|rg6|anten|internet|listw))/i);
  const out = parts.map(x => x.trim()).filter(Boolean);
  return out.length ? out : [raw];
}

function isVisitTranscript(rawText) {
  const source = String(rawText || '');
  return /TRANSKRYPCJA:|\[INFO\]|\[\d{2}:\d{2}:\d{2}\]|RUN:\s*\d{4}-\d{2}-\d{2}|beam_size|Wczytano plik audio/i.test(source)
    || (source.length > 2500 && /\b(kamera|kamery|kabel|przew[oó]d|ofert[aeę]|wycen[aeę])\b/i.test(source));
}

function stripTranscriptionNoise(rawText) {
  const raw = String(rawText || '').replace(/\r/g, '\n');
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^=+$/.test(line) && !/^-+$/.test(line))
    .filter(line => !/^RUN:|^large\s*\||^temperature=|^\[INFO\]|^\[Wykryty język|^\[INFO\] Zakończono/i.test(line))
    .filter(line => !/^(FP16|MONO|Parametry audio|Użyta precyzja)/i.test(line))
    .map(line => line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/g, ''))
    .join('. ')
    .replace(/\s+/g, ' ')
    .replace(/\bprzez\s+(\d+)\b/gi, '/$1')
    .replace(/\bobrotówki\b/gi, 'kamery obrotowe')
    .replace(/\bobrotowki\b/gi, 'kamery obrotowe')
    .replace(/\bkomorny\b/gi, 'komin')
    .replace(/\bpaszle\b/gi, 'peszle')
    .trim();
}

function buildFocusedTranscriptText(rawText) {
  if (!isVisitTranscript(rawText)) return cleanDictationSpaces(rawText);
  const raw = String(rawText || '').replace(/\r/g, '\n');
  const important = [];
  const keepRe = /Sielska|wycena|kamera|kamery|monitoring|podgl[aą]d|telefon|router|internet|serwer|nagrywa|kabel|kable|przew[oó]d|pr[aą]d|zasil|gniazdk|puszk|klimatyzac|korytk|korytarz|listw|maskuj|rynnie|rynn|strych|poddasz|podbitk|przewier|wierc|przekuc|rolety|rolet|solar|panel|obrot|tubow|kopuł|wizualizator|ofert|mail|sms|sąsiad|sasiad|ci[eę][żz]ko\s+dost[eę]p|trudn|dach|komin|maszt|elewacj|peszl|przej[sś]cie|okno|drzwi/i;
  for (let line of raw.split('\n')) {
    line = line.trim();
    if (!line || /^=+$/.test(line) || /^-+$/.test(line)) continue;
    if (/^RUN:|^large\s*\||^temperature=|^\[INFO\]|^\[Wykryty język/i.test(line)) continue;
    line = line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/g, '').trim();
    if (!line) continue;
    if (keepRe.test(line)) important.push(line);
  }
  const headerAddress = parseTranscriptAddress(rawText);
  const prefix = headerAddress ? `adres ${headerAddress}. ` : '';
  return cleanDictationSpaces((prefix + important.join('. ')).replace(/\bprzez\s+(\d+)\b/gi, '/$1'));
}

function analyzeVisitTranscript(rawText, focusedText) {
  const isTranscript = isVisitTranscript(rawText);
  if (!isTranscript) return { isTranscript: false, findings: [], options: [], rejected: [], followUps: [] };
  const text = normalizeSpeechText(focusedText || rawText);
  const findings = [];
  const options = [];
  const rejected = [];
  const followUps = [];
  const add = (arr, value) => { if (value && !arr.includes(value)) arr.push(value); };

  const addr = parseTranscriptAddress(rawText);
  if (addr) add(findings, `adres z transkrypcji / nazwy pliku: ${addr}`);
  const start = String(rawText || '').match(/start\s+godzina\s+(\d{1,2}[.:]\d{2})/i);
  if (start) add(findings, `początek wizyty: ${start[1].replace('.', ':')}`);
  if (/podglad\s+na\s+telefon|podgl[aą]d\s+na\s+telefon|aplikacj/i.test(text)) add(findings, 'klient oczekuje podglądu w telefonie / aplikacji');
  if (/router|internet|serwer/i.test(text)) add(findings, 'kamera musi mieć dostęp do internetu / routera');
  if (/nagrywa|utraci\s+polaczenie|utraci\s+połączenie/i.test(text)) add(findings, 'omówiono zapis nagrań mimo utraty połączenia z internetem');
  if (/obrotow|ptz|sterowac|sterować/i.test(text)) add(options, 'rozważane kamery obrotowe PTZ');
  if (/tubow|statyczn|zwykla\s+kamera|zwykła\s+kamera/i.test(text)) add(options, 'rozważane kamery tubowe / statyczne');
  if (/solarn/i.test(text)) {
    if (/nie\s+solarn|solarnych\s+nie|anty-solarn|nie\s+chce/i.test(text)) add(rejected, 'kamery solarne odrzucone przez klienta');
    else add(options, 'rozważane kamery solarne');
  }
  if (/korytk|listw|maskuj|mastuj|ukryc\s+kabel|ukryć\s+kabel/i.test(text)) add(options, 'prowadzenie przewodu w korytku / listwie maskującej');
  if (/rynnie|rynn/i.test(text)) add(options, 'wariant prowadzenia kabla przy rynnie');
  if (/strych|poddasz|podbitk/i.test(text)) add(options, 'wariant przejścia przez strych / poddasze / podbitkę');
  if (/puszk.*rolet|rolety|rolet/i.test(text)) add(options, 'możliwe wykorzystanie puszek / przewodów od rolet');
  if (/klimatyzac|skroplin|wymiennik/i.test(text)) add(options, 'możliwe wykorzystanie miejsca przy klimatyzacji');
  if (/przewier|wierc|przekuc|przejscie|przejście/i.test(text)) add(options, 'możliwy przewiert / przekucie pod przewód');
  if (/sasiad|sąsiad|ciezko\s+dostep|ciężko\s+dostęp/i.test(text)) add(followUps, 'sprawdzić dostęp do sąsiada / strychu, bo może być problem z wejściem');
  if (/prad|prąd|gniazdk|zasil/i.test(text)) add(followUps, 'sprawdzić realne źródło zasilania kamer');
  if (/wizualizator|wizualizac/i.test(text)) add(followUps, 'przygotować wizualizację rozmieszczenia kamer');
  if (/wy[sś]l[eę]\s+ofert|ofert[eę]|mail|sms/i.test(text)) add(followUps, 'wysłać klientowi ofertę po analizie wariantów');
  if (!/\b\d+\s+kamer/i.test(text)) add(followUps, 'liczba kamer nie jest jednoznaczna — nie doliczono kamer automatycznie bez ilości');
  if (/kabel|przewod|przewód|listw|korytk/i.test(text) && !/\b\d+(?:[.]\d+)?\s*(?:m|mb)\b/i.test(text)) add(followUps, 'brak długości przewodów / listew — trzeba wpisać metry przed zatwierdzeniem');
  return { isTranscript: true, findings, options, rejected, followUps };
}

function renderTranscriptInfoHtml(info) {
  if (!info?.isTranscript) return '';
  const block = (title, arr, cls='') => arr?.length ? `<div class="transcript-mini ${cls}"><strong>${escapeHtml(title)}</strong><ul>${arr.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>` : '';
  return `<details class="preview-block transcript-analysis" open><summary>Wnioski z transkrypcji wizyty</summary>${block('Rozpoznane fakty', info.findings)}${block('Rozważane warianty / opcje', info.options)}${block('Odrzucone albo niezalecane', info.rejected, 'rejected')}${block('Do sprawdzenia przed ofertą', info.followUps, 'todo')}</details>`;
}

function renderParserPreview(raw, result) {
  const box = $('parserPreview');
  const content = $('parserPreviewContent');
  const categoryOptions = CATEGORIES.map(cat => `<option value="${escapeAttr(cat)}">${escapeHtml(cat)}</option>`).join('');
  const rows = [
    ['name', 'Klient', result.client.name || ''],
    ['phone', 'Telefon', result.client.phone || ''],
    ['address', 'Adres', result.client.address || ''],
    ['detectedType', 'Typ zlecenia', result.detectedType || state.jobType || 'Kamery CCTV'],
    ['distanceKm', 'Dojazd km', result.distanceKm ?? ''],
    ['distanceRate', 'Stawka/km', result.distanceRate ?? ''],
    ['freeKm', 'Darmowe km', result.freeKm ?? '']
  ];
  const dataHtml = `<details class="preview-block" open><summary>Dane do wpisania / poprawienia</summary><div class="parser-data-editor">${rows.map(([field,label,value]) => field === 'detectedType'
    ? `<label class="parser-data-row"><span>${escapeHtml(label)}</span><select data-parser-field="${field}">${CATEGORIES.map(cat => `<option value="${escapeAttr(cat)}" ${cat === value ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}</select></label>`
    : `<label class="parser-data-row"><span>${escapeHtml(label)}</span><input data-parser-field="${field}" value="${escapeAttr(value)}"></label>`
  ).join('')}</div><div class="preview-learning-note">Poprawki zrobione w tym podglądzie program zapamięta po zatwierdzeniu.</div></details>`;

  const itemsHtml = result.items.length
    ? `<details class="preview-block" open><summary>Pozycje do dodania / poprawienia (${result.items.length})</summary><div class="preview-items-editor">${result.items.map((item, index) => previewItemEditorHtml(item, index, categoryOptions)).join('')}</div><div class="preview-actions-row"><button type="button" class="btn btn-soft" id="addPreviewItemBtn">Dodaj pustą pozycję</button></div></details>`
    : `<div class="preview-muted">Nie wykryto pewnych pozycji do wyceny. W transkrypcji program pokaże raczej fakty i braki, zamiast zgadywać ceny.</div><div class="preview-actions-row"><button type="button" class="btn btn-soft" id="addPreviewItemBtn">Dodaj pustą pozycję</button></div>`;

  const surchargeHtml = result.surchargeSuggestions?.length
    ? `<details class="preview-surcharge" open><summary>Możliwe dopłaty za trudne warunki (${result.surchargeSuggestions.length})</summary><p>Zaznacz tylko te, które mają wejść do wyceny. Program nie dolicza ich sam.</p><div class="surcharge-list">${result.surchargeSuggestions.map((suggestion, index) => `<label class="surcharge-item"><input type="checkbox" data-surcharge-index="${index}"><span><b>${escapeHtml(suggestion.item.name)}</b><small>${escapeHtml(suggestion.reason)}</small></span><strong>${number(suggestion.item.quantity, 1)} ${escapeHtml(suggestion.item.unit || 'usł')} × ${money(suggestion.item.priceNet)}</strong></label>`).join('')}</div></details>`
    : '';
  const transcriptHtml = renderTranscriptInfoHtml(result.transcriptInfo);
  const learnedHtml = result.learnedApplied?.length ? `<div class="preview-learning"><strong>Zastosowano zapamiętane korekty:</strong><br>${result.learnedApplied.map(escapeHtml).join('<br>')}</div>` : '';
  const missingHtml = result.missingData?.length ? `<details class="preview-warning" open><summary>Brakujące / do sprawdzenia (${result.missingData.length})</summary><ul>${result.missingData.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>` : '';
  const unknownHtml = result.unknown.length ? `<details class="preview-warning"><summary>Fragmenty niepewne (${result.unknown.length})</summary>${result.unknown.map(escapeHtml).join('<br>')}</details>` : '';
  content.innerHTML = `${transcriptHtml}${dataHtml}${itemsHtml}${surchargeHtml}${learnedHtml}${missingHtml}${unknownHtml}`;
  bindParserPreviewEditors();
  box.hidden = false;
}


/* Globalne stałe i bieżący stan aplikacji. */

const APP_VERSION = String(window.APP_CONFIG?.version || window.APP_VERSION || '');
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
  'Przewody / Okablowanie': ['Kabel antenowy RG6 CU', 'Skrętka UTP Cat 5e CU', 'Skrętka UTP Cat 6 CU', 'Przewód niskoprądowy 2×0,5', 'Prowadzenie przewodu — standardowe'],
  'Złącza / Akcesoria': ['Złącze F kompresyjne RG6', 'Wtyk RJ45 Cat 6 UTP', 'Rozgałęźnik antenowy 2-drożny', 'Zasilacz antenowy 12V z separatorem', 'Wzmacniacz antenowy masztowy'],
  'Dopłaty / Trudne warunki': ['Dopłata za trudny dostęp / wysokość', 'Dopłata za montaż na kominie lub maszcie', 'Dopłata za kucie / przekucie', 'Dopłata za kopanie / trudny grunt'],
  'Serwis': ['Diagnostyka / serwis', 'Aktualizacja oprogramowania', 'Dojazd']
};

const KEYWORDS_TO_TYPES = {
  'kamera': 'Kamery CCTV', 'kamery': 'Kamery CCTV', 'monitoring': 'Kamery CCTV', 'rejestrator': 'Kamery CCTV', 'nvr': 'Kamery CCTV', 'poe': 'Kamery CCTV', 'ptz': 'Kamery CCTV',
  'anten': 'Anteny / Sygnał', 'dvb': 'Anteny / Sygnał', 'satel': 'Anteny / Sygnał', 'konwerter': 'Anteny / Sygnał', 'sygnał': 'Anteny / Sygnał', 'sygnal': 'Anteny / Sygnał',
  'wifi': 'Sieć / Wi‑Fi', 'wi-fi': 'Sieć / Wi‑Fi', 'router': 'Sieć / Wi‑Fi', 'internet': 'Sieć / Wi‑Fi', 'lan': 'Sieć / Wi‑Fi', 'rj45': 'Sieć / Wi‑Fi', 'mesh': 'Sieć / Wi‑Fi',
  'skrętka': 'Przewody / Okablowanie', 'skretka': 'Przewody / Okablowanie', 'cat': 'Przewody / Okablowanie', 'rg6': 'Przewody / Okablowanie', 'przewód': 'Przewody / Okablowanie', 'przewod': 'Przewody / Okablowanie', 'zelowany': 'Przewody / Okablowanie', 'żelowany': 'Przewody / Okablowanie',
  'zlacze': 'Złącza / Akcesoria', 'złącze': 'Złącza / Akcesoria', 'zlacza': 'Złącza / Akcesoria', 'złącza': 'Złącza / Akcesoria', 'wtyk': 'Złącza / Akcesoria', 'wtyki': 'Złącza / Akcesoria', 'rjki': 'Złącza / Akcesoria', 'rj-ki': 'Złącza / Akcesoria', 'beczka': 'Złącza / Akcesoria', 'rozgałęźnik': 'Złącza / Akcesoria', 'rozgaleznik|rozgałeznik': 'Złącza / Akcesoria', 'zasilacz': 'Złącza / Akcesoria', 'wzmacniacz': 'Złącza / Akcesoria', 'keystone': 'Złącza / Akcesoria', 'gniazdo': 'Złącza / Akcesoria',
  'trudny': 'Dopłaty / Trudne warunki', 'trudne': 'Dopłaty / Trudne warunki', 'wysoko': 'Dopłaty / Trudne warunki', 'drabina': 'Dopłaty / Trudne warunki', 'komin': 'Dopłaty / Trudne warunki', 'strych': 'Dopłaty / Trudne warunki', 'przewiert': 'Dopłaty / Trudne warunki', 'kopanie': 'Dopłaty / Trudne warunki', 'wykop': 'Dopłaty / Trudne warunki',
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
  'Przewody / Okablowanie': ['Ustalić typ przewodu: antenowy / internetowy / prądowy', 'Policzyć metry przewodu', 'Określić teren prowadzenia: łatwy / standardowy / trudny', 'Sprawdzić czy materiał i robocizna mają być liczone osobno'],
  'Złącza / Akcesoria': ['Policzyć złącza F i RJ45', 'Ustalić typ złączy: nakręcane, kompresyjne, ekranowane, przelotowe', 'Ustalić rozgałęźniki, wzmacniacze i zasilacze antenowe', 'Sprawdzić czy złącza są jako materiał czy także zarobienie / zaciskanie'],
  'Dopłaty / Trudne warunki': ['Sprawdzić, czy trzeba użyć drabiny / wejść na wysokość', 'Sprawdzić liczbę przewiertów i rodzaj ścian', 'Ustalić czy będzie kopanie, bruk albo trudny grunt', 'Ustalić czy montaż jest na kominie, maszcie, strychu lub elewacji'],
  'Serwis': ['Opisać objawy usterki', 'Sprawdzić istniejący sprzęt', 'Zanotować wynik diagnozy', 'Ustalić zakres naprawy lub konfiguracji']
};


const VOICE_ITEM_RULES = [
  { key: 'camera', category: 'Kamery CCTV', name: 'Montaż kamery IP zewnętrznej', unit: 'szt', keywords: ['kamera', 'kamery', 'kamer', 'cctv'] },
  { key: 'ptz', category: 'Kamery CCTV', name: 'Montaż kamery obrotowej PTZ', unit: 'szt', keywords: ['ptz', 'obrotowa', 'obrotowe'] },
  { key: 'nvr', category: 'Kamery CCTV', name: 'Konfiguracja rejestratora NVR', unit: 'szt', keywords: ['rejestrator', 'nvr', 'dvr'] },
  { key: 'remote_preview', category: 'Kamery CCTV', name: 'Uruchomienie podglądu zdalnego', unit: 'usł', keywords: ['podgląd zdalny', 'podglad zdalny', 'podgląd w telefonie', 'podglad w telefonie', 'podgląd na telefonie', 'podglad na telefonie'] },
  { key: 'cable_lan', category: 'Kamery CCTV', name: 'Prowadzenie skrętki zewnętrznej', unit: 'mb', keywords: ['kabel', 'kabla', 'przewód', 'przewodu', 'skrętka', 'skretka', 'lan', 'utp'] },
  { key: 'rj45', category: 'Złącza / Akcesoria', name: 'Zaciskanie wtyku RJ45', unit: 'szt', keywords: ['rj45', 'rj-45', 'rjki', 'rj-ki', 'końcówka rj45', 'koncowka rj45', 'wtyk rj45', 'wtyki rj45'] },
  { key: 'fplug', category: 'Złącza / Akcesoria', name: 'Zarabianie złącza F', unit: 'szt', keywords: ['złącze f', 'zlacze f', 'złącza f', 'zlacza f', 'końcówka f', 'koncowka f', 'końcówki f', 'koncowki f', 'fka', 'f-ki'] },
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


const CABLE_MATERIAL_TYPES = [
  {
    key: 'cable_rg6_cu',
    name: 'Kabel antenowy RG6 CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.50,
    score: text => (/\brg\s*-?\s*6\b|\brg6\b|anten\w*|koncentryk|koncentryczn\w*/i.test(text) ? 20 : 0)
  },
  {
    key: 'cable_cat6_gel_cu',
    name: 'Skrętka żelowana Cat 6 CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 3.50,
    score: text => (/zelowan\w*|żelowan\w*|ziemn\w*|zewnetrzn\w*|zewnętrzn\w*|pe\b/i.test(text) ? (/\bcat\s*6\b|\bkat\s*6\b|kategoria\s*6/i.test(text) ? 30 : 0) : 0)
  },
  {
    key: 'cable_cat6_cu',
    name: 'Skrętka UTP Cat 6 CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.00,
    score: text => (/\bcat\s*6\b|\bkat\s*6\b|kategoria\s*6/i.test(text) ? 18 : 0)
  },
  {
    key: 'cable_cat5e_gel_cu',
    name: 'Skrętka żelowana Cat 5e CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.20,
    score: text => (/zelowan\w*|żelowan\w*|ziemn\w*|zewnetrzn\w*|zewnętrzn\w*|pe\b/i.test(text) ? (/\bcat\s*5e\b|\bkat\s*5e\b|kategoria\s*5e/i.test(text) ? 30 : (/skretk\w*|skrętk\w*|internetow\w*|lan|utp/i.test(text) ? 24 : 0)) : 0)
  },
  {
    key: 'cable_cat5e_cu',
    name: 'Skrętka UTP Cat 5e CU',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 2.00,
    score: text => (/\bcat\s*5e\b|\bkat\s*5e\b|kategoria\s*5e|skretk\w*|skrętk\w*|internetow\w*|lan|utp/i.test(text) ? 18 : 0)
  },
  {
    key: 'cable_low_voltage_2x05',
    name: 'Przewód niskoprądowy 2×0,5',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 1.50,
    score: text => (/2\s*(?:x|×|razy)\s*0[.,]?5|2x0[.,]?5|2×0[.,]?5/i.test(text) ? 35 : 0)
  },
  {
    key: 'cable_power_ydyp_3x25',
    name: 'Przewód prądowy YDYp 3×2,5',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 5.50,
    score: text => ((/prad\w*|prąd\w*|elektryczn\w*|zasilaj\w*|ydyp|ydy/i.test(text) ? 12 : 0) + (/3\s*x\s*2[.,]?5|3×2[.,]?5/i.test(text) ? 15 : 0))
  },
  {
    key: 'cable_power_ydyp_3x15',
    name: 'Przewód prądowy YDYp 3×1,5',
    category: 'Przewody / Okablowanie',
    unit: 'mb',
    defaultPrice: 3.50,
    score: text => (/prad\w*|prąd\w*|elektryczn\w*|zasilaj\w*|ydyp|ydy/i.test(text) ? 14 : 0)
  }
];

const CABLE_LABOR_TYPES = [
  { key: 'cable_labor_easy', name: 'Prowadzenie przewodu — łatwe', priceNet: 5.00, test: text => /latw\w*|łatw\w*|prosto|bez\s+problemu|po\s+wierzchu|po\s+zewnatrz|po\s+zewnątrz/i.test(text) },
  { key: 'cable_labor_ground', name: 'Prowadzenie przewodu w ziemi', priceNet: 20.00, test: text => /w\s+ziemi|ziemn\w*|zakop\w*|wykop\w*|rurze\s+ziemnej/i.test(text) },
  { key: 'cable_labor_conduit', name: 'Prowadzenie przewodu w peszlu', priceNet: 12.00, test: text => /peszl\w*|rurce|rurze|rura\s+oslonowa|rura\s+osłonowa/i.test(text) },
  { key: 'cable_labor_strip', name: 'Prowadzenie przewodu w listwie', priceNet: 10.00, test: text => /listw\w*|maskowan\w*|korytk\w*/i.test(text) },
  { key: 'cable_labor_hard', name: 'Prowadzenie przewodu — trudne', priceNet: 14.00, test: text => /trudn\w*|ciezk\w*|ciężk\w*|strych|poddasz\w*|dach|komin|pod\s+elewacj\w*/i.test(text) },
  { key: 'cable_labor_standard', name: 'Prowadzenie przewodu — standardowe', priceNet: 8.00, test: () => true }
];


const ACCESSORY_TYPES = [
  { key: 'f_compression', name: 'Złącze F kompresyjne RG6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 2.50, score: text => (/((zlacz\w*|złącz\w*|wtyk\w*|koncowk\w*|końcówk\w*)\s*f|\bf\s*(?:-?ki|ki)?\b)/i.test(text) && /kompres\w*|zaciskan\w*/i.test(text) ? 35 : 0) },
  { key: 'f_angle', name: 'Złącze F kątowe', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 4.00, score: text => (/((zlacz\w*|złącz\w*|wtyk\w*|koncowk\w*|końcówk\w*)\s*f|\bf\s*(?:-?ki|ki)?\b)/i.test(text) && /katow\w*|kątow\w*/i.test(text) ? 34 : 0) },
  { key: 'f_coupler', name: 'Przejście F-F / beczka antenowa', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 2.00, score: text => (/beczk\w*|przejsc\w*\s*f|przejści\w*\s*f|f\s*[-/]\s*f|zlaczk\w*\s*f|złączk\w*\s*f/i.test(text) ? 33 : 0) },
  { key: 'f_screw', name: 'Złącze F nakręcane RG6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 1.50, score: text => (/((zlacz\w*|złącz\w*|wtyk\w*|koncowk\w*|końcówk\w*)\s*f|\bf\s*(?:-?ki|ki)?\b)/i.test(text) ? (/nakrecan\w*|nakręcan\w*/i.test(text) ? 32 : 24) : 0) },
  { key: 'iec_angle', name: 'Wtyk antenowy kątowy', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 6.00, score: text => (/wtyk\w*\s+anten\w*|iec/i.test(text) && /katow\w*|kątow\w*/i.test(text) ? 30 : 0) },
  { key: 'iec_female', name: 'Wtyk antenowy IEC żeński', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 5.00, score: text => (/wtyk\w*\s+anten\w*|iec/i.test(text) && /zenski\w*|żeński\w*|gniazdo/i.test(text) ? 26 : 0) },
  { key: 'iec_male', name: 'Wtyk antenowy IEC męski', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 5.00, score: text => (/wtyk\w*\s+anten\w*|iec/i.test(text) ? 22 : 0) },
  { key: 'splitter4', name: 'Rozgałęźnik antenowy 4-drożny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/rozgal\w*|rozgał\w*|rozdziel\w*|splitter/i.test(text) && /(4|czter\w*)\s*(?:wyjsc|wyjść|droz|dróz|droż)/i.test(text) ? 31 : 0) },
  { key: 'splitter3', name: 'Rozgałęźnik antenowy 3-drożny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 25.00, score: text => (/rozgal\w*|rozgał\w*|rozdziel\w*|splitter/i.test(text) && /(3|trz\w*)\s*(?:wyjsc|wyjść|droz|dróz|droż)/i.test(text) ? 30 : 0) },
  { key: 'splitter2', name: 'Rozgałęźnik antenowy 2-drożny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 20.00, score: text => (/rozgal\w*|rozgał\w*|rozdziel\w*|splitter/i.test(text) ? 25 : 0) },
  { key: 'tap', name: 'Odgałęźnik antenowy TAP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 30.00, score: text => (/odgal\w*|odgał\w*|\btap\b/i.test(text) ? 28 : 0) },
  { key: 'rtv_sat_socket_pass', name: 'Gniazdo RTV/SAT przelotowe', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 40.00, score: text => (/gniazd\w*\s+(?:rtv|sat|rtv\/sat|anten)/i.test(text) && /przelot\w*/i.test(text) ? 28 : 0) },
  { key: 'rtv_sat_socket', name: 'Gniazdo RTV/SAT końcowe', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/gniazd\w*\s+(?:rtv|sat|rtv\/sat|anten)/i.test(text) ? 24 : 0) },
  { key: 'antenna_amp_with_psu', name: 'Wzmacniacz antenowy z zasilaczem', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 155.00, score: text => (/wzmacniacz\w*\s+anten\w*/i.test(text) && /zasilacz\w*/i.test(text) ? 34 : 0) },
  { key: 'antenna_amp_mast', name: 'Wzmacniacz antenowy masztowy', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 80.00, score: text => (/wzmacniacz\w*\s+anten\w*/i.test(text) && /maszt\w*/i.test(text) ? 30 : 0) },
  { key: 'antenna_amp_internal', name: 'Wzmacniacz antenowy wewnętrzny', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 120.00, score: text => (/wzmacniacz\w*\s+anten\w*|rozgałęźnik\w*\s+aktywn\w*|rozgaleznik|rozgałeznik\w*\s+aktywn\w*/i.test(text) ? 25 : 0) },
  { key: 'antenna_psu', name: 'Zasilacz antenowy 12V z separatorem', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/zasilacz\w*\s+anten\w*/i.test(text) ? 30 : 0) },
  { key: 'power_supply_12v_5a', name: 'Zasilacz 12V 5A', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 55.00, score: text => (/zasilacz\w*/i.test(text) && /5\s*a\b/i.test(text) ? 22 : 0) },
  { key: 'power_supply_12v_2a', name: 'Zasilacz 12V 2A', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 30.00, score: text => (/zasilacz\w*/i.test(text) && /2\s*a\b/i.test(text) ? 21 : 0) },
  { key: 'power_supply_12v_cctv', name: 'Zasilacz 12V CCTV', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/zasilacz\w*/i.test(text) && /(12\s*v|cctv|kamera|kamer)/i.test(text) ? 18 : 0) },
  { key: 'rj45_cat6_shielded', name: 'Wtyk RJ45 Cat 6 ekranowany FTP/STP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 1.80, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) && /(ftp|stp|ekran\w*)/i.test(text) ? 34 : 0) },
  { key: 'rj45_cat6_pass', name: 'Wtyk RJ45 przelotowy Cat 6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.90, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) && /przelot\w*/i.test(text) ? 33 : 0) },
  { key: 'rj45_cat6', name: 'Wtyk RJ45 Cat 6 UTP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.90, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) ? 30 : 0) },
  { key: 'rj45_cat5e', name: 'Wtyk RJ45 Cat 5e UTP', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.60, score: text => (/rj\s*-?\s*45|rjek|rjki|rj-ki|wtyk\w*\s+lan|koncowk\w*\s+rj|końcówk\w*\s+rj/i.test(text) && /(cat\s*5e|kat\s*5e|kategoria\s*5e)/i.test(text) ? 30 : 0) },
  { key: 'rj45_boot', name: 'Osłonka RJ45', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 0.50, score: text => (/oslonk\w*|oslon\w*|osłonk\w*|osłon\w*/i.test(text) && /rj\s*-?\s*45|rj/i.test(text) ? 29 : 0) },
  { key: 'rj45_coupler', name: 'Łącznik RJ45 / beczka LAN', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 8.00, score: text => (/beczk\w*|lacznik\w*|łącznik\w*|przejsc\w*|przejści\w*/i.test(text) && /(rj\s*-?\s*45|lan)/i.test(text) ? 28 : 0) },
  { key: 'keystone_cat6', name: 'Moduł keystone RJ45 Cat 6', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 18.00, score: text => (/keystone|modul\w*\s+rj|moduł\w*\s+rj/i.test(text) && /(cat\s*6|kat\s*6|kategoria\s*6)/i.test(text) ? 30 : 0) },
  { key: 'keystone_cat5e', name: 'Moduł keystone RJ45 Cat 5e', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 12.00, score: text => (/keystone|modul\w*\s+rj|moduł\w*\s+rj/i.test(text) ? 24 : 0) },
  { key: 'lan_socket_2', name: 'Gniazdo LAN natynkowe 2xRJ45', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 35.00, score: text => (/gniazd\w*\s+lan|gniazd\w*\s+rj/i.test(text) && /2\s*x|podwojn\w*|2\s*rj/i.test(text) ? 28 : 0) },
  { key: 'lan_socket_1', name: 'Gniazdo LAN natynkowe 1xRJ45', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 25.00, score: text => (/gniazd\w*\s+lan|gniazd\w*\s+rj/i.test(text) ? 24 : 0) },
  { key: 'patch_panel_24', name: 'Patch panel 24-port', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 140.00, score: text => (/patch\s*panel/i.test(text) && /24/i.test(text) ? 24 : 0) },
  { key: 'patch_panel_12', name: 'Patch panel 12-port', category: 'Złącza / Akcesoria', unit: 'szt', defaultPrice: 80.00, score: text => (/patch\s*panel/i.test(text) ? 20 : 0) }
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


/* Kolejne aktywne nakładki zgodności, wykonywane w oryginalnej kolejności. */






















































































































































































































/* =========================================================
   v2.2 — poprawki parsera, edytowalny podgląd i mocniejsze uczenie
   ========================================================= */




























/* v2.2b — korekty reguł z testów Bogusława */





/* v2.2c — cena puszek z dyktowania ma pierwszeństwo przed ceną domyślną */



/* =========================================================
   v2.3 — parser długich transkrypcji wizyt, notatki uniwersalne,
   poprawione samouczenie i bardziej zwarty podgląd korekt
   ========================================================= */


















seedBuiltInLearningForInstaller();


document.addEventListener('DOMContentLoaded', init);


/* v2.4 — wzorce z archiwum transkrypcji usług, parser kontekstowy i łatwiejsze poprawki */
const INSTALLER_ARCHIVE_TRAINING = {
  version: '2.6 - 1205260925',
  filesScanned: 417,
  categories: {
    'Kamery CCTV': 186,
    'Sieć / Wi‑Fi': 316,
    'Anteny / Sygnał': 241,
    'TV / Montaż': 229,
    'Komputery / Telefony': 371,
    'Prace drobne': 82
  },
  notes: [
    'Długie transkrypcje są najpierw czyszczone z nagłówków, znaczników czasu, INFO/ERROR i pustych wstawek.',
    'Program odróżnia pewne pozycje do wyceny od wariantów: można, ewentualnie, wchodzi w grę, trzeba sprawdzić.',
    'Przy niepewnej transkrypcji program ma dopisywać braki i pytania zamiast doliczać pozycje na siłę.'
  ]
};

const INSTALLER_BUILTIN_PHRASE_RULES = [
  ['rjotki', 'rj45'], ['erjotki', 'rj45'], ['arjotki', 'rj45'], ['rj ki', 'rj45'], ['rj-ki', 'rj45'], ['rjki', 'rj45'],
  ['f ki', 'złącza f'], ['f-ki', 'złącza f'], ['efki', 'złącza f'], ['fka', 'złącze f'],
  ['obrotowki', 'kamery obrotowe'], ['obrotówki', 'kamery obrotowe'], ['obrotowka', 'kamera obrotowa'], ['obrotówka', 'kamera obrotowa'],
  ['tubowki', 'kamery tubowe'], ['tubówki', 'kamery tubowe'], ['tubowa', 'kamera tubowa'], ['tubowe', 'kamery tubowe'],
  ['listy mastujace', 'listwy maskujące'], ['listwy mastujace', 'listwy maskujące'], ['listwy mastujące', 'listwy maskujące'], ['listwa wykanczajaca', 'listwa maskująca'], ['listwa wykańczająca', 'listwa maskująca'],
  ['korytko', 'listwa maskująca'], ['korytka', 'listwy maskujące'], ['korytkiem', 'listwą maskującą'],
  ['przez jeden', '/1'], ['przez 1', '/1'], ['przez dwa', '/2'], ['przez 2', '/2'], ['przez trzy', '/3'], ['przez 3', '/3'],
  ['podglad na telefon', 'podgląd zdalny'], ['podgląd na telefon', 'podgląd zdalny'], ['podglad w telefonie', 'podgląd zdalny'], ['podgląd w telefonie', 'podgląd zdalny'],
  ['ancenowy', 'antenowy'], ['anceny', 'anteny'], ['ankene', 'antenę'], ['ankena', 'antena'], ['konwenter', 'konwerter'],
  ['badowice gorne', 'wadowice górne'], ['badowice górne', 'wadowice górne'], ['rodowa 46', 'ogrodowa 46']
];

const INSTALLER_CONTEXT_STOP_PHRASES = /\b(można by|mozna by|ewentualnie|wchodzi w gre|wchodzi w grę|trzeba sprawdzic|trzeba sprawdzić|nie wiem czy|jedna z opcji|wariant|gdyby|jakby|moze|może|raczej|prawdopodobnie)\b/i;
const INSTALLER_DECISION_PHRASES = /\b(robimy|montujemy|do zamontowania|trzeba zamontowac|trzeba zamontować|bede montowal|będę montował|ustalone|finalnie|ostatecznie|wycena|do wyceny|ma byc|ma być|klient chce|klientka chce)\b/i;


const init_v23_for_v24 = init;
init = function() {
  init_v23_for_v24();
  renderArchiveLearningView();
};

applyPhraseDictionary = function(text) {
  let out = String(text || '');
  for (const [fromRaw, toRaw] of INSTALLER_BUILTIN_PHRASE_RULES) {
    const from = baseNormalizeSpeechText(fromRaw);
    const to = baseNormalizeSpeechText(toRaw);
    if (!from || !to || from === to) continue;
    out = out.replace(new RegExp(`(^|\s)${escapeRegExp(from)}(?=\s|$)`, 'gi'), `$1${to}`);
  }
  for (const rule of parsePhraseDictionary(loadPhraseDictionaryText())) {
    const from = baseNormalizeSpeechText(rule.from);
    const to = baseNormalizeSpeechText(rule.to);
    if (!from || !to || from === to) continue;
    out = out.replace(new RegExp(`(^|\s)${escapeRegExp(from)}(?=\s|$)`, 'g'), `$1${to}`);
  }
  return out.replace(/\s+/g, ' ').trim();
};





parseTranscriptAddress = function(rawText) {
  const title = installerCleanTitleFromTranscript(rawText);
  const fromTitle = installerAddressFromPhrase(title, false);
  if (fromTitle) return fromTitle;
  const raw = String(rawText || '').replace(/\\/g, ' / ').replace(/_/g, ' ');
  const firstLines = raw.split('\n').slice(0, 80).join(' ');
  const fromFirst = installerAddressFromPhrase(firstLines, false);
  if (fromFirst) return fromFirst;
  return '';
};


detectTypes = function(notes) {
  return installerScoreJobTypes(notes).map(([cat]) => cat);
};


buildFocusedTranscriptText = function(rawText) {
  if (!isVisitTranscript(rawText)) return cleanDictationSpaces(rawText);
  const title = installerCleanTitleFromTranscript(rawText);
  const address = parseTranscriptAddress(rawText);
  const keepRe = /wycena|ofert|kamera|kamery|monitoring|rejestrator|nvr|dvr|podgl[aą]d|telefon|aplikacj|router|internet|wifi|wi-fi|lan|rj|switch|anten|dekoder|konwerter|talerz|telewizor|uchwyt|wieszak|klamka|zamek|laptop|komputer|windows|drukarka|kabel|przew[oó]d|skr[eę]tka|cat|rg6|pr[aą]d|zasil|gniazdk|wago|puszk|listw|korytk|peszl|przewier|wierc|przekuc|kopan|strych|poddasz|podbitk|rynnie|rynn|komin|maszt|elewacj|ociepl|wysoko|drabin|dach|rolet|klimatyzac|s[aą]siad|dost[eę]p|trudn|wizualizac|mail|sms|koszt|cena|zł|netto|brutto|metr|mb/i;
  const important = [];
  for (const sentence of installerSplitSentences(rawText)) {
    if (keepRe.test(sentence) || INSTALLER_DECISION_PHRASES.test(sentence)) important.push(sentence);
  }
  const prefix = [title ? `tytuł ${title}` : '', address ? `adres ${address}` : ''].filter(Boolean).join('. ');
  return cleanDictationSpaces((prefix ? `${prefix}. ` : '') + important.join('. '));
};

analyzeVisitTranscript = function(rawText, focusedText) {
  const isTranscript = isVisitTranscript(rawText);
  if (!isTranscript) return { isTranscript: false, findings: [], options: [], rejected: [], followUps: [] };
  const text = normalizeSpeechText(focusedText || rawText);
  const findings = [];
  const options = [];
  const rejected = [];
  const followUps = [];
  const add = (arr, value) => { if (value && !arr.includes(value)) arr.push(value); };
  const addr = parseTranscriptAddress(rawText);
  if (addr) add(findings, `adres z transkrypcji / nazwy pliku: ${addr}`);
  const start = String(rawText || '').match(/start\s+godzina\s+(\d{1,2}[.:]\d{2})/i);
  if (start) add(findings, `początek wizyty: ${start[1].replace('.', ':')}`);
  const scores = installerScoreJobTypes(text);
  if (scores.length) add(findings, `najbardziej prawdopodobny typ: ${scores[0][0]}`);
  if (/podglad zdalny|aplikacj/.test(text)) add(findings, 'w rozmowie pojawia się podgląd w telefonie / aplikacji');
  if (/router|internet|wifi|wi-fi|lan|switch|modem|swiatlowod/.test(text)) add(findings, 'w rozmowie pojawia się internet / router / sieć');
  if (/nagrywa|zapis|dysk|rejestrator/.test(text)) add(findings, 'omówiono zapis nagrań albo rejestrator');
  if (/obrotow|ptz|sterowac|sterowac|obracac/.test(text)) add(options, 'kamery obrotowe PTZ');
  if (/tubow|statyczn|kamera tubowa|zwykla kamera/.test(text)) add(options, 'kamery tubowe / statyczne');
  if (/solarn/.test(text)) (/nie solarn|solarnych nie|anty-solarn|nie chce/.test(text) ? add(rejected, 'kamery solarne odrzucone albo niechciane') : add(options, 'kamery solarne'));
  if (/korytk|listw|maskuj|ukryc kabel|ukryć kabel/.test(text)) add(options, 'prowadzenie przewodu w listwie / korytku');
  if (/rynnie|rynn/.test(text)) add(options, 'prowadzenie przewodu przy rynnie');
  if (/strych|poddasz|podbitk/.test(text)) add(options, 'przejście przez strych / poddasze / podbitkę');
  if (/puszk.*rolet|rolety|rolet/.test(text)) add(options, 'wykorzystanie puszek albo przewodów od rolet');
  if (/klimatyzac|skroplin|wymiennik/.test(text)) add(options, 'wariant przy klimatyzacji / skroplinach');
  if (/przewier|wierc|przekuc|przejscie|przejście/.test(text)) add(options, 'przewiert / przekucie pod przewód');
  if (/anten|dekoder|konwerter|sygnal/.test(text)) add(options, 'instalacja antenowa / sygnał TV');
  if (/router|tp-link|access point|repeater|mesh/.test(text)) add(options, 'konfiguracja routera / Wi‑Fi');
  if (/sasiad|sąsiad|ciezko dostep|ciężko dostęp/.test(text)) add(followUps, 'sprawdzić dostęp do sąsiada / strychu / części wspólnej');
  if (/prad|prąd|gniazdk|zasil/.test(text)) add(followUps, 'sprawdzić realne źródło zasilania');
  if (/wizualizac|wizualizator/.test(text)) add(followUps, 'przygotować wizualizację rozmieszczenia sprzętu');
  if (/wy[sś]le ofert|ofert[eę]|mail|sms/.test(text)) add(followUps, 'przygotować i wysłać ofertę');
  if (scores[0]?.[0] === 'Kamery CCTV' && !/\b\d+\s+kamer/.test(text)) add(followUps, 'liczba kamer nie jest jednoznaczna — nie doliczać kamer bez potwierdzenia');
  if (/kabel|przewod|przewód|listw|korytk/.test(text) && !/\b\d+(?:[.]\d+)?\s*(?:m|mb)\b/.test(text)) add(followUps, 'brak długości przewodów / listew');
  return { isTranscript: true, findings, options, rejected, followUps };
};

parseClientAddress = function(rawText, normalizedText) {
  const transcriptAddress = parseTranscriptAddress(rawText);
  if (transcriptAddress) return transcriptAddress;
  const compact = cleanDictationSpaces(rawText);
  const explicit = compact.match(/(?:adres|miejscowość|miejscowosc|ulica|ul\.?|ulica)\s+([^,.;\n]{3,90})/i);
  if (explicit) {
    const cut = explicit[1].split(/\b(?:telefon|tel|klient|montaz|montaż|kamera|kamery|router|internet|dojazd|cena)\b/i)[0].trim();
    const adr = installerAddressFromPhrase((/^(ul\.?|ulica)/i.test(explicit[0]) ? 'ul. ' : '') + cut, false);
    if (adr) return adr;
  }
  const addr = installerAddressFromPhrase(compact, false);
  if (addr) return addr;
  return '';
};

parseClientName = function(rawText) {
  const raw = cleanDictationSpaces(rawText);
  const explicit = raw.match(/\b(?:klient|klientka|pan|pani)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+)/);
  if (explicit && isLikelyHumanName(explicit[1])) return explicit[1];
  const beforeAddress = raw.match(/^\s*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+)\s+(?:ul\.?|ulica|[A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźż-]+\s+\d)/);
  if (beforeAddress && isLikelyHumanName(beforeAddress[1])) return beforeAddress[1];
  const title = installerCleanTitleFromTranscript(rawText);
  const titleName = title.match(/\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+)\b/);
  if (titleName && isLikelyHumanName(titleName[1]) && !/Wadowice|Ogrodowa|Limanowskiego|Sielska|Kossaka|Bajana|Cyranowska|Poniatowskiego|Lwowska|Wolno|Działkowców|Dzialkowcow|Top Gaz|FitCake/i.test(titleName[1])) return titleName[1];
  return '';
};



const extractSpecialVoiceItems_v23_for_v24 = extractSpecialVoiceItems;
extractSpecialVoiceItems = function(text) {
  const base = extractSpecialVoiceItems_v23_for_v24(text);
  const archive = parseArchiveTrainedServiceItems(text, isVisitTranscript(text));
  for (const item of archive.items) {
    if (!base.items.some(x => x._voiceKey === item._voiceKey || (x.category === item.category && x.name === item.name))) base.items.push(item);
  }
  base.usedFragments.push(...archive.usedFragments);
  return base;
};

const parseSmartCommand_v23_for_v24 = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const isTranscript = isVisitTranscript(rawText);
  const focusedText = isTranscript ? buildFocusedTranscriptText(rawText) : rawText;
  const result = parseSmartCommand_v23_for_v24(focusedText);
  result.client = parseClientData(rawText, normalizeSpeechText(focusedText));
  const transcriptInfo = analyzeVisitTranscript(rawText, focusedText);
  result.transcriptInfo = transcriptInfo;
  const scoreTypes = installerScoreJobTypes(focusedText);
  if (scoreTypes.length) result.detectedType = scoreTypes[0][0];
  if (isTranscript) {
    const merged = mergeParserItems([...result.items, ...parseArchiveTrainedServiceItems(normalizeSpeechText(focusedText), true).items]);
    result.items = merged.filter(item => {
      const n = String(item.name || '').toLowerCase();
      if (/montaż kamery ip zewnętrznej|montaż kamery ip wewnętrznej|montaż kamery obrotowej|montaż kamery tubowej/i.test(n)) {
        return /\b\d+\s+kamer/i.test(normalizeSpeechText(focusedText));
      }
      return true;
    });
    result.missingData = detectMissingData(rawText, { client: result.client, items: result.items, detectedType: result.detectedType, distanceKm: result.distanceKm, distanceRate: result.distanceRate, freeKm: result.freeKm, transcriptInfo });
    for (const f of transcriptInfo.followUps || []) if (!result.missingData.includes(f)) result.missingData.push(f);
  }
  result.learnedApplied = applyLearnedCorrections(rawText, result.items);
  return result;
};


// Rozszerzenie kategorii, podpowiedzi i checklist po wczytaniu cennika.
seedArchiveCatalogMetadata();

// v2.4: panel wzorców musi się wyrenderować niezależnie od wcześniejszego listenera init.
document.addEventListener('DOMContentLoaded', renderArchiveLearningView);

/* v2.4.1 — korekta adresu z miejscowością i ostrożniejsze pozycje z długich transkrypcji */


parseClientAddress = function(rawText, normalizedText) {
  const transcriptAddress = parseTranscriptAddress(rawText);
  if (transcriptAddress) return transcriptAddress;
  const raw = cleanDictationSpaces(rawText);
  const city = installerKnownCityFromText(raw);
  const cityBeforeStreet = raw.match(/\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+)?)\s+(?:ul\.?|ulica)\s+([A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}){0,2})\s+(\d+[a-zA-Z]?(?:\s*(?:\/|przez)\s*\d+[a-zA-Z]?)?)/i);
  if (cityBeforeStreet && installerKnownCityFromText(cityBeforeStreet[1])) {
    return installerJoinAddressCity(`ul. ${titleCase(cityBeforeStreet[2])} ${cityBeforeStreet[3].replace(/\s*przez\s*/i,'/')}`, titleCase(cityBeforeStreet[1]));
  }
  const street = raw.match(/(?:ul\.?|ulica)\s+([A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}){0,2})\s+(\d+[a-zA-Z]?(?:\s*(?:\/|przez)\s*\d+[a-zA-Z]?)?)/i);
  if (street) return installerJoinAddressCity(`ul. ${titleCase(street[1])} ${street[2].replace(/\s*przez\s*/i,'/')}`, city);
  const addr = installerAddressFromPhrase(raw, false);
  if (addr) return installerJoinAddressCity(addr, city);
  return city || '';
};


const parseSmartCommand_v24_before_filter = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v24_before_filter(rawText);
  if (isVisitTranscript(rawText)) {
    const focused = buildFocusedTranscriptText(rawText);
    result.items = result.items.filter(item => installerTranscriptItemCertain(item, focused));
    result.missingData = detectMissingData(rawText, { client: result.client, items: result.items, detectedType: result.detectedType, distanceKm: result.distanceKm, distanceRate: result.distanceRate, freeKm: result.freeKm, transcriptInfo: result.transcriptInfo });
    for (const f of result.transcriptInfo?.followUps || []) if (!result.missingData.includes(f)) result.missingData.push(f);
  }
  return result;
};

/* v2.4.2 — parseTranscriptAddress używany tylko dla realnej transkrypcji, żeby krótkie dyktowanie nie gubiło miasta */
parseClientAddress = function(rawText, normalizedText) {
  const transcriptAddress = isVisitTranscript(rawText) ? parseTranscriptAddress(rawText) : '';
  if (transcriptAddress) return transcriptAddress;
  const raw = cleanDictationSpaces(rawText);
  const city = installerKnownCityFromText(raw);
  const cityBeforeStreet = raw.match(/\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+)?)\s+(?:ul\.?|ulica)\s+([A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}){0,2})\s+(\d+[a-zA-Z]?(?:\s*(?:\/|przez)\s*\d+[a-zA-Z]?)?)/i);
  if (cityBeforeStreet && installerKnownCityFromText(cityBeforeStreet[1])) {
    return installerJoinAddressCity(`ul. ${titleCase(cityBeforeStreet[2])} ${cityBeforeStreet[3].replace(/\s*przez\s*/i,'/')}`, titleCase(cityBeforeStreet[1]));
  }
  const street = raw.match(/(?:ul\.?|ulica)\s+([A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ.-]{2,}){0,2})\s+(\d+[a-zA-Z]?(?:\s*(?:\/|przez)\s*\d+[a-zA-Z]?)?)/i);
  if (street) return installerJoinAddressCity(`ul. ${titleCase(street[1])} ${street[2].replace(/\s*przez\s*/i,'/')}`, city);
  const addr = installerAddressFromPhrase(raw, false);
  if (addr) return installerJoinAddressCity(addr, city);
  return city || '';
};


/* v2.5 — poprawka rozbijania tekstu: klient po słowie „klient”, liczby kamer tubowych/obrotowych,
   materiały kamer, puszki, przewiert i przewód 10-metrowy 2×0,5 */
try {
  for (const word of ['trzeba', 'zrobic', 'zrobić', 'zamontowac', 'zamontować', 'przedluzyc', 'przedłużyć']) {
    if (!CLIENT_FIELD_STOP_WORDS.includes(word)) CLIENT_FIELD_STOP_WORDS.push(word);
  }
} catch {}

const baseNormalizeSpeechText_v26_before = baseNormalizeSpeechText;
baseNormalizeSpeechText = function(text) {
  let out = baseNormalizeSpeechText_v26_before(text);
  out = out
    .replace(/\bdziesiecio\s*metrow\w*\b/g, '10 m')
    .replace(/\bdziesiec\s*metrow\w*\b/g, '10 m')
    .replace(/\bpiecio\s*metrow\w*\b/g, '5 m')
    .replace(/\bpietnasto\s*metrow\w*\b/g, '15 m')
    .replace(/\bdwudziesto\s*metrow\w*\b/g, '20 m')
    .replace(/\btrzydziesto\s*metrow\w*\b/g, '30 m')
    .replace(/\b2\s*x\s*0\s*5\b/g, '2x0.5')
    .replace(/\b2\s*×\s*0\s*5\b/g, '2x0.5');
  return out.replace(/\s+/g, ' ').trim();
};

parseClientName = function(rawText) {
  const raw = cleanDictationSpaces(rawText);
  const nameWord = '[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ\\\'-]*';
  const stop = '(?=\\s+(?:trzeba|zrobic|zrobić|zamontowac|zamontować|bede|będę|montaz|montaż|kamera|kamery|kamer|kabel|przewod|przewód|dojazd|telefon|tel|adres|ulica|ul\\.?)(?:\\s|$)|$)';
  const explicit = raw.match(new RegExp('\\b(?:klient|klientka|pan|pani)\\s+(' + nameWord + '\\s+' + nameWord + ')' + stop, 'i'));
  if (explicit) {
    const name = cleanNameFragment(explicit[1]);
    if (isLikelyPersonName(name) || isLikelyHumanName(name)) return titleCase(name);
  }
  const rawCityStreet = raw.match(new RegExp('^\\s*(?:' + KNOWN_CITIES.map(escapeRegExp).join('|') + ')\\s+(?:ul\\.?|ulica)\\s+[^,.;]{3,80}?\\s+\\d+[a-zA-Z]?(?:/\\d+)?\\s+(?:klient|klientka|pan|pani)\\s+(' + nameWord + '\\s+' + nameWord + ')' + stop, 'i'));
  if (rawCityStreet) {
    const name = cleanNameFragment(rawCityStreet[1]);
    if (isLikelyPersonName(name) || isLikelyHumanName(name)) return titleCase(name);
  }
  const beforeAddress = raw.match(new RegExp('^\\s*(' + nameWord + '\\s+' + nameWord + ')\\s+(?:ul\\.?|ulica|adres)\\b', 'i'));
  if (beforeAddress) {
    const name = cleanNameFragment(beforeAddress[1]);
    if (isLikelyPersonName(name) || isLikelyHumanName(name)) return titleCase(name);
  }
  const title = installerCleanTitleFromTranscript(rawText);
  const titleName = title.match(new RegExp('\\b(' + nameWord + '\\s+' + nameWord + ')\\b', 'i'));
  if (titleName) {
    const name = cleanNameFragment(titleName[1]);
    if ((isLikelyPersonName(name) || isLikelyHumanName(name)) && !/Wadowice|Ogrodowa|Limanowskiego|Sielska|Kossaka|Bajana|Cyranowska|Poniatowskiego|Lwowska|Wolno|Działkowców|Dzialkowcow|Top Gaz|FitCake/i.test(name)) return titleCase(name);
  }
  return '';
};

stripClientFragmentsForItems = function(text) {
  let out = ` ${String(text || '')} `;
  const serviceStartWords = '(?:trzeba|zrobic|zrobić|zamontowac|zamontować|przedluzyc|przedłużyć|montaż|montaz|instalacja|instalacje|instalację|kamera|kamery|kamer|kabel|przewód|przewod|dojazd|robocizna|rejestrator|router|domofon|wideodomofon|alarm|czujka|pilot|antena|anteny|switch|poe|dysk|puszka|puszki|uchwyt|uchwyty|rj45|rj-45|rjki|zlacze|złącze|zlacza|złacza|złącza|wtyk|wtyki|koncowka|końcówka|beczka|rozgaleznik|rozgałeznik|rozgałęźnik|zasilacz|wzmacniacz|keystone|gniazdo|separator|nauka)';
  out = out.replace(/(?:^|\s)(?:telefon|tel|numer telefonu|komórka|komorka)\s*(?:to\s+|jest\s+)?(?:\+?48\s*)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}(?=\s|$)/gi, ' ');
  out = out.replace(/^\s*.*?(?=\s+(?:ul\.?|ulica|adres|przy ulicy|na adres|pod adresem)\s+)/i, ' ');
  out = out.replace(new RegExp('(?:^|\\s)(?:miejscowość|miejscowosc)\\s+\\S+(?=\\s+(?:' + serviceStartWords + '|telefon|tel|adres|ulica|ul\\.?)(?=\\s|$)|$)', 'gi'), ' ');
  out = out.replace(new RegExp('(?:^|\\s)(?:adres|ulica|ul\\.?|przy ulicy|na adres|pod adresem)\\s+.*?(?=\\s+(?:miejscowość|miejscowosc|telefon|tel|klient|klientka|imię|imie|nazwisko|' + serviceStartWords + ')(?=\\s|$)|$)', 'gi'), ' ');
  out = out.replace(new RegExp('(?:^|\\s)(?:imię i nazwisko|imie i nazwisko|imię nazwisko|imie nazwisko|miej nazwisko|klientka|klient|u klienta|u klientki|pan|pani|nazwisko|imię|imie)\\s+.*?(?=\\s+(?:adres|ulica|ul\\.?|telefon|tel|' + serviceStartWords + ')(?=\\s|$)|$)', 'gi'), ' ');
  return out.replace(/\s+/g, ' ').trim();
};


parseCameraTypeBreakdown = function(text) {
  const breakdown = installerParseCameraBreakdownV25(text);
  const out = [];
  const add = (qty, name, fallback, key) => {
    if (!qty || qty <= 0) return;
    const catalog = findCatalogService('Kamery CCTV', name);
    out.push(buildVoiceItem({ category: 'Kamery CCTV', name, unit: 'szt', quantity: qty, priceNet: number(catalog?.price_net, fallback), key }));
  };
  add(breakdown.tubeQty, 'Montaż kamery tubowej', 250, 'camera_tube_mount');
  add(breakdown.ptzQty, 'Montaż kamery obrotowej PTZ', 420, 'camera_ptz_mount');
  if (!out.length && breakdown.total > 0 && /obrotow\w*|ptz/i.test(String(text || ''))) add(breakdown.total, 'Montaż kamery obrotowej PTZ', 420, 'camera_ptz_mount');
  return out;
};


parseBoxMaterialLoose = function(text, kind) {
  const source = String(text || '');
  const isElectrical = kind === 'electrical';
  const breakdown = installerParseCameraBreakdownV25(source);

  if (isElectrical) {
    const pricedOne = source.match(/(?:na\s+)?(?:1|jedn\w+)\s+(?:wspoln\w+\s+)?puszc\w*\s+prad\w*[^,.;!?]{0,60}?(?:za|po|taki\s+za)\s*(\d+(?:[.]\d+)?)\s*zł/i)
      || source.match(/puszc\w*\s+prad\w*[^,.;!?]{0,60}?(?:za|po|taki\s+za)\s*(\d+(?:[.]\d+)?)\s*zł/i);
    if (pricedOne) return buildVoiceItem({ category: 'Kamery CCTV', name: 'Puszka prądowa', unit: 'szt', quantity: 1, priceNet: number(pricedOne[1], 0), key: 'electrical_box' });
  } else {
    const tubeBoxes = source.match(/kamer\w*\s+tubow\w*[^,.;!?]{0,90}?puszk\w*[^,.;!?]{0,50}?(?:za|po)\s*(\d+(?:[.]\d+)?)\s*zł/i)
      || source.match(/puszk\w*\s+oryginaln\w*[^,.;!?]{0,50}?(?:za|po)\s*(\d+(?:[.]\d+)?)\s*zł/i);
    if (tubeBoxes) {
      const qty = breakdown.tubeQty || 1;
      return buildVoiceItem({ category: 'Kamery CCTV', name: 'Puszka montażowa pod kamerę', unit: 'szt', quantity: qty, priceNet: number(tubeBoxes[1], 0), key: 'mounting_box_material' });
    }
  }

  const priced = parseBoxMaterial(source, isElectrical ? 'prad' : 'montaz', isElectrical ? 'Puszka prądowa' : 'Puszka montażowa pod kamerę', isElectrical ? 'electrical_box' : 'mounting_box_material');
  if (priced) return priced;

  const name = isElectrical ? 'Puszka prądowa' : 'Montaż puszki / uchwytu kamery';
  const key = isElectrical ? 'electrical_box' : 'box_holder';
  const catalog = findCatalogService('Kamery CCTV', name) || findCatalogService('Kamery CCTV', isElectrical ? 'Puszka prądowa' : 'Puszka montażowa pod kamerę');
  const price = number(catalog?.price_net, isElectrical ? 20 : 45);
  const patterns = isElectrical
    ? [/(\d+(?:[.]\d+)?)\s+puszk\w*\s+prad\w*/i, /(jedna|dwie|dwa|trzy|cztery)\s+puszk\w*\s+prad\w*/i]
    : [/(\d+(?:[.]\d+)?)\s+puszk\w*(?:\s+(?:oryginaln\w*|montaz\w*|pod\s+kamer\w*))?/i, /(dwie|dwa|trzy|cztery|jedna)\s+puszk\w*(?:\s+(?:oryginaln\w*|montaz\w*|pod\s+kamer\w*))?/i];
  for (const re of patterns) {
    const m = source.match(re);
    if (!m) continue;
    const qty = number(baseNormalizeSpeechText(m[1]), number(m[1], 1));
    if (qty > 0) return buildVoiceItem({ category: 'Kamery CCTV', name, unit: 'szt', quantity: qty, priceNet: price, key });
  }
  return null;
};


const extractSpecialVoiceItems_v26_before = extractSpecialVoiceItems;
extractSpecialVoiceItems = function(text) {
  const base = extractSpecialVoiceItems_v26_before(text);
  installerAddCameraHardwareItemsV25(text, base.items);
  const drilling = parseDrillingVoiceItemV25(text);
  if (drilling && !base.items.some(i => i._voiceKey === drilling._voiceKey || i.name === drilling.name)) base.items.push(drilling);
  if (drilling) base.usedFragments.push('przewiert');
  return base;
};

const detectMissingData_v26_before = detectMissingData;
detectMissingData = function(rawText, result) {
  const missing = detectMissingData_v26_before(rawText, result) || [];
  const items = result?.items || [];
  if (items.some(item => /kamera .*materiał|kamera .*material/i.test(item.name || '') && number(item.priceNet, 0) <= 0)) {
    const msg = 'uzupełnić cenę zakupu kamer — program dodał sprzęt jako pozycję materiałową z ceną 0 zł';
    if (!missing.includes(msg)) missing.push(msg);
  }
  return missing;
};

const parseSmartCommand_v26_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v26_before(rawText);
  const normalized = normalizeSpeechText(buildFocusedTranscriptText(rawText));
  const itemText = stripClientFragmentsForItems(normalized);
  const extra = extractSpecialVoiceItems(itemText);
  const additions = [];
  for (const item of extra.items || []) {
    if (/kamera .*materiał|kamera .*material|Puszka prądowa|Puszka montażowa pod kamerę|Przewiert przez ścianę/i.test(item.name || '')) additions.push(item);
  }
  if (additions.length) result.items = mergeParserItems([...(result.items || []), ...additions]);
  result.missingData = detectMissingData(rawText, { client: result.client, items: result.items, detectedType: result.detectedType, distanceKm: result.distanceKm, distanceRate: result.distanceRate, freeKm: result.freeKm, transcriptInfo: result.transcriptInfo });
  for (const f of result.transcriptInfo?.followUps || []) if (!result.missingData.includes(f)) result.missingData.push(f);
  return result;
};

/* v2.5.1 — bez podwajania pozycji dodanych przez parser specjalny + rozpoznanie przewodu 2×0,5 */
const looksLikeCableClause_v261_before = looksLikeCableClause;
looksLikeCableClause = function(text) {
  return looksLikeCableClause_v261_before(text) || /\b2\s*(?:x|×)\s*0[.]?5\b|\b2x0[.]?5\b/i.test(String(text || ''));
};

parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v26_before(rawText);
  result.missingData = detectMissingData(rawText, { client: result.client, items: result.items, detectedType: result.detectedType, distanceKm: result.distanceKm, distanceRate: result.distanceRate, freeKm: result.freeKm, transcriptInfo: result.transcriptInfo });
  for (const f of result.transcriptInfo?.followUps || []) if (!result.missingData.includes(f)) result.missingData.push(f);
  return result;
};

/* v2.5.2 — „odwiert przez ścianę” traktowany jak przewiert */
parseDrillingVoiceItemV25 = function(text) {
  const source = String(text || '');
  if (!/odwiert|przewiert|przewierc|wiercen|otwor|otwór|przekuc|przebic|przebić/i.test(source)) return null;
  const qty = parseSurchargeQuantity(source, /odwiert\w*|przewiert\w*|przewierc\w*|wiercen\w*|otwor\w*|otwór\w*|przekuc\w*/i) || 1;
  const catalog = findCatalogService('Przewody / Okablowanie', 'Przewiert przez ścianę pod przewód') || findCatalogService('Kamery CCTV', 'Wiercenie przejścia pod przewód');
  return buildVoiceItem({ category: 'Przewody / Okablowanie', name: 'Przewiert przez ścianę pod przewód', unit: 'szt', quantity: qty, priceNet: number(catalog?.price_net, 35), key: 'drilling_wall' });
};

/* v2.5.3 — ilość przewiertów nie może brać liczby z dalszej frazy „2 kamera” */
parseDrillingVoiceItemV25 = function(text) {
  const source = String(text || '');
  if (!/odwiert|przewiert|przewierc|wiercen|otwor|otwór|przekuc|przebic|przebić/i.test(source)) return null;
  let qty = 1;
  const before = source.match(/(\d+(?:[.]\d+)?)\s*(?:szt\.?\s*)?(?:odwiert\w*|przewiert\w*|przewierc\w*|wiercen\w*|otwor\w*|otwór\w*|przekuc\w*)/i);
  const after = source.match(/(?:odwiert\w*|przewiert\w*|przewierc\w*|wiercen\w*|otwor\w*|otwór\w*|przekuc\w*)\D{0,12}(\d+(?:[.]\d+)?)\s*szt\b/i);
  if (before) qty = number(before[1], 1);
  else if (after) qty = number(after[1], 1);
  const catalog = findCatalogService('Przewody / Okablowanie', 'Przewiert przez ścianę pod przewód') || findCatalogService('Kamery CCTV', 'Wiercenie przejścia pod przewód');
  return buildVoiceItem({ category: 'Przewody / Okablowanie', name: 'Przewiert przez ścianę pod przewód', unit: 'szt', quantity: qty, priceNet: number(catalog?.price_net, 35), key: 'drilling_wall' });
};

/* v2.6 — baza cen materiałów + aktualizacja cen */
const MATERIAL_PRICES_KEY = 'pomocnik-instalatora-pwa-v1-material-prices';
const MATERIAL_PRICES_LAST_CHECK_KEY = 'pomocnik-instalatora-pwa-v1-material-prices-last-check';

















if (typeof installerAddCameraHardwareItemsV25 === 'function') {
  installerAddCameraHardwareItemsV25 = function(text, items) {
    const breakdown = installerParseCameraBreakdownV25(text);
    const add = (qty, name, key) => {
      if (!qty || qty <= 0) return;
      if (items.some(i => i._voiceKey === key || normalizeMaterialName(i.name) === normalizeMaterialName(name))) return;
      const catalog = findCatalogService('Kamery CCTV', name);
      const price = getSuggestedMaterialPrice(name, 'Kamery CCTV');
      items.push(buildVoiceItem({ category: 'Kamery CCTV', name, unit: 'szt', quantity: qty, priceNet: number(price ?? catalog?.price_net, 0), key }));
    };
    add(breakdown.tubeQty, 'Kamera tubowa IP — materiał', 'camera_tube_hardware');
    add(breakdown.ptzQty, 'Kamera obrotowa PTZ — materiał', 'camera_ptz_hardware');
  };
}

const detectMissingData_v260_before = detectMissingData;
detectMissingData = function(rawText, result) {
  let missing = detectMissingData_v260_before(rawText, result) || [];
  const items = result?.items || [];
  const cameraMaterialItems = items.filter(item => /kamera .*materiał|kamera .*material/i.test(item.name || ''));
  if (cameraMaterialItems.length && cameraMaterialItems.every(item => number(item.priceNet, 0) > 0)) {
    missing = missing.filter(text => !/uzupełnić cenę zakupu kamer|uzupelnic cene zakupu kamer/i.test(text));
    const msg = 'cena kamer została zasugerowana z bazy materiałów — sprawdzić model i cenę przed zatwierdzeniem';
    if (!missing.includes(msg)) missing.push(msg);
  }
  return missing;
};

/* v2.6.1 — przywrócenie specjalnych pozycji materiałowych po poprawce 2.5.1 */
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v26_before(rawText);
  const normalized = normalizeSpeechText(buildFocusedTranscriptText(rawText));
  const itemText = stripClientFragmentsForItems(normalized);
  const extra = extractSpecialVoiceItems(itemText);
  const additions = [];
  for (const item of extra.items || []) {
    if (!/kamera .*materiał|kamera .*material|Puszka prądowa|Puszka montażowa pod kamerę|Przewiert przez ścianę/i.test(item.name || '')) continue;
    const alreadyExists = (result.items || []).some(existing =>
      normalizeMaterialName(existing.name) === normalizeMaterialName(item.name)
      || (existing.parserKey && item._voiceKey && existing.parserKey === item._voiceKey)
    );
    if (!alreadyExists) additions.push(item);
  }
  if (additions.length) result.items = mergeParserItems([...(result.items || []), ...additions]);
  result.missingData = detectMissingData(rawText, { client: result.client, items: result.items, detectedType: result.detectedType, distanceKm: result.distanceKm, distanceRate: result.distanceRate, freeKm: result.freeKm, transcriptInfo: result.transcriptInfo });
  for (const f of result.transcriptInfo?.followUps || []) if (!result.missingData.includes(f)) result.missingData.push(f);
  return result;
};


/* v2.9 - poprawka rozpoznawania przewodów z dyktowania */








const parseSmartCommand_v29_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v29_before(rawText);
  installerPatchAddressV29(result);
  installerPatchCableItemsV29(rawText, result);
  installerPatchRouterMaterialV29(rawText, result);
  result.items = mergeParserItems(result.items || []);
  result.missingData = detectMissingData(rawText, {
    client: result.client,
    items: result.items,
    detectedType: result.detectedType,
    distanceKm: result.distanceKm,
    distanceRate: result.distanceRate,
    freeKm: result.freeKm,
    transcriptInfo: result.transcriptInfo
  });
  if (/2\s*(?:x|×|razy)\s*2[,.]?5/i.test(normalizeSpeechText(rawText))) {
    const msg = 'przewód elektryczny 2×2,5 został dodany jako typ do sprawdzenia — przy gniazdku zweryfikuj faktyczny przewód przed wyceną';
    if (!result.missingData.includes(msg)) result.missingData.push(msg);
  }
  for (const f of result.transcriptInfo?.followUps || []) if (!result.missingData.includes(f)) result.missingData.push(f);
  return result;
};


/* v2.9.1 - doprecyzowanie: nie mylić przewodu internetowego z przewodem elektrycznym */
installerDetectInternetCableLengthV29 = function(text) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  const hasInternetDescriptor = /\b(przew[oó]d\w*|kabel\w*|skr[eę]tk\w*)\s+(?:internetow\w*|sieciow\w*|lan|utp|cat\s*5e?|kat\s*5e?|kategori\w*\s*5e?|cat\s*6|kat\s*6|kategori\w*\s*6)\b/i.test(source)
    || /\b(skr[eę]tk\w*|utp|lan|cat\s*5e?|kat\s*5e?|kategori\w*\s*5e?|cat\s*6|kat\s*6|kategori\w*\s*6)\b/i.test(source);
  if (!hasInternetDescriptor) return 0;
  const patterns = [
    /(?:przew[oó]d\w*|kabel\w*|skr[eę]tk\w*)\s+(?:internetow\w*|sieciow\w*|lan|utp|cat\s*5e?|kat\s*5e?|kategori\w*\s*5e?|cat\s*6|kat\s*6|kategori\w*\s*6)(?:[^.?!;]{0,240}?)(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b/i,
    /(?:skr[eę]tk\w*|utp|lan|cat\s*5e?|kat\s*5e?|kategori\w*\s*5e?|cat\s*6|kat\s*6|kategori\w*\s*6)(?:[^.?!;]{0,240}?)(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b/i,
    /(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b(?:[^.?!;]{0,120}?)(?:przew[oó]d\w*|kabel\w*|skr[eę]tk\w*)(?:[^.?!;]{0,80}?)(?:internetow\w*|sieciow\w*|lan|utp|cat\s*5e?|kat\s*5e?|kategori\w*\s*5e?|cat\s*6|kat\s*6|kategori\w*\s*6)/i
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    const length = installerCableNumberV29(match?.[1], 0);
    if (length > 0) return length;
  }
  return 0;
};

installerDetectElectricCableRunsV29 = function(text) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  const runs = [];
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b\s+(?:przew[oó]d\w*|kabel\w*)\s+(?:elektryczn\w*|pr[aą]dow\w*|zasilaj\w*|ydyp|ydy)(?:[^.?!;]{0,80}?)(\d\s*(?:x|×|razy)\s*\d(?:[.,]\d)?|\d\s*(?:x|×|razy)\s*\d\s+\d)?/gi,
    /(?:przew[oó]d\w*|kabel\w*)\s+(?:elektryczn\w*|pr[aą]dow\w*|zasilaj\w*|ydyp|ydy)(?:[^.?!;]{0,120}?)(\d+(?:[.,]\d+)?)\s*(?:m|mb|metr\w*)\b(?:[^.?!;]{0,80}?)(\d\s*(?:x|×|razy)\s*\d(?:[.,]\d)?|\d\s*(?:x|×|razy)\s*\d\s+\d)?/gi
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const length = installerCableNumberV29(match[1], 0);
      if (length <= 0) continue;
      const typeRaw = String(match[2] || source.slice(match.index || 0, (match.index || 0) + 140) || '').replace(/\s+/g, '').replace(',', '.').toLowerCase();
      let name = 'Przewód prądowy YDYp 3×1,5';
      let fallback = 3.5;
      let key = 'cable_power_ydyp_3x15';
      if (/3(?:x|×|razy)2\.5/.test(typeRaw) || /3(?:x|×|razy)25/.test(typeRaw)) {
        name = 'Przewód prądowy YDYp 3×2,5';
        fallback = 5.5;
        key = 'cable_power_ydyp_3x25';
      } else if (/2(?:x|×|razy)2\.5/.test(typeRaw) || /2(?:x|×|razy)25/.test(typeRaw)) {
        name = 'Przewód prądowy 2×2,5 — sprawdź typ';
        fallback = 4.5;
        key = 'cable_power_2x25_check';
      } else if (/2(?:x|×|razy)0\.5/.test(typeRaw) || /2(?:x|×|razy)05/.test(typeRaw)) {
        name = 'Przewód niskoprądowy 2×0,5';
        fallback = 1.5;
        key = 'cable_low_voltage_2x05';
      }
      runs.push({ length, name, fallback, key });
    }
  }
  const seen = new Set();
  return runs.filter(run => {
    const k = `${run.name}|${run.length}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};


/* v2.9.2 - poprawka fallbacków cen dla pozycji spoza cennika */
installerFindCatalogPriceV29 = function(category, name, fallback) {
  const catalog = findCatalogService(category, name);
  if (catalog && catalog.price_net !== undefined && catalog.price_net !== null && String(catalog.price_net).trim() !== '') {
    return number(catalog.price_net, fallback);
  }
  return fallback;
};

document.addEventListener('DOMContentLoaded', () => {
  if ($('materialPriceSearch')) $('materialPriceSearch').addEventListener('input', renderMaterialPrices);
  if ($('applyMaterialPricesBtn')) $('applyMaterialPricesBtn').addEventListener('click', applyMaterialPricesToCatalogManually);
  if ($('refreshMaterialPricesBtn')) $('refreshMaterialPricesBtn').addEventListener('click', refreshMaterialPricesFromFile);
  if ($('exportMaterialPricesBtn')) $('exportMaterialPricesBtn').addEventListener('click', exportMaterialPrices);
  if ($('importMaterialPricesBtn')) $('importMaterialPricesBtn').addEventListener('click', () => $('importMaterialPricesFile').click());
  if ($('importMaterialPricesFile')) $('importMaterialPricesFile').addEventListener('change', importMaterialPricesFromFile);
  autoApplyMaterialPricesOnStart();
  renderMaterialPrices();
});

/* v3.1 - poprawki rozbijania kamer CCTV: adres, Wi-Fi, RJ45, beczki LAN, NVR i przewody bez zgadywania metrów */







const parseClientAddress_v31_before = parseClientAddress;
parseClientAddress = function(rawText, normalizedText) {
  const address = parseClientAddress_v31_before(rawText, normalizedText);
  return installerV31IsBogusAddress(address, rawText) ? '' : address;
};









const parseSmartCommand_v31_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v31_before(rawText);
  if (result?.client?.address && installerV31IsBogusAddress(result.client.address, rawText)) result.client.address = '';
  installerV31RemoveBadCableGuesses(rawText, result);
  const counts = installerV31PatchCameraMounts(rawText, result);
  installerV31PatchRj45(rawText, result, counts);
  installerV31PatchNvr(rawText, result, counts);
  installerV31PatchSurcharges(rawText, result);
  result.items = mergeParserItems(result.items || []);
  result.missingData = detectMissingData(rawText, {
    client: result.client,
    items: result.items,
    detectedType: result.detectedType,
    distanceKm: result.distanceKm,
    distanceRate: result.distanceRate,
    freeKm: result.freeKm,
    transcriptInfo: result.transcriptInfo
  });
  installerV31PatchMissing(rawText, result, counts);
  return result;
};
/* =========================================================
   v3.3 - stos parserów: tabela/CSV/Markdown/lista/sekcje/JSON
   Cel: lepsze wczytywanie gotowych wycen i ofert z Excela, Allegro,
   TXT, tabel Markdown oraz tekstów sekcyjnych Materiały/Robocizna.
   ========================================================= */

const INSTALLER_V33_STRUCTURED_PARSERS = [
  'JSON wyceny z pozycjami',
  'Tabela z Excela / arkusza TSV',
  'Tabela Markdown z pionowymi kreskami',
  'CSV / średniki',
  'Lista pozycji z cenami',
  'Tekst sekcyjny: Materiały / Robocizna'
];

























const classifyQuoteItem_v33_before = classifyQuoteItem;
classifyQuoteItem = function(item) {
  if (item?.itemKind === 'material') return { key: 'material', label: 'materiał' };
  if (item?.itemKind === 'labor') return { key: 'labor', label: 'robocizna' };
  return classifyQuoteItem_v33_before(item);
};


const renderParserPreview_v33_before = renderParserPreview;
renderParserPreview = function(raw, result) {
  renderParserPreview_v33_before(raw, result);
  if (!result?.parserReport) return;
  const content = $('parserPreviewContent');
  if (content) content.insertAdjacentHTML('afterbegin', installerV33ParserReportHtml(result.parserReport));
};

const parseSmartCommand_v33_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const structured = installerV33RunStructuredParsers(rawText);
  if (structured?.items?.length) return structured;
  return parseSmartCommand_v33_before(rawText);
};



/* =========================================================
   v3.4 - poprawka parsera dyktowania CCTV:
   - rozbija „4 kamery, 3 obrotowe i jedną tubową” na osobne pozycje,
   - nie gubi liczby zapisanej słownie: jedna/dwie/trzy/cztery itd.,
   - „4 puszki pod kamery” traktuje jako materiał, nie jako montaż uchwytu,
   - przelicza podsumowanie po poprawkach.
   ========================================================= */









const parseSmartCommand_v34_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v34_before(rawText);
  if (result?.parserReport) return result;
  installerV34PatchCameraItems(rawText, result);
  installerV34PatchCameraBoxes(rawText, result);
  result.items = mergeParserItems(result.items || []);
  installerV34PatchMissing(rawText, result);
  return result;
};


/* =========================================================
   v3.5 - udoskonalenie parsera CCTV bez punktu 1 i 7:
   - kontrola sumy ilości kamer,
   - negacje: klient ma swoje / bez montażu / nie kupować / nie doliczać,
   - domyślne podpowiedzi CCTV bez automatycznego doliczania,
   - lepsze rozróżnienie materiałów i robocizny,
   - prostszy SMS dla klienta,
   - rozbudowany słownik odmian z przykładami.
   ========================================================= */

const INSTALLER_V35_PARSER_DICTIONARY = {
  cameraTypes: [
    {
      key: 'ptz',
      name: 'Montaż kamery obrotowej PTZ',
      materialName: 'Kamera obrotowa PTZ — materiał',
      fallbackPrice: 420,
      words: ['ptz', 'obrotowa', 'obrotowe', 'obrotowych', 'ruchoma', 'ruchome', 'kręcona', 'krecona', 'obracana'],
      examples: [
        '3 kamery obrotowe',
        'trzy obrotowe',
        '3 PTZ',
        'kamera kręcona',
        'kamera obracana'
      ]
    },
    {
      key: 'tube',
      name: 'Montaż kamery tubowej',
      materialName: 'Kamera tubowa IP — materiał',
      fallbackPrice: 250,
      words: ['tubowa', 'tubowe', 'tubowych', 'tuba', 'tuby', 'bullet', 'statyczna', 'statyczne'],
      examples: [
        'jedna tubowa',
        '1 kamera tuba',
        '2 kamery bullet',
        'dwie statyczne'
      ]
    },
    {
      key: 'dome',
      name: 'Montaż kamery kopułkowej',
      materialName: 'Kamera kopułkowa IP — materiał',
      fallbackPrice: 240,
      words: ['kopułkowa', 'kopulkowa', 'kopułkowe', 'kopulkowe', 'kopułkowych', 'kopulkowych', 'dome', 'sufitowa', 'sufitowe'],
      examples: [
        '2 kopułkowe',
        'dwie kamery dome',
        'kamera sufitowa'
      ]
    },
    {
      key: 'wifi',
      name: 'Montaż kamery Wi‑Fi',
      materialName: 'Kamera Wi‑Fi — materiał',
      fallbackPrice: 230,
      words: ['wifi', 'wi-fi', 'wi fi', 'bezprzewodowa', 'bezprzewodowe', 'bezprzewodowych'],
      examples: [
        'jedna kamera WiFi',
        '1 bezprzewodowa',
        'kamera na drugim budynku po Wi-Fi'
      ]
    },
    {
      key: 'generic',
      name: 'Montaż kamery IP zewnętrznej',
      materialName: 'Kamera IP zewnętrzna — materiał',
      fallbackPrice: 260,
      words: ['zwykła', 'zwykla', 'zwykłe', 'zwykle', 'normalna', 'normalne', 'zewnętrzna', 'zewnetrzna', 'zewnętrzne', 'zewnetrzne', 'ip'],
      examples: [
        'jedna zwykła',
        'reszta zwykłe',
        '4 kamery IP zewnętrzne'
      ]
    }
  ],
  materials: [
    {
      key: 'mounting_box',
      name: 'Puszka montażowa pod kamerę',
      words: ['puszka', 'puszki', 'baza', 'adapter', 'uchwyt', 'podstawa montażowa', 'podstawa montazowa'],
      examples: ['4 puszki pod kamery', 'puszki montażowe', 'bazy pod kamery']
    },
    {
      key: 'rj45',
      name: 'Wtyki / zakończenia RJ45',
      words: ['rj45', 'rj-45', 'wtyki', 'końcówki', 'koncowki', 'zarobić końcówki', 'zarobic koncowki'],
      examples: ['zarobić RJ45', 'końcówki na skrętce', 'zakończenia przewodów']
    },
    {
      key: 'recorder',
      name: 'Rejestrator NVR',
      words: ['rejestrator', 'nvr', 'dvr', 'nagrywarka'],
      examples: ['trzeba kupić rejestrator', 'NVR 8 kanałów', 'stary rejestrator do wymiany']
    },
    {
      key: 'disk',
      name: 'Dysk do rejestratora',
      words: ['dysk', 'hdd', 'skyhawk', 'zapis nagrań', 'zapis nagran'],
      examples: ['dysk 4 TB', 'dysk do rejestratora', 'zapis nagrań']
    },
    {
      key: 'cable',
      name: 'Przewody / skrętka / korytko',
      words: ['przewód', 'przewod', 'kabel', 'skrętka', 'skretka', 'lan', 'utp', 'peszel', 'korytko', 'listwa'],
      examples: ['przewody są położone', 'trzeba puścić skrętkę', 'kabel w korytku']
    }
  ],
  labor: [
    {
      key: 'drill',
      name: 'Przewiert przez ścianę pod przewód',
      words: ['przewiert', 'przekuć', 'przekuc', 'przebić', 'przebic', 'przekucie', 'przebicie', 'otwór', 'otwor'],
      examples: ['przekuć się przez ścianę', 'jeden przewiert', 'otwór pod przewód']
    },
    {
      key: 'preview',
      name: 'Uruchomienie podglądu zdalnego',
      words: ['podgląd', 'podglad', 'aplikacja', 'telefon', 'ezviz', 'hik-connect'],
      examples: ['podgląd w telefonie', 'aplikacja do kamer', 'uruchomić Hik-Connect']
    },
    {
      key: 'config',
      name: 'Konfiguracja rejestratora NVR',
      words: ['konfiguracja', 'ustawienie', 'nagrywanie', 'harmonogram', 'data godzina'],
      examples: ['skonfigurować rejestrator', 'ustawić nagrywanie', 'ustawić datę i godzinę']
    }
  ],
  negations: {
    cameraMaterial: [
      'kamery klient ma swoje',
      'kamery są klienta',
      'kamer nie kupować',
      'bez kamer w materiałach',
      'nie doliczać kamer'
    ],
    cameraMount: [
      'bez montażu',
      'montażu nie liczyć',
      'tylko konfiguracja',
      'same ustawienia bez montażu'
    ],
    recorder: [
      'rejestratora nie trzeba kupować',
      'bez rejestratora',
      'rejestrator klient ma',
      'rejestrator jest już na miejscu'
    ],
    cables: [
      'przewody są już położone',
      'kable są już przeciągnięte',
      'bez prowadzenia kabli',
      'kabli nie doliczać'
    ],
    boxes: [
      'bez puszek',
      'puszek nie doliczać',
      'puszki klient ma swoje',
      'puszek nie trzeba'
    ]
  },
  cctvChecklistSuggestions: [
    'rejestrator / NVR / DVR',
    'dysk do nagrań',
    'podgląd w telefonie / aplikacji',
    'RJ45, zakończenia przewodów i test par',
    'puszki / uchwyty pod kamery',
    'zasilanie / PoE / switch',
    'dojazd i termin realizacji'
  ]
};

try { window.INSTALLER_V35_PARSER_DICTIONARY = INSTALLER_V35_PARSER_DICTIONARY; } catch {}










const classifyQuoteItem_v35_before = classifyQuoteItem;
classifyQuoteItem = function(item) {
  if (item?.itemKind === 'material') return { key: 'material', label: 'materiał' };
  if (item?.itemKind === 'labor') return { key: 'labor', label: 'robocizna' };
  if (installerV35LooksMaterial(item)) return { key: 'material', label: 'materiał' };
  return classifyQuoteItem_v35_before(item);
};











const parseSmartCommand_v35_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v35_before(rawText);
  if (!result) return result;
  installerV35PatchCameraItems(rawText, result);
  installerV35PatchCameraBoxes(rawText, result);
  installerV35MarkKinds(result);
  installerV35ApplyNegations(rawText, result);
  result.items = mergeParserItems(result.items || []);
  installerV35MarkKinds(result);
  installerV35RefreshMissing(rawText, result);
  return result;
};




const buildClientSms_v35_before = buildClientSms;
buildClientSms = function(quote = state) {
  const totals = calculateTotals(quote);
  const jobType = quote.jobType || 'usługa instalacyjna';
  const isCctv = /kamery|cctv|monitoring/i.test(jobType) || (quote.services || []).some(item => /kamera|rejestrator|cctv|monitoring/i.test(item.name || ''));
  if (!isCctv) return buildClientSms_v35_before(quote);

  const scopeItems = (quote.services || []).map(installerV35ServicePhrase);
  const scope = installerV35JoinNatural(scopeItems.slice(0, 8));
  const address = quote.clientAddress ? ` Adres: ${quote.clientAddress}.` : '';
  const distance = totals.distanceNet > 0 ? ` Dojazd: ${money(totals.distanceNet)} netto.` : '';
  const date = quote.visitDate ? ` Termin: ${formatDate(quote.visitDate)}.` : '';
  return normalizeSpaces(`Dzień dobry, wycena montażu monitoringu: ${scope}. Razem: ${money(totals.gross)} brutto (${money(totals.net)} netto).${address}${distance}${date}`);
};

/* v3.5.1 - drobne dopięcie: „puszek” + jawna konfiguracja rejestratora + kolejność SMS */


const parseSmartCommand_v351_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v351_before(rawText);
  if (!result) return result;
  installerV351PatchCameraBoxesFixed(rawText, result);
  installerV351PatchExplicitCctvLabor(rawText, result);
  installerV35MarkKinds(result);
  installerV35ApplyNegations(rawText, result);
  result.items = mergeParserItems(result.items || []);
  installerV35MarkKinds(result);
  installerV35RefreshMissing(rawText, result);
  return result;
};


const buildClientSms_v351_before = buildClientSms;
buildClientSms = function(quote = state) {
  const totals = calculateTotals(quote);
  const jobType = quote.jobType || 'usługa instalacyjna';
  const isCctv = /kamery|cctv|monitoring/i.test(jobType) || (quote.services || []).some(item => /kamera|rejestrator|cctv|monitoring|puszka montażowa|puszka montazowa/i.test(item.name || ''));
  if (!isCctv) return buildClientSms_v351_before(quote);
  const sorted = [...(quote.services || [])].sort((a, b) => installerV351SmsPriority(a) - installerV351SmsPriority(b));
  const scope = installerV35JoinNatural(sorted.map(installerV35ServicePhrase).slice(0, 8));
  const address = quote.clientAddress ? ` Adres: ${quote.clientAddress}.` : '';
  const distance = totals.distanceNet > 0 ? ` Dojazd: ${money(totals.distanceNet)} netto.` : '';
  const date = quote.visitDate ? ` Termin: ${formatDate(quote.visitDate)}.` : '';
  return normalizeSpaces(`Dzień dobry, wycena montażu monitoringu: ${scope}. Razem: ${money(totals.gross)} brutto (${money(totals.net)} netto).${address}${distance}${date}`);
};

/* v3.5.2 - odmiana liczebników w SMS */

installerV35PolishCameraLabel = function(name, qty) {
  const n = installerV35Norm(name);
  const q = number(qty, 1);
  if (/obrotow|ptz/.test(n)) return `${q} ${installerV352Plural(q, 'kamera obrotowa PTZ', 'kamery obrotowe PTZ', 'kamer obrotowych PTZ')}`;
  if (/tubow|tuba/.test(n)) return `${q} ${installerV352Plural(q, 'kamera tubowa', 'kamery tubowe', 'kamer tubowych')}`;
  if (/kopulk|dome|sufit/.test(n)) return `${q} ${installerV352Plural(q, 'kamera kopułkowa', 'kamery kopułkowe', 'kamer kopułkowych')}`;
  if (/wi-?fi|wifi|bezprzewod/.test(n)) return `${q} ${installerV352Plural(q, 'kamera Wi‑Fi', 'kamery Wi‑Fi', 'kamer Wi‑Fi')}`;
  return `${q} ${installerV352Plural(q, 'kamera IP', 'kamery IP', 'kamer IP')}`;
};

installerV35ServicePhrase = function(item) {
  const name = String(item.name || '');
  const n = installerV35Norm(name);
  const q = number(item.quantity, 1);
  if (/montaz kamery/.test(n)) return installerV35PolishCameraLabel(name, q);
  if (/puszka montazowa pod kamere|montaz puszki\s*\/\s*uchwytu/.test(n)) return `${q} ${installerV352Plural(q, 'puszka montażowa pod kamerę', 'puszki montażowe pod kamery', 'puszek montażowych pod kamery')}`;
  if (/przewiert|wiercenie|przekucie/.test(n)) return `${q} ${installerV352Plural(q, 'przewiert pod przewód', 'przewierty pod przewód', 'przewiertów pod przewód')}`;
  if (/konfiguracja rejestratora|rejestrator nvr|rejestrator dvr/.test(n) && !installerV35LooksMaterial(item)) return 'konfiguracja rejestratora';
  if (/podglad|podglad zdalny|aplikacj/.test(n)) return 'uruchomienie podglądu w telefonie';
  if (/zarabianie.*rj45|rj45/.test(n) && !installerV35LooksMaterial(item)) return q === 1 ? 'zarobienie 1 końcówki RJ45' : `zarobienie ${q} końcówek RJ45`;
  return `${q}× ${name}`;
};


/* v3.6 - poprawka parsera: kamery Wi-Fi, montaż tubowych, fałszywy adres „do tego 4”, opcjonalny wzmacniacz Wi-Fi */









const parseSmartCommand_v36_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v36_before(rawText);
  if (!result) return result;
  installerV36FixFalseAddress(rawText, result);
  installerV36AddLaborFromCameraMaterials(rawText, result);
  installerV36RenameWifiCameraMaterials(rawText, result);
  installerV36HandleOptionalWifiExtender(rawText, result);
  installerV35MarkKinds(result);
  installerV35ApplyNegations(rawText, result);
  result.items = mergeParserItems(result.items || []);
  installerV35MarkKinds(result);
  installerV361PatchRj45MaterialAndLabor(rawText, result);
  installerV36FixCameraQuantityWarnings(rawText, result);
  installerV35RefreshMissing(rawText, result);
  installerV36FixCameraQuantityWarnings(rawText, result);
  installerV36HandleOptionalWifiExtender(rawText, result);
  return result;
};

/* v3.6 - status/przyciski podglądu: jawny komunikat, gdy nie ma aktywnego rozbicia */
const acceptParserPreview_v36_before = acceptParserPreview;
acceptParserPreview = function() {
  if (!pendingParse) {
    showInfo('Nie ma aktywnego podglądu do zatwierdzenia. Najpierw kliknij „Rozbij tekst”, potem „Zatwierdź rozbicie”.');
    return;
  }
  return acceptParserPreview_v36_before();
};


/* v3.6.1 - poprawki po audycie: parser, Dropbox push, cache, PWA */




if (typeof splitAccessoryClauses === 'function') {
  splitAccessoryClauses = function(text) {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return [];
    const prepared = raw
      .replace(/(separatorem|separatorze)\s+(?=wzmacniacz\w*\s+anten)/gi, '$1, ')
      .replace(/(zasilacz\w*\s+anten\w*(?:\s+12\s*v)?(?:\s+z\s+separatorem)?)\s+(?=wzmacniacz\w*\s+anten)/gi, '$1, ')
      .replace(new RegExp('\\s+i\\s+(?=' + installerV361QtyPattern().replaceAll('\\\\', '\\\\') + '\\s+(?:szt\\.?\\s*)?' + installerV361AccessoryWords().replaceAll('\\\\', '\\\\') + ')', 'gi'), ', ');
    const parts = prepared.split(/[,;\n]+|\s+oraz\s+|\s+plus\s+/i);
    return parts.map(x => x.trim()).filter(Boolean);
  };
}

if (typeof parseAccessoryQuantity === 'function') {
  parseAccessoryQuantity = function(text) {
    const source = installerV361Norm(text);
    const qty = installerV361QtyPattern();
    const acc = installerV361AccessoryWords();
    const patterns = [
      new RegExp('\\b' + qty + '\\s*(?:szt\\.?\\s*)?' + acc + '\\b', 'i'),
      new RegExp('\\b' + qty + '\\s*(?:szt\\.?\\s*)?(?:koncowek|koncowki|koncowka|wtykow|wtyki|wtyk)\\s+(?:rj\\s*-?\\s*45|rjki|rjek)\\b', 'i'),
      new RegExp('(?:rj\\s*-?\\s*45|rjki|rjek|' + acc + ')\\D{0,40}?' + qty + '\\s*szt\\b', 'i')
    ];
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match) return installerV361Number(match[1], 1);
    }
    return 1;
  };
}

if (typeof installerPatchCableItemsV29 === 'function') {
  installerPatchCableItemsV29 = function(rawText, result) {
    if (!result || !Array.isArray(result.items)) return result;
    const focused = buildFocusedTranscriptText(rawText);
    const normalized = normalizeSpeechText(focused);
    const additions = [];
    const hasItem = (category, name, quantity) => (result.items || []).some(item =>
      String(item.category || '') === category
      && normalizeMaterialName(item.name || '') === normalizeMaterialName(name)
      && number(item.quantity, 0) === number(quantity, 0)
    );
    const addOnce = (category, name, unit, quantity, priceNet, key) => {
      if (hasItem(category, name, quantity)) return;
      additions.push(buildVoiceItem({ category, name, unit, quantity, priceNet, key }));
    };

    const internetLength = installerDetectInternetCableLengthV29(normalized);
    const hasInternetCableWords = /przew[oó]d\w*\s+(?:internetow\w*|sieciow\w*)|kabel\w*\s+(?:internetow\w*|sieciow\w*)|skr[eę]tk\w*|lan|utp|cat\s*5|kat\s*5|cat\s*6|kat\s*6|kategori\w*\s*[56]/i.test(normalized);

    if (internetLength > 0 && hasInternetCableWords) {
      const cableName = installerDetectInternetCableNameV29(normalized);
      result.items = result.items.filter(item => {
        const name = String(item.name || '');
        const category = String(item.category || '');
        const qty = number(item.quantity, 0);
        if (/Prowadzenie skr[eę]tki zewn[eę]trznej/i.test(name) && /Kamery CCTV/i.test(category) && qty === internetLength) return false;
        return true;
      });
      addOnce('Przewody / Okablowanie', cableName, 'mb', internetLength, installerFindCatalogPriceV29('Przewody / Okablowanie', cableName, cableName.includes('Cat 6') ? 2 : 2), cableName.includes('Cat 6') ? 'cable_cat6_cu_v29' : 'cable_cat5e_cu_v29');
      addOnce('Przewody / Okablowanie', 'Prowadzenie przewodu — standardowe', 'mb', internetLength, installerFindCatalogPriceV29('Przewody / Okablowanie', 'Prowadzenie przewodu — standardowe', 8), 'cable_labor_standard_internet_v29');
    }

    const electricRuns = installerDetectElectricCableRunsV29(normalized);
    if (electricRuns.length) {
      const has2x25 = electricRuns.some(run => /2×2,5/.test(run.name));
      if (has2x25 && !/2\s*(?:x|×|razy)\s*0[,.]?5/i.test(normalized)) {
        result.items = result.items.filter(item => !/2×0,5|2x0,5/i.test(String(item.name || '')));
      }
      for (const run of electricRuns) {
        addOnce('Przewody / Okablowanie', run.name, 'mb', run.length, installerFindCatalogPriceV29('Przewody / Okablowanie', run.name, run.fallback), run.key);
        addOnce('Przewody / Okablowanie', 'Prowadzenie przewodu — standardowe', 'mb', run.length, installerFindCatalogPriceV29('Przewody / Okablowanie', 'Prowadzenie przewodu — standardowe', 8), `${run.key}_labor`);
      }
    }

    if (additions.length) result.items = mergeParserItems([...(result.items || []), ...additions]);
    return result;
  };
}




if (typeof installerV36RenameWifiCameraMaterials === 'function') {
  installerV36RenameWifiCameraMaterials = function(rawText, result) {
    if (!result || !Array.isArray(result.items) || result.parserReport) return;
    if (!installerV361AllCamerasWifi(rawText)) return;
    for (const item of result.items) {
      const n = installerV361Norm(item.name || '');
      if (!/material|materia[lł]/.test(n)) continue;
      if (/kamera tubow/.test(n)) item.name = 'Kamera tubowa Wi‑Fi — materiał';
      else if (/kamera obrotow|ptz/.test(n)) item.name = 'Kamera obrotowa PTZ Wi‑Fi — materiał';
      else if (/kamera kopulk|kamera dome/.test(n)) item.name = 'Kamera kopułkowa Wi‑Fi — materiał';
      else if (/kamera/.test(n)) item.name = 'Kamera Wi‑Fi — materiał';
    }
  };
}





const syncDropbox_v361_before = syncDropbox;
syncDropbox = async function(mode = 'merge', silent = false) {
  if (mode === 'push' && !silent) {
    const ok = confirm('Uwaga: „Wyślij lokalne” zastąpi plik w Dropboxie danymi z tej przeglądarki. Bezpieczniejsza opcja to „Synchronizuj teraz” albo „Pobierz i scal”. Kontynuować nadpisanie Dropboxa?');
    if (!ok) {
      showDropboxStatus('Anulowano wysyłanie lokalnych danych do Dropboxa.');
      return;
    }
  }
  return syncDropbox_v361_before(mode, silent);
};

const parseSmartCommand_v361_before = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_v361_before(rawText);
  if (!result) return result;
  installerV361FixFalseAddress(rawText, result);
  installerV361PatchCameraMaterials(rawText, result);
  installerV36RenameWifiCameraMaterials(rawText, result);
  installerV361NormalizeRj45Quantity(rawText, result);
  installerV361PatchRj45MaterialAndLabor(rawText, result);
  installerV35MarkKinds(result);
  installerV35ApplyNegations(rawText, result);
  result.items = mergeParserItems(result.items || []);
  installerV35MarkKinds(result);
  installerV361PatchRj45MaterialAndLabor(rawText, result);
  installerV36FixCameraQuantityWarnings(rawText, result);
  installerV35RefreshMissing(rawText, result);
  installerV36FixCameraQuantityWarnings(rawText, result);
  return result;
};


/* Konfiguracja i podpięcie trybu AI, wykonywane po lokalnych poprawkach. */

/* AI bez backendu: klucz OpenAI zapisywany lokalnie, test klucza i wybór modelu. */
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const AI_PARSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['client', 'detectedType', 'distanceKm', 'distanceRate', 'freeKm', 'dateHint', 'items', 'excluded', 'uncertain', 'warnings', 'facts', 'options'],
  properties: {
    client: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'phone', 'address'],
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' }
      }
    },
    detectedType: {
      type: 'string',
      enum: ['Kamery CCTV', 'Anteny / Sygnał', 'Sieć / Wi‑Fi', 'Domofon', 'Alarm', 'Automatyka bram', 'Przewody / Okablowanie', 'Złącza / Akcesoria', 'Dopłaty / Trudne warunki', 'Serwis', '']
    },
    distanceKm: { type: 'number' },
    distanceRate: { type: 'number' },
    freeKm: { type: 'number' },
    dateHint: { type: 'string' },
    items: {
      type: 'array',
      maxItems: 40,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'name', 'category', 'quantity', 'unit', 'cameraType', 'connectivity', 'difficulty', 'includeInQuote', 'confidence', 'notes'],
        properties: {
          type: {
            type: 'string',
            enum: ['camera_mount', 'camera_material', 'junction_box', 'cable', 'cable_labor', 'drilling', 'remote_view', 'switch_poe', 'recorder', 'disk', 'rj45_material', 'rj45_labor', 'wifi_extender', 'router_config', 'network_device', 'other_labor', 'other_material', 'unknown']
          },
          name: { type: 'string' },
          category: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          cameraType: { type: 'string', enum: ['tube', 'dome', 'ptz', 'generic', 'none'] },
          connectivity: { type: 'string', enum: ['poe', 'wifi', 'lte', 'wired', 'unknown', 'none'] },
          difficulty: { type: 'string', enum: ['easy', 'standard', 'hard', 'unknown'] },
          includeInQuote: { type: 'boolean' },
          confidence: { type: 'number' },
          notes: { type: 'string' }
        }
      }
    },
    excluded: { type: 'array', maxItems: 20, items: { type: 'string' } },
    uncertain: { type: 'array', maxItems: 30, items: { type: 'string' } },
    warnings: { type: 'array', maxItems: 30, items: { type: 'string' } },
    facts: { type: 'array', maxItems: 30, items: { type: 'string' } },
    options: { type: 'array', maxItems: 20, items: { type: 'string' } }
  }
};


const AI_MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini — tańszy / szybki' },
  { value: 'gpt-4o', label: 'gpt-4o — dokładniejszy' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini — nowszy mały model' },
  { value: 'gpt-4.1', label: 'gpt-4.1 — mocniejszy model' }
];








const readSettingsFromForm_v37_before_ai = readSettingsFromForm;
readSettingsFromForm = function() {
  return aiReadSettingsFromFormPatch(readSettingsFromForm_v37_before_ai());
};

const initForm_v37_before_ai = initForm;
initForm = function() {
  initForm_v37_before_ai();
  const settings = loadSettings();
  if ($('aiParserMode')) $('aiParserMode').value = settings.aiParserMode || 'local';
  if ($('aiOpenAiKey')) $('aiOpenAiKey').value = settings.aiOpenAiKey || '';
  fillAiModelSelect();
  if ($('aiModel')) $('aiModel').value = normalizeAiModel(settings.aiModel || 'gpt-4o-mini');
  renderAiParserStatus();
};

const refreshFormAfterBackupImport_v37_before_ai = refreshFormAfterBackupImport;
refreshFormAfterBackupImport = function() {
  refreshFormAfterBackupImport_v37_before_ai();
  const settings = loadSettings();
  if ($('aiParserMode')) $('aiParserMode').value = settings.aiParserMode || 'local';
  if ($('aiOpenAiKey')) $('aiOpenAiKey').value = settings.aiOpenAiKey || '';
  fillAiModelSelect();
  if ($('aiModel')) $('aiModel').value = normalizeAiModel(settings.aiModel || 'gpt-4o-mini');
  renderAiParserStatus();
};







const analyzeVoiceCommandFromField_v37_local = analyzeVoiceCommandFromField;
analyzeVoiceCommandFromField = function() {
  const settings = loadSettings();
  if (normalizeAiParserMode(settings.aiParserMode) === 'ai') return analyzeVoiceCommandWithAiFromField();
  return analyzeVoiceCommandFromField_v37_local();
};















/*
 * Pomocnik Instalatora PWA — etap 6: proces wyceny i interfejs mobilny.
 * Ten modul nie zmienia parsera, obliczen ani zapisu danych.
 */

(function () {
  'use strict';

  const MOBILE_BREAKPOINT = 850;
  const STEP_META = {
    1: {
      title: 'Opis wizyty',
      counter: 'Krok 1 z 4',
      next: 'Dalej: weryfikacja',
      mobileNext: 'Dalej',
      mobileAria: 'Przejdź do weryfikacji danych',
      hint: 'Dodaj opis wizyty albo przejdź dalej.'
    },
    2: {
      title: 'Weryfikacja danych',
      counter: 'Krok 2 z 4',
      next: 'Dalej: wycena',
      mobileNext: 'Dalej',
      mobileAria: 'Przejdź do pozycji i cen',
      hint: 'Sprawdź dane klienta i zatwierdź wynik analizy.'
    },
    3: {
      title: 'Pozycje i ceny',
      counter: 'Krok 3 z 4',
      next: 'Dalej: finalizacja',
      mobileNext: 'Finalizacja',
      mobileAria: 'Przejdź do finalizacji wyceny',
      hint: 'Uzupełnij pozycje, ceny i koszt dojazdu.'
    },
    4: {
      title: 'Finalizacja',
      counter: 'Krok 4 z 4',
      next: 'Finalizacja',
      mobileNext: 'Zapisz wycenę',
      mobileAria: 'Zapisz aktualną wycenę',
      hint: 'Sprawdź dokumenty i zapisz wycenę.'
    }
  };

  let activeWorkflowStep = 1;

  function getElement(id) {
    return document.getElementById(id);
  }

  function isMobileLayout() {
    return window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches ?? window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function serviceCount() {
    if (typeof state !== 'undefined' && Array.isArray(state.services)) return state.services.length;
    return document.querySelectorAll('#servicesBody tr').length;
  }

  function hasVoiceText() {
    return Boolean(String(getElement('voiceCommand')?.value || '').trim());
  }

  function parserIsVisible() {
    const preview = getElement('parserPreview');
    return Boolean(preview && !preview.hidden);
  }

  function updateStepStatuses() {
    const count = serviceCount();
    const statuses = {
      1: hasVoiceText() ? 'Gotowy' : (activeWorkflowStep === 1 ? 'Teraz' : 'Oczekuje'),
      2: parserIsVisible() ? 'Sprawdź' : (count > 0 ? 'Gotowy' : (activeWorkflowStep === 2 ? 'Teraz' : 'Oczekuje')),
      3: count > 0 ? `${count} ${count === 1 ? 'pozycja' : count < 5 ? 'pozycje' : 'pozycji'}` : (activeWorkflowStep === 3 ? 'Teraz' : 'Oczekuje'),
      4: count > 0 ? 'Gotowe' : (activeWorkflowStep === 4 ? 'Teraz' : 'Oczekuje')
    };

    for (let step = 1; step <= 4; step += 1) {
      const status = getElement(`step${step}Status`);
      if (status) status.textContent = statuses[step];
    }
  }

  function updateWorkflowMirrors() {
    const gross = getElement('sumGross')?.textContent || '0,00 zł';
    const client = String(getElement('clientName')?.value || '').trim();
    const address = String(getElement('clientAddress')?.value || '').trim();
    const count = serviceCount();

    const grossMirror = getElement('finalGrossMirror');
    if (grossMirror) grossMirror.textContent = gross;

    const clientMirror = getElement('finalClientMirror');
    if (clientMirror) {
      clientMirror.textContent = client || address
        ? [client || 'Klient bez nazwy', address].filter(Boolean).join(' — ')
        : 'Aktualna wycena';
    }

    const countLabel = getElement('workflowServicesCount');
    if (countLabel) {
      countLabel.textContent = `${count} ${count === 1 ? 'pozycja' : count > 1 && count < 5 ? 'pozycje' : 'pozycji'}`;
    }

    updateStepStatuses();
  }

  function updateParserWaitingState() {
    const waiting = getElement('parserWaitingState');
    if (waiting) waiting.hidden = parserIsVisible();
  }

  function centerActiveWorkflowStep(activeButton) {
    const container = document.querySelector('.workflow-steps');
    if (!container || !activeButton || container.scrollWidth <= container.clientWidth) return;

    const targetLeft = activeButton.offsetLeft - ((container.clientWidth - activeButton.offsetWidth) / 2);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function updateWorkflowActionBar(meta, normalized) {
    const actions = getElement('workflowActions');
    const next = getElement('workflowNextBtn');
    const mobilePrimary = getElement('mobileWorkflowPrimaryBtn');
    const prev = getElement('workflowPrevBtn');
    const hint = getElement('workflowActionHint');
    const mobileLabel = getElement('mobileWorkflowStepLabel');

    if (actions) {
      actions.dataset.step = String(normalized);
      actions.classList.toggle('is-final-step', normalized === 4);
    }
    if (hint) hint.textContent = meta.hint;
    if (mobileLabel) mobileLabel.textContent = meta.counter;
    if (prev) {
      prev.disabled = normalized === 1;
      prev.setAttribute('aria-label', normalized === 1 ? 'Jesteś na pierwszym kroku' : `Wróć do kroku ${normalized - 1}`);
    }
    if (next) {
      next.hidden = normalized === 4;
      next.textContent = meta.next;
    }
    if (mobilePrimary) {
      mobilePrimary.textContent = meta.mobileNext;
      mobilePrimary.setAttribute('aria-label', meta.mobileAria);
      mobilePrimary.dataset.action = normalized === 4 ? 'save' : 'next';
    }
  }

  function setWorkflowStep(step, options = {}) {
    const normalized = Math.max(1, Math.min(4, Number(step) || 1));
    const previous = activeWorkflowStep;
    activeWorkflowStep = normalized;

    document.querySelectorAll('[data-workflow-step]').forEach(panel => {
      const isActive = Number(panel.dataset.workflowStep) === normalized;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
      panel.setAttribute('aria-hidden', String(!isActive));
    });

    let activeButton = null;
    document.querySelectorAll('[data-workflow-target]').forEach(button => {
      const buttonStep = Number(button.dataset.workflowTarget);
      const isActive = buttonStep === normalized;
      button.classList.toggle('active', isActive);
      button.classList.toggle('completed', buttonStep < normalized);
      button.setAttribute('aria-current', isActive ? 'step' : 'false');
      button.setAttribute('aria-label', `Krok ${buttonStep}: ${STEP_META[buttonStep].title}`);
      if (isActive) activeButton = button;
    });

    const meta = STEP_META[normalized];
    const counter = getElement('workflowStepCounter');
    const title = getElement('workflowStepTitle');

    if (counter) counter.textContent = meta.counter;
    if (title) title.textContent = meta.title;
    updateWorkflowActionBar(meta, normalized);
    updateParserWaitingState();
    updateWorkflowMirrors();

    if (isMobileLayout()) centerActiveWorkflowStep(activeButton);

    if (options.scroll !== false && previous !== normalized) {
      const heading = document.querySelector('.workflow-steps');
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      heading?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function runMobilePrimaryAction() {
    if (activeWorkflowStep === 4) {
      getElement('saveQuoteBtn')?.click();
      return;
    }
    setWorkflowStep(activeWorkflowStep + 1);
  }

  function initWorkflowNavigation() {
    document.querySelectorAll('[data-workflow-target]').forEach(button => {
      button.addEventListener('click', () => setWorkflowStep(button.dataset.workflowTarget));
    });

    getElement('workflowPrevBtn')?.addEventListener('click', () => setWorkflowStep(activeWorkflowStep - 1));
    getElement('workflowNextBtn')?.addEventListener('click', () => setWorkflowStep(activeWorkflowStep + 1));
    getElement('mobileWorkflowPrimaryBtn')?.addEventListener('click', runMobilePrimaryAction);

    getElement('newQuoteBtn')?.addEventListener('click', () => {
      window.setTimeout(() => {
        document.querySelector('[data-tab="quoteTab"]')?.click();
        setWorkflowStep(1);
      }, 0);
    });

    getElement('acceptParserBtn')?.addEventListener('click', () => {
      window.setTimeout(() => setWorkflowStep(3), 0);
    });

    getElement('rejectParserBtn')?.addEventListener('click', () => {
      window.setTimeout(() => setWorkflowStep(1), 0);
    });

    getElement('savedQuotes')?.addEventListener('click', event => {
      if (!event.target.closest('.load')) return;
      window.setTimeout(() => setWorkflowStep(3, { scroll: false }), 0);
    });

    getElement('catalogView')?.addEventListener('click', event => {
      if (!event.target.closest('[data-action="add"]')) return;
      window.setTimeout(() => setWorkflowStep(3, { scroll: false }), 0);
    });

    getElement('voiceCommand')?.addEventListener('input', updateStepStatuses);
    getElement('clientName')?.addEventListener('input', updateWorkflowMirrors);
    getElement('clientAddress')?.addEventListener('input', updateWorkflowMirrors);
  }

  function initParserObserver() {
    const preview = getElement('parserPreview');
    if (!preview) return;

    const observer = new MutationObserver(() => {
      updateParserWaitingState();
      updateStepStatuses();
      if (!preview.hidden && activeWorkflowStep === 1) {
        setWorkflowStep(2);
      }
    });

    observer.observe(preview, {
      attributes: true,
      attributeFilter: ['hidden', 'style', 'class'],
      childList: true,
      subtree: false
    });
  }

  function initValueObservers() {
    const observer = new MutationObserver(updateWorkflowMirrors);
    ['sumGross', 'sumNet', 'sumVat', 'servicesBody', 'serviceCards'].forEach(id => {
      const element = getElement(id);
      if (element) observer.observe(element, { childList: true, subtree: true, characterData: true });
    });
  }

  function activateMorePanel(targetId) {
    document.querySelectorAll('.more-nav-button').forEach(button => {
      const active = button.dataset.moreTarget === targetId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });

    document.querySelectorAll('.more-panel').forEach(panel => {
      const active = panel.id === targetId;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }

  function initMoreNavigation() {
    document.querySelectorAll('.more-nav-button').forEach(button => {
      button.addEventListener('click', () => activateMorePanel(button.dataset.moreTarget));
    });
    activateMorePanel('settingsTab');
  }

  function updateActionMenuState() {
    const anyOpen = Boolean(document.querySelector('details.action-menu[open]'));
    document.body.classList.toggle('action-menu-open', anyOpen && isMobileLayout());
  }

  function closeOtherActionMenus(activeMenu = null) {
    document.querySelectorAll('details.action-menu[open]').forEach(menu => {
      if (menu !== activeMenu) menu.open = false;
    });
    window.setTimeout(updateActionMenuState, 0);
  }

  function initActionMenus() {
    document.addEventListener('toggle', event => {
      const menu = event.target.closest?.('details.action-menu');
      if (!menu) return;
      if (menu.open) {
        closeOtherActionMenus(menu);
        if (isMobileLayout()) {
          window.setTimeout(() => menu.querySelector('.action-menu-content button')?.focus({ preventScroll: true }), 40);
        }
      }
      window.setTimeout(updateActionMenuState, 0);
    }, true);

    document.addEventListener('click', event => {
      const menuButton = event.target.closest('details.action-menu button');
      if (menuButton) {
        const menu = menuButton.closest('details.action-menu');
        window.setTimeout(() => {
          if (menu) menu.open = false;
          updateActionMenuState();
        }, 0);
        return;
      }
      if (!event.target.closest('details.action-menu')) closeOtherActionMenus();
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const openMenu = document.querySelector('details.action-menu[open]');
      if (!openMenu) return;
      openMenu.open = false;
      openMenu.querySelector('summary')?.focus();
      updateActionMenuState();
    });
  }

  function improveMainNavigationAccessibility() {
    document.querySelectorAll('.main-navigation .tab').forEach(button => {
      button.setAttribute('aria-selected', String(button.classList.contains('active')));
      button.addEventListener('click', () => {
        closeOtherActionMenus();
        document.querySelectorAll('.main-navigation .tab').forEach(item => {
          item.setAttribute('aria-selected', String(item === button));
        });
      });
    });
  }

  function updateVisualViewportOffset() {
    const viewport = window.visualViewport;
    if (!viewport) {
      document.documentElement.style.setProperty('--mobile-keyboard-offset', '0px');
      return;
    }
    const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty('--mobile-keyboard-offset', `${Math.round(offset)}px`);
  }

  function initMobileViewportHandling() {
    updateVisualViewportOffset();
    window.visualViewport?.addEventListener('resize', updateVisualViewportOffset);
    window.visualViewport?.addEventListener('scroll', updateVisualViewportOffset);
    window.addEventListener('resize', () => {
      updateVisualViewportOffset();
      updateActionMenuState();
      const activeButton = document.querySelector('[data-workflow-target].active');
      if (isMobileLayout()) centerActiveWorkflowStep(activeButton);
    });
  }

  function initStage6Interface() {
    initWorkflowNavigation();
    initParserObserver();
    initValueObservers();
    initMoreNavigation();
    initActionMenus();
    improveMainNavigationAccessibility();
    initMobileViewportHandling();
    renderAnalysisModeHint(loadSettings());
    setWorkflowStep(1, { scroll: false });
    updateWorkflowMirrors();
  }

  document.addEventListener('DOMContentLoaded', initStage6Interface);

  window.setWorkflowStep = setWorkflowStep;
  window.getWorkflowStep = () => activeWorkflowStep;
}());

