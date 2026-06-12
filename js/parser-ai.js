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
    const testData = await callOpenAiParser('Test: Jan Kowalski, Warszawa, montaż jednej kamery IP.', { ...settings, aiUseWebSearch: false });
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
  const catalog = aiFindExactCatalogService(category, name);
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


/* =========================================================
   v4.7 — AI-first, web search cen i zapis cen do cennika
   ========================================================= */

normalizeAiParserMode = function() {
  return 'ai';
};

normalizeAiModel = function(value) {
  const model = String(value || '').trim();
  return model || 'gpt-4.1-mini';
};

renderAnalysisModeHint = function(settings = readSettingsFromForm()) {
  const hint = $('analysisModeHint');
  const button = $('analyzeVoiceBtn');
  const web = settings.aiUseWebSearch !== false;
  if (hint) {
    hint.textContent = `Tryb aktywny: AI OpenAI (${normalizeAiModel(settings.aiModel)})${web ? ' z wyszukiwaniem brakujących cen w internecie' : ''}. Parser lokalny uruchomi się tylko awaryjnie.`;
  }
  if (button && !button.disabled) button.textContent = 'Analizuj wizytę przez AI';
};

analyzeVoiceCommandUsingSelectedMode = async function() {
  const voiceField = $('voiceCommand');
  const notesText = String($('notes')?.value || '').trim();
  if (!String(voiceField?.value || '').trim() && notesText) {
    voiceField.value = notesText;
    updateVoiceSelectionActions();
    showInfo('Użyto notatek z wizyty jako tekstu do analizy.');
  }
  renderAnalysisModeHint(readSettingsFromForm());
  await analyzeVoiceCommandWithAiFromField();
};

fillAiModelSelect = function() {
  const select = $('aiModel');
  if (!select) return;
  const current = normalizeAiModel(loadSettings().aiModel || select.value || 'gpt-4.1-mini');
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
};

aiReadSettingsFromFormPatch = function(settings) {
  return {
    ...settings,
    aiParserMode: 'ai',
    aiOpenAiKey: $('aiOpenAiKey') ? $('aiOpenAiKey').value.trim() : (settings.aiOpenAiKey || ''),
    aiModel: getSelectedAiModel(settings.aiModel || 'gpt-4.1-mini'),
    aiUseWebSearch: $('aiUseWebSearch') ? !!$('aiUseWebSearch').checked : settings.aiUseWebSearch !== false,
    aiCatalogPriceImport: normalizeAiCatalogPriceImport($('aiCatalogPriceImport')?.value || settings.aiCatalogPriceImport)
  };
};

renderAiParserStatus = function(text = '') {
  const box = $('aiParserStatus');
  if (!box) return;
  const settings = loadSettings();
  const key = String(settings.aiOpenAiKey || '').trim();
  const model = normalizeAiModel(settings.aiModel);
  const web = settings.aiUseWebSearch !== false ? 'Internetowe ceny: włączone.' : 'Internetowe ceny: wyłączone.';
  const importMode = normalizeAiCatalogPriceImport(settings.aiCatalogPriceImport);
  const importLabel = importMode === 'automatic' ? 'Ceny są dopisywane automatycznie.' : importMode === 'after_accept' ? 'Ceny są dopisywane po zatwierdzeniu.' : 'Ceny nie są dopisywane do cennika.';
  const last = settings.aiLastTestAt ? ` Ostatni test: ${formatDateTime(settings.aiLastTestAt)}.` : '';
  box.classList.remove('ok', 'error');
  if (text) {
    box.textContent = text;
    return;
  }
  if (!key) {
    box.textContent = `Brakuje klucza OpenAI. Do czasu jego zapisania zadziała wyłącznie awaryjny parser lokalny. ${web}`;
    box.classList.add('error');
    return;
  }
  box.textContent = `AI-first — model: ${model}, klucz: ${maskAiKey(key)}. ${web} ${importLabel}${last}`;
  box.classList.add('ok');
};

buildAiCatalogHints = function() {
  const important = [];
  for (const category of CATEGORIES) {
    const rows = (CATALOG[category] || []).slice(0, 100).map(item => ({
      name: item.name,
      unit: item.unit,
      priceNet: number(item.price_net, 0)
    }));
    if (rows.length) important.push({ category, items: rows });
  }
  return important;
};

buildAiPrompt = function(text, catalogHints, settings = loadSettings()) {
  return [
    'TEKST DO ANALIZY:',
    text,
    '',
    `VAT używany w programie: ${number(settings.vatRate, 23)}%.`,
    `Wyszukiwanie internetowe cen: ${settings.aiUseWebSearch !== false ? 'DOZWOLONE' : 'NIEDOZWOLONE'}.`,
    '',
    'AKTUALNY CENNIK LOKALNY PROGRAMU (ceny netto):',
    JSON.stringify(Array.isArray(catalogHints) ? catalogHints : []).slice(0, 45000)
  ].join('\n');
};

callOpenAiParser = async function(raw, settings) {
  const key = String(settings.aiOpenAiKey || '').trim();
  if (!key) throw new Error('Brakuje klucza OpenAI.');
  if (raw.length > 30000) throw new Error('Tekst jest za długi. Skróć go do najważniejszych informacji.');

  const vatRate = number(settings.vatRate, 23);
  const webEnabled = settings.aiUseWebSearch !== false;
  const systemPrompt = [
    'Jesteś głównym silnikiem analizy ofert i wizyt instalatora w Polsce. Nie jesteś prostym parserem słów kluczowych.',
    'Masz zrozumieć cały dokument, jego kontekst, korekty, negacje, warianty, powtórzenia i kolejność ważności informacji.',
    'Zwróć wyłącznie dane zgodne ze schematem JSON.',
    'Najpierw rozpoznaj typ dokumentu: surowa wizyta, istniejąca wycena, recenzja błędnej wyceny, nowa propozycja albo dokument mieszany.',
    'Jeżeli tekst opisuje starą niepełną wycenę, a później podaje poprawioną kompletną wycenę, NIE dodawaj starych pozycji do nowej oferty. Traktuj je wyłącznie jako kontekst lub wykluczenia.',
    'Jeżeli fragment został wklejony dwa razy, deduplikuj go.',
    'Jeżeli są warianty, nadaj im krótkie identyfikatory i przypisz każdej pozycji variantId. Pozycje wspólne dla wszystkich wariantów mają pusty variantId.',
    'W recommendedVariantId wskaż wariant najbardziej racjonalny technicznie; nie musi być najtańszy.',
    'Rozróżniaj: wymagane, opcjonalne, istniejące, wykluczone i wymagające potwierdzenia. Pozycji istniejących lub wykluczonych nie dodawaj do items z includeInQuote=true.',
    'CENY: najpierw używaj dokładnej pozycji z lokalnego cennika. Ustaw priceSource=local_catalog.',
    'Jeżeli tekst jawnie podaje końcową cenę konkretnej pozycji, użyj jej i ustaw priceSource=input_text.',
    webEnabled
      ? 'Jeżeli brak ceny lokalnej i ceny w tekście, użyj web_search, sprawdź aktualne ceny w Polsce i podaj rozsądną cenę netto. Dla materiału preferuj cenę rynkową z wiarygodnego sklepu lub producenta. Dla robocizny podaj ostrożną średnią rynkową. Ustaw priceSource=web, prawdziwy URL źródła i nazwę źródła. Nie wymyślaj adresów URL.'
      : 'Jeżeli brak ceny lokalnej i ceny w tekście, ustaw cenę 0, priceSource=none i dodaj pozycję do uncertain.',
    `Jeżeli źródło podaje wyłącznie cenę brutto, oblicz cenę netto przy VAT ${vatRate}%.`,
    'priceConfidence podawaj od 0 do 1. Cena orientacyjna lub szeroki przedział powinny mieć niższą pewność.',
    'Dla mostu bezprzewodowego używaj przewodu Ethernet/skrętki i PoE. RG6 dodawaj tylko wtedy, gdy potwierdzono osobną antenę LTE lub TV. Negacja RG6 ma pierwszeństwo.',
    'Prędkość sieci zapisuj w Mb/s, nie MB.',
    'Jeżeli oczekiwano ponad 100 Mb/s, ostrzeż urządzenia z portami 10/100 Mb/s.',
    'Nie przypisuj prędkości, ilości, ceny ani modelu urządzenia do pola adresu.',
    'Wszystkie ceny pozycji w items mają być cenami jednostkowymi netto.'
  ].join(' ');

  const payload = {
    model: normalizeAiModel(settings.aiModel),
    store: false,
    max_output_tokens: 7000,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildAiPrompt(raw, buildAiCatalogHints(), settings) }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'installer_visit_ai_analysis',
        strict: true,
        schema: AI_PARSE_SCHEMA
      }
    }
  };

  if (webEnabled) {
    payload.tools = [{
      type: 'web_search',
      search_context_size: 'low',
      user_location: { type: 'approximate', country: 'PL' }
    }];
    payload.tool_choice = 'auto';
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: openAiHeaders(settings),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
  const outputText = extractOpenAiOutputText(data);
  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error('OpenAI nie zwróciło poprawnych danych strukturalnych.');
  }
  return { ok: true, model: data.model || payload.model, usage: data.usage || null, result: parsed };
};


function aiFindExactCatalogService(category, name) {
  const wanted = aiNormText(name);
  if (!wanted) return null;
  const categories = category && CATALOG[category] ? [category] : CATEGORIES;
  for (const cat of categories) {
    const exact = (CATALOG[cat] || []).find(item => aiNormText(item.name) === wanted);
    if (exact) return { ...exact, category: cat };
  }
  return null;
}

function aiPriceNetFromSource(sourceItem, settings = loadSettings()) {
  const explicitNet = aiNumber(sourceItem?.priceNet, 0);
  if (explicitNet > 0) return explicitNet;
  const gross = aiNumber(sourceItem?.priceGross, 0);
  if (gross <= 0) return 0;
  const vat = Math.max(0, aiNumber(settings.vatRate, 23));
  return round2(gross / (1 + vat / 100));
}

aiBuildItem = function({
  category, name, unit = 'szt', quantity = 1, fallbackPrice = 0,
  kind = '', key = '', sourceItem = null
}) {
  const catalog = aiFindCatalogService(category, name);
  const finalCategory = catalog?.category || category || 'Serwis';
  const finalName = catalog?.name || name;
  const finalUnit = catalog?.unit || unit || 'szt';
  const aiPrice = aiPriceNetFromSource(sourceItem);
  let price = catalog ? number(catalog.price_net, 0) : aiPrice;
  let source = catalog ? 'local_catalog' : String(sourceItem?.priceSource || (aiPrice > 0 ? 'estimate' : 'none'));
  let sourceLabel = catalog ? 'Cennik lokalny programu' : String(sourceItem?.priceSourceLabel || '');
  let sourceUrl = catalog ? '' : String(sourceItem?.priceSourceUrl || '');

  if (!catalog && price <= 0 && kind === 'material') {
    const suggested = getSuggestedMaterialPrice(finalName, finalCategory);
    if (suggested !== null) {
      price = suggested;
      source = 'local_catalog';
      sourceLabel = 'Lokalna baza cen materiałów';
    }
  }
  if (!catalog && price <= 0) price = number(fallbackPrice, 0);

  const built = buildVoiceItem({
    category: finalCategory,
    name: finalName,
    unit: finalUnit,
    quantity,
    priceNet: round2(price),
    key: key || `ai_${aiNormText(finalName).slice(0, 50)}`
  });
  if (kind) built.itemKind = kind;
  built.parserSource = 'ai';
  built.parserKey = key || finalName;
  built.learningSignature = `ai|${aiNormText(finalName)}|${finalUnit}|${number(price, 0)}`;
  built.aiPriceSource = source;
  built.aiPriceSourceLabel = sourceLabel;
  built.aiPriceSourceUrl = sourceUrl;
  built.aiPriceConfidence = aiNumber(sourceItem?.priceConfidence, source === 'local_catalog' ? 1 : 0);
  built.aiCatalogMissing = !catalog && price > 0;
  built.aiVariantId = String(sourceItem?.variantId || '');
  if (built.aiCatalogMissing) built.suggestedPrice = true;
  return built;
};

function aiBuildMappedItem(sourceItem, defaults) {
  return aiBuildItem({ ...defaults, sourceItem, fallbackPrice: 0 });
}

aiMapOneItem = function(raw, item) {
  if (!item || item.includeInQuote === false) return null;
  const type = String(item.type || '').toLowerCase();
  const qty = aiCleanQuantity(item.quantity, 1);
  const rawName = String(item.name || '').trim();
  const categoryHint = String(item.category || '').trim();
  const unitHint = String(item.unit || '').trim() || 'szt';

  if (type === 'other_material') return aiBuildMappedItem(item, { category: categoryHint || 'Serwis', name: rawName || 'Materiał dodatkowy', unit: unitHint, quantity: qty, kind: 'material', key: 'ai_other_material' });
  if (type === 'other_labor') return aiBuildMappedItem(item, { category: categoryHint || 'Serwis', name: rawName || 'Dodatkowa praca instalacyjna', unit: unitHint, quantity: qty, kind: 'labor', key: 'ai_other_labor' });

  switch (type) {
    case 'camera_mount': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || aiCameraMountName(item), unit: 'szt', quantity: qty, kind: 'labor', key: 'ai_camera_mount' });
    case 'camera_material': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || aiCameraMaterialName(item), unit: 'szt', quantity: qty, kind: 'material', key: 'ai_camera_material' });
    case 'camera_config': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || 'Konfiguracja kamery z aplikacją', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_camera_config' });
    case 'junction_box': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || 'Puszka montażowa pod kamerę', unit: 'szt', quantity: qty, kind: 'material', key: 'ai_camera_box' });
    case 'cable': return aiBuildMappedItem(item, { category: 'Przewody / Okablowanie', name: rawName || aiCableName(item, ''), unit: unitHint === 'szt' ? 'mb' : unitHint, quantity: qty, kind: 'material', key: 'ai_cable' });
    case 'cable_labor': return aiBuildMappedItem(item, { category: 'Przewody / Okablowanie', name: rawName || aiCableLaborName(item, ''), unit: unitHint === 'szt' ? 'mb' : unitHint, quantity: qty, kind: 'labor', key: 'ai_cable_labor' });
    case 'drilling': return aiBuildMappedItem(item, { category: 'Przewody / Okablowanie', name: rawName || 'Przewiert przez ścianę pod przewód', unit: 'szt', quantity: qty, kind: 'labor', key: 'ai_drilling' });
    case 'remote_view': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || 'Uruchomienie podglądu zdalnego', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_remote_view' });
    case 'switch_poe': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || aiSwitchName(item, ''), unit: 'szt', quantity: qty, kind: 'material', key: 'ai_switch_poe' });
    case 'recorder': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || aiRecorderName(item, ''), unit: 'szt', quantity: qty, kind: 'material', key: 'ai_recorder' });
    case 'disk': return aiBuildMappedItem(item, { category: 'Kamery CCTV', name: rawName || 'Dysk do rejestratora', unit: 'szt', quantity: qty, kind: 'material', key: 'ai_disk' });
    case 'rj45_material': return aiBuildMappedItem(item, { category: 'Złącza / Akcesoria', name: rawName || 'Wtyk RJ45 Cat 6 UTP', unit: 'szt', quantity: qty, kind: 'material', key: 'ai_rj45_material' });
    case 'rj45_labor': return aiBuildMappedItem(item, { category: 'Złącza / Akcesoria', name: rawName || 'Zarabianie wtyku RJ45', unit: 'szt', quantity: qty, kind: 'labor', key: 'ai_rj45_labor' });
    case 'wifi_extender': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Wzmacniacz Wi‑Fi', unit: 'szt', quantity: qty, kind: 'material', key: 'ai_wifi_extender' });
    case 'router_config': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Konfiguracja routera', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_router_config' });
    case 'wifi_config': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Konfiguracja Wi-Fi w domu', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_wifi_config' });
    case 'router_material': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Router Wi‑Fi', unit: 'szt', quantity: qty, kind: 'material', key: 'ai_router_material' });
    case 'network_device': return aiBuildMappedItem(item, { category: categoryHint || 'Sieć / Wi‑Fi', name: rawName || 'Urządzenie sieciowe', unit: unitHint, quantity: qty, kind: 'material', key: 'ai_network_device' });
    case 'wireless_bridge': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Zestaw mostu bezprzewodowego', unit: unitHint || 'kpl', quantity: qty, kind: 'material', key: 'ai_wireless_bridge' });
    case 'bridge_config': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Konfiguracja mostu bezprzewodowego', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_bridge_config' });
    case 'mount_material': return aiBuildMappedItem(item, { category: 'Anteny / Sygnał', name: rawName || 'Uchwyt antenowy', unit: 'szt', quantity: qty, kind: 'material', key: 'ai_mount_material' });
    case 'mount_labor_roof': return aiBuildMappedItem(item, { category: 'Dopłaty / Trudne warunki', name: rawName || 'Montaż urządzenia na kominie — praca na wysokości', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_mount_roof' });
    case 'mount_labor_wall': return aiBuildMappedItem(item, { category: 'Anteny / Sygnał', name: rawName || 'Montaż uchwytu i urządzenia na budynku', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_mount_wall' });
    case 'auxiliary_materials': return aiBuildMappedItem(item, { category: categoryHint || 'Złącza / Akcesoria', name: rawName || 'Materiały pomocnicze', unit: unitHint || 'kpl', quantity: qty, kind: 'material', key: 'ai_auxiliary_materials' });
    case 'surge_protection': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Zabezpieczenie przeciwprzepięciowe Ethernet', unit: unitHint || 'kpl', quantity: qty, kind: 'material', key: 'ai_surge_protection' });
    case 'network_test': return aiBuildMappedItem(item, { category: 'Sieć / Wi‑Fi', name: rawName || 'Pomiar i test połączenia sieciowego', unit: 'usł', quantity: qty, kind: 'labor', key: 'ai_network_test' });
    default:
      if (rawName) return aiBuildMappedItem(item, { category: categoryHint || 'Serwis', name: rawName, unit: unitHint, quantity: qty, kind: '', key: 'ai_fallback' });
      return null;
  }
};

function aiMapItemsForVariant(raw, rawItems, variantId) {
  const skipped = [];
  const selectedRaw = (rawItems || []).filter(item => {
    if (item?.includeInQuote === false) return false;
    const id = String(item?.variantId || '');
    return !id || !variantId || id === variantId;
  });
  const mapped = selectedRaw.map(item => {
    const row = aiMapOneItem(raw, item);
    if (!row) skipped.push(item?.name || item?.type || 'nieznana pozycja');
    return row;
  }).filter(Boolean);
  const merged = mergeParserItems(mapped);
  installerV35MarkKinds({ items: merged });
  return { items: merged, skipped };
}

convertAiParseToAppResult = function(raw, ai, envelope = {}) {
  const client = ai?.client || {};
  const warnings = Array.isArray(ai?.warnings) ? ai.warnings : [];
  const excluded = Array.isArray(ai?.excluded) ? ai.excluded : [];
  const uncertain = Array.isArray(ai?.uncertain) ? ai.uncertain : [];
  const rawItems = Array.isArray(ai?.items) ? ai.items : [];
  const variantsMeta = Array.isArray(ai?.variants) ? ai.variants.filter(v => v?.id) : [];
  const recommendedId = String(ai?.recommendedVariantId || variantsMeta.find(v => v.recommended)?.id || variantsMeta[0]?.id || '');
  const mappedVariants = variantsMeta.map(meta => {
    const mapped = aiMapItemsForVariant(raw, rawItems, String(meta.id));
    return {
      id: String(meta.id),
      name: String(meta.name || meta.id),
      description: String(meta.description || ''),
      recommended: String(meta.id) === recommendedId || !!meta.recommended,
      totalNet: aiNumber(meta.totalNet, 0),
      totalGross: aiNumber(meta.totalGross, 0),
      items: mapped.items
    };
  });
  const selectedVariant = mappedVariants.find(v => v.id === recommendedId) || mappedVariants[0] || null;
  const mappedBase = selectedVariant ? { items: selectedVariant.items, skipped: [] } : aiMapItemsForVariant(raw, rawItems, '');
  const mergedItems = mappedBase.items;
  const detectedType = ai?.detectedType && CATALOG[ai.detectedType] ? ai.detectedType : (mergedItems[0]?.category || 'Serwis');
  const variantOptions = mappedVariants.map(v => `${v.recommended ? 'Rekomendowany: ' : ''}${v.name}${v.description ? ` — ${v.description}` : ''}${v.totalNet > 0 ? ` (${money(v.totalNet)} netto)` : ''}`);
  const priceWarnings = mergedItems
    .filter(item => item.aiCatalogMissing)
    .map(item => `${item.name}: cena ${item.aiPriceSource === 'web' ? 'znaleziona w internecie' : 'spoza cennika'} — ${money(item.priceNet)} netto${item.aiPriceSourceLabel ? `, źródło: ${item.aiPriceSourceLabel}` : ''}`);

  const result = {
    client: {
      name: String(client.name || '').trim(),
      phone: String(client.phone || '').trim(),
      address: String(client.address || '').trim()
    },
    items: mergedItems,
    aiVariants: mappedVariants,
    selectedAiVariantId: selectedVariant?.id || '',
    detectedType,
    distanceKm: aiNumber(ai?.distanceKm, 0) > 0 ? aiNumber(ai.distanceKm, 0) : null,
    distanceRate: aiNumber(ai?.distanceRate, 0) > 0 ? aiNumber(ai.distanceRate, 0) : null,
    freeKm: aiNumber(ai?.freeKm, -1) >= 0 ? aiNumber(ai.freeKm, 0) : null,
    unknown: [...uncertain],
    learnedApplied: [
      `Analiza wykonana przez OpenAI (${envelope.model || normalizeAiModel(loadSettings().aiModel)}).`,
      ai?.priceResearchUsed ? 'AI użyło wyszukiwania internetowego do uzupełnienia brakujących cen.' : 'AI nie użyło wyszukiwania internetowego cen.'
    ],
    missingData: [],
    surchargeSuggestions: [],
    parserReport: {
      parser: `OpenAI / ${envelope.model || normalizeAiModel(loadSettings().aiModel)}`,
      parsersAvailable: ['AI reasoning', 'web_search cen', 'awaryjny parser lokalny'],
      warnings: [String(ai?.analysisSummary || '')].filter(Boolean).concat(warnings, excluded.map(x => `Wykluczono: ${x}`), priceWarnings),
      items: mergedItems.length,
      materialsNet: mergedItems.filter(x => x.itemKind === 'material').reduce((sum, x) => sum + number(x.quantity, 0) * number(x.priceNet, 0), 0),
      laborNet: mergedItems.filter(x => x.itemKind === 'labor').reduce((sum, x) => sum + number(x.quantity, 0) * number(x.priceNet, 0), 0),
      totalNet: mergedItems.reduce((sum, x) => sum + number(x.quantity, 0) * number(x.priceNet, 0), 0)
    },
    transcriptInfo: {
      isTranscript: true,
      findings: [String(ai?.analysisSummary || '')].filter(Boolean).concat(Array.isArray(ai?.facts) ? ai.facts : []),
      options: variantOptions.concat(Array.isArray(ai?.options) ? ai.options : []),
      rejected: excluded,
      followUps: [...uncertain, ...warnings]
    }
  };
  result.missingData = detectMissingData(raw, result);
  return result;
};

function saveAiPricesToCatalog(items) {
  const candidates = (items || []).filter(item =>
    item?.aiCatalogMissing &&
    number(item.priceNet, 0) > 0 &&
    ['web', 'input_text', 'estimate'].includes(String(item.aiPriceSource || ''))
  );
  if (!candidates.length) return 0;
  const catalog = structuredCloneSafe(CATALOG);
  let saved = 0;
  for (const item of candidates) {
    const category = String(item.category || 'Serwis').trim() || 'Serwis';
    const name = String(item.name || '').trim();
    if (!name) continue;
    if (!catalog[category]) catalog[category] = [];
    const idx = catalog[category].findIndex(row => aiNormText(row.name) === aiNormText(name));
    const record = { name, unit: String(item.unit || 'szt'), price_net: round2(item.priceNet) };
    if (idx >= 0) catalog[category][idx] = record;
    else catalog[category].push(record);
    saved += 1;
    item.aiCatalogMissing = false;
    item.aiPriceSource = 'local_catalog';
    item.aiPriceSourceLabel = 'Cennik lokalny — cena zapisana z analizy AI';
  }
  if (saved > 0) {
    saveCatalog(catalog);
    refreshCatalogControls();
    renderCatalog();
  }
  return saved;
}

function runLocalParserFallback(reason) {
  const message = reason ? `AI nie zadziałało (${reason}). Uruchomiono awaryjny parser lokalny.` : 'Uruchomiono awaryjny parser lokalny.';
  if (typeof analyzeVoiceCommandFromField_local_fallback === 'function') {
    analyzeVoiceCommandFromField_local_fallback();
  }
  window.setTimeout(() => showInfo(message), 0);
}

analyzeVoiceCommandWithAiFromField = async function() {
  const raw = $('voiceCommand').value.trim();
  if (!raw) {
    showInfo('Wpisz albo podyktuj treść wizyty, potem kliknij „Analizuj wizytę przez AI”.');
    return;
  }
  syncFromForm();
  const settings = readSettingsFromForm();
  if (!String(settings.aiOpenAiKey || '').trim()) {
    renderAiParserStatus('Brakuje klucza OpenAI — użyto awaryjnego parsera lokalnego.');
    $('aiParserStatus')?.classList.add('error');
    runLocalParserFallback('brak klucza OpenAI');
    return;
  }

  const analyzeBtn = $('analyzeVoiceBtn');
  const oldText = analyzeBtn?.textContent;
  try {
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = settings.aiUseWebSearch !== false ? 'AI analizuje i sprawdza ceny...' : 'AI analizuje...';
    }
    showInfo(settings.aiUseWebSearch !== false ? 'AI analizuje tekst i może wyszukać brakujące ceny w internecie.' : 'AI analizuje tekst bez wyszukiwania internetowego.');
    const data = await callOpenAiParser(raw, settings);
    const result = convertAiParseToAppResult(raw, data.result || data, data);
    const importMode = normalizeAiCatalogPriceImport(settings.aiCatalogPriceImport);
    if (importMode === 'automatic') {
      const saved = saveAiPricesToCatalog(result.items || []);
      if (saved > 0) result.learnedApplied.push(`Automatycznie dopisano do cennika ${saved} cen.`);
    }
    pendingParse = { raw, result };
    renderParserPreview(raw, result);
    const variants = result.aiVariants?.length || 0;
    const missingPrices = result.items.filter(item => number(item.priceNet, 0) <= 0).length;
    showInfo(`AI przygotowało analizę do zatwierdzenia. Pozycji: ${result.items.length}${variants > 1 ? `, wariantów: ${variants}` : ''}${missingPrices ? `, bez ceny: ${missingPrices}` : ''}.`);
  } catch (error) {
    renderAiParserStatus(`Błąd AI: ${error.message}. Uruchomiono parser lokalny.`);
    $('aiParserStatus')?.classList.add('error');
    runLocalParserFallback(error.message);
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = oldText || 'Analizuj wizytę przez AI';
    }
    renderAnalysisModeHint(settings);
  }
};
