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
  $('suggestBtn').addEventListener('click', suggestFromNotes);
  $('saveQuoteBtn').addEventListener('click', saveCurrentQuote);
  $('newQuoteBtn').addEventListener('click', newQuote);
  $('exportTxtBtn').addEventListener('click', () => downloadTxt(state));
  $('printBtn').addEventListener('click', () => window.print());
  $('copyClientSmsBtn').addEventListener('click', () => copyTextToClipboard(buildClientSms(state), 'SMS do klienta skopiowany do schowka.'));
  $('offerPdfBtn').addEventListener('click', () => generateOfferPdf(state));
  $('refreshClientMessageBtn').addEventListener('click', renderClientMessagePreview);
  $('copyClientSmsPreviewBtn').addEventListener('click', () => copyTextToClipboard(buildClientSms(state), 'SMS do klienta skopiowany do schowka.'));
  $('copyClientDescriptionBtn').addEventListener('click', () => copyTextToClipboard(buildClientDescription(state), 'Opis wyceny skopiowany do schowka.'));
  $('offerPdfPreviewBtn').addEventListener('click', () => generateOfferPdf(state));
  $('refreshMaterialsBtn').addEventListener('click', renderMaterialsPreview);
  $('copyMaterialsBtn').addEventListener('click', () => copyMaterialsList(state));
  $('copyReportBtn').addEventListener('click', copyReport);
  $('catalogSearch').addEventListener('input', renderCatalog);
  $('saveCatalogItemBtn').addEventListener('click', saveCatalogItemFromForm);
  $('clearCatalogEditorBtn').addEventListener('click', clearCatalogEditor);
  $('exportCatalogBtn').addEventListener('click', exportCatalog);
  $('importCatalogBtn').addEventListener('click', () => $('importCatalogFile').click());
  $('importCatalogFile').addEventListener('change', importCatalogFromFile);
  $('resetCatalogBtn').addEventListener('click', resetCatalogToDefault);
  $('saveSettingsBtn').addEventListener('click', saveSettingsFromForm);
  if ($('uiTheme')) $('uiTheme').addEventListener('change', () => {
    const settings = readSettingsFromForm();
    saveSettings(settings);
    applyTheme(settings.uiTheme);
    showInfo('Zmieniono motyw interfejsu.');
  });
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
  $('saveDropboxSettingsBtn').addEventListener('click', saveDropboxSettingsFromForm);
  $('dropboxSyncBtn').addEventListener('click', () => syncDropbox('merge'));
  $('dropboxPullBtn').addEventListener('click', () => syncDropbox('pull'));
  $('dropboxPushBtn').addEventListener('click', () => syncDropbox('push'));
  $('dropboxTestBtn').addEventListener('click', testDropboxConnection);
  if ($('saveAiSettingsBtn')) $('saveAiSettingsBtn').addEventListener('click', saveAiSettingsFromForm);
  if ($('aiTestBtn')) $('aiTestBtn').addEventListener('click', testOpenAiKeyConnection);
  if ($('analyzeVoiceAiBtn')) $('analyzeVoiceAiBtn').addEventListener('click', analyzeVoiceCommandWithAiFromField);
  $('installBtn').addEventListener('click', installPwa);
  $('voiceBtn').addEventListener('click', startDictation);
  $('analyzeVoiceBtn').addEventListener('click', analyzeVoiceCommandFromField);
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

