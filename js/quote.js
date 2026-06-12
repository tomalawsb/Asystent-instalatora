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

