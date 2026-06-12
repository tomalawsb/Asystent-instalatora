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

