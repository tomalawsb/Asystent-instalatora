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

