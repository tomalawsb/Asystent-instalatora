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

