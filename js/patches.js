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

