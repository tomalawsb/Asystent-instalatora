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

