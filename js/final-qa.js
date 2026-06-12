/*
 * Pomocnik Instalatora PWA — końcowe poprawki jakościowe etapu 7.
 * Moduł koryguje wyłącznie potwierdzone regresje parsera wykryte w testach bazowych.
 */

function finalQaNormalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[łŁ]/g, 'l')
    .replace(/[‑–—]/g, '-')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function finalQaFindCatalogItem(category, name, fallbackPrice, fallbackUnit = 'usł') {
  const item = findCatalogService(category, name);
  return {
    category,
    name,
    unit: item?.unit || fallbackUnit,
    priceNet: number(item?.price_net, fallbackPrice)
  };
}

function finalQaHasItem(result, namePattern) {
  return Array.isArray(result?.items) && result.items.some(item => namePattern.test(String(item?.name || '')));
}

function finalQaAddCatalogItem(result, category, name, fallbackPrice, key, fallbackUnit = 'usł') {
  if (!result || !Array.isArray(result.items) || finalQaHasItem(result, new RegExp(escapeRegExp(name), 'i'))) return;
  const catalogItem = finalQaFindCatalogItem(category, name, fallbackPrice, fallbackUnit);
  const item = buildVoiceItem({
    category: catalogItem.category,
    name: catalogItem.name,
    unit: catalogItem.unit,
    quantity: 1,
    priceNet: catalogItem.priceNet,
    key
  });
  item.itemKind = 'labor';
  result.items.push(item);
}

function finalQaExtractClientName(rawText) {
  const source = String(rawText || '').replace(/\s+/g, ' ').trim();
  const word = "[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'’-]*";
  const patterns = [
    new RegExp(`\\b(?:klientka|klient|pan|pani)\\s+(${word}\\s+${word})(?=\\s*[,.;]|\\s+(?:telefon|tel\\.?|adres|ulica|ul\\.?|montaż|montaz|konfiguracja|dojazd)\\b)`, 'i'),
    new RegExp(`^\\s*(${word}\\s+${word})(?=\\s*[,.;]?\\s+(?:telefon|tel\\.?|adres|ulica|ul\\.?)\\b)`, 'i')
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[1].replace(/\s+/g, ' ').trim();
  }
  return '';
}

function finalQaFixAddress(rawText, currentAddress) {
  const source = String(rawText || '').replace(/\s+/g, ' ').trim();
  const directLocality = source.match(/\badres\s+(?!ulica\b|ul\.?\b)([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'’-]*(?:\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż'’-]*){0,2})\s+(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?)(?=\s*[,.;]|\s+(?:montaż|montaz|ustawienie|konfiguracja|dojazd|trzeba)\b|$)/i);
  if (directLocality) return `${directLocality[1]} ${directLocality[2]}`.trim();

  return String(currentAddress || '')
    .replace(/,\s*Adres\s+/i, ', ')
    .replace(/^Adres\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function finalQaHasRemotePreviewIntent(rawText) {
  const text = finalQaNormalizeText(rawText);
  return /\b(?:podglad(?:u|em)?|hik-connect|ezviz)\b/.test(text)
    || /\b(?:uruchom|wlacz|skonfigur|zainstal)\w*.{0,45}\b(?:aplikacj|telefon)\b/.test(text)
    || /\b(?:aplikacj|telefon)\b.{0,45}\b(?:do kamer|dla kamer|podglad)\b/.test(text);
}

function finalQaDedupeSingleAntennaService(rawText, result) {
  if (!result || !Array.isArray(result.items)) return;
  const text = finalQaNormalizeText(rawText);
  const mentions = (text.match(/\bmontaz\w*\s+anten\w*/g) || []).length;
  if (mentions > 1) return;

  let kept = false;
  result.items = result.items.filter(item => {
    if (!/^Montaż anteny DVB-T$/i.test(String(item?.name || ''))) return true;
    if (!kept) {
      kept = true;
      return true;
    }
    return false;
  });
}

const parseSmartCommand_beforeFinalQa = parseSmartCommand;
parseSmartCommand = function(rawText) {
  const result = parseSmartCommand_beforeFinalQa(rawText);
  if (!result) return result;

  const source = String(rawText || '');
  const normalized = finalQaNormalizeText(source);

  if (!result.client) result.client = { name: '', phone: '', address: '' };
  if (!result.client.name) result.client.name = finalQaExtractClientName(source);
  result.client.address = finalQaFixAddress(source, result.client.address);

  if (result.freeKm === null || result.freeKm === undefined) {
    const freeMatch = normalized.match(/\b(?:pierwsze\s+)?(\d+(?:[.,]\d+)?)\s*(?:km|kilometrow?|kilometry)\s+(?:gratis|bezplatn\w*|darmow\w*)\b/)
      || normalized.match(/\b(?:gratis|bezplatn\w*|darmow\w*)\s+(?:pierwsze\s+)?(\d+(?:[.,]\d+)?)\s*(?:km|kilometrow?|kilometry)\b/);
    if (freeMatch) result.freeKm = number(String(freeMatch[1]).replace(',', '.'), 0);
  }

  if ((result.distanceRate === null || result.distanceRate === undefined) && result.distanceKm !== null && result.distanceKm !== undefined) {
    const rateMatch = normalized.match(/\bstawka\s*(?:wynosi|to|po|za)?\s*(\d+(?:[.,]\d+)?)\s*zl(?:\s*(?:za|\/)?\s*(?:km|kilometr\w*))?\b/);
    if (rateMatch) result.distanceRate = number(String(rateMatch[1]).replace(',', '.'), 0);
  }

  if (!finalQaHasRemotePreviewIntent(source)) {
    result.items = (result.items || []).filter(item => !/Uruchomienie podglądu zdalnego/i.test(String(item?.name || '')));
  }

  if (/\bkonfiguracj\w*\s+router\w*/.test(normalized)) {
    finalQaAddCatalogItem(result, 'Sieć / Wi‑Fi', 'Konfiguracja routera', 180, 'router_config_final_qa');
  }
  if (/\b(?:test|pomiar|optymalizacj)\w*.{0,25}\b(?:wi\s*-?\s*fi|wifi)\b/.test(normalized)) {
    finalQaAddCatalogItem(result, 'Sieć / Wi‑Fi', 'Test i optymalizacja Wi‑Fi', 140, 'wifi_test_final_qa');
  }

  finalQaDedupeSingleAntennaService(source, result);
  result.items = mergeParserItems(result.items || []);

  if (typeof installerV35MarkKinds === 'function') installerV35MarkKinds(result);
  if (typeof installerV35RefreshMissing === 'function') installerV35RefreshMissing(source, result);
  return result;
};
