/*
 * Pomocnik Instalatora PWA — moduł: sync.js
 * Synchronizacja danych i obsługa Dropbox.
 * Plik wygenerowany podczas etapu 2 z ostatnich aktywnych definicji funkcji.
 */

function saveDropboxSettingsFromForm() {
  saveSettings(readSettingsFromForm());
  renderDropboxStatus();
  showDropboxStatus('Zapisano ustawienia Dropbox.');
}

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
  saveSettings(readSettingsFromForm());
  const settings = loadSettings();
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
    showDropboxStatus('Najpierw wybierz tryb Dropbox i zapisz ustawienia.', true);
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
  saveSettings(readSettingsFromForm());
  const settings = loadSettings();
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
    const updatedSettings = { ...settings, lastDropboxSyncAt: new Date().toISOString() };
    saveSettings(updatedSettings);
    renderSavedQuotes();
    renderCatalog();
    renderDropboxStatus();
    if (!silent) showDropboxStatus(`Synchronizacja zakończona. Aktywne wyceny: ${loadQuotes().length}. Rekordy z usuniętymi: ${loadQuoteRecords().length}.`);
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

