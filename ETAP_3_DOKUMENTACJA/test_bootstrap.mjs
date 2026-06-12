import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import cryptoModule from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const listeners = new Map();
const loadedScripts = [];

function noop() {}
function makeElement(id = '') {
  return {
    id,
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    hidden: false,
    style: {},
    dataset: {},
    files: [],
    selectionStart: 0,
    selectionEnd: 0,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop,
    removeEventListener: noop,
    appendChild: noop,
    prepend: noop,
    remove: noop,
    click: noop,
    focus: noop,
    setSelectionRange: noop,
    setAttribute: noop,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

const elements = new Map([
  ['appVersionBadge', makeElement('appVersionBadge')],
  ['appVersionFooter', makeElement('appVersionFooter')]
]);

const documentMock = {
  title: '',
  body: makeElement('body'),
  documentElement: makeElement('html'),
  head: {
    appendChild(script) {
      try {
        const scriptPath = fileURLToPath(script.src);
        const code = fs.readFileSync(scriptPath, 'utf8');
        loadedScripts.push(path.relative(root, scriptPath).replaceAll('\\', '/'));
        vm.runInThisContext(code, { filename: scriptPath });
        queueMicrotask(() => script.onload?.());
      } catch (error) {
        queueMicrotask(() => script.onerror?.(error));
      }
    }
  },
  addEventListener(type, callback) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(callback);
  },
  removeEventListener: noop,
  dispatchEvent(event) {
    for (const callback of listeners.get(event.type) || []) callback(event);
  },
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  },
  querySelector(selector) {
    if (selector === 'main') return makeElement('main');
    return null;
  },
  querySelectorAll: () => [],
  createElement(tag) {
    if (tag === 'script') return { src: '', async: true, onload: null, onerror: null };
    return makeElement(tag);
  }
};

const storage = new Map();
const localStorageMock = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear()
};

const globals = {
  window: globalThis,
  document: documentMock,
  localStorage: localStorageMock,
  navigator: {},
  location: { protocol: 'https:', reload: noop },
  crypto: cryptoModule.webcrypto,
  confirm: () => true,
  alert: noop,
  CustomEvent: class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
};
for (const [name, value] of Object.entries(globals)) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

window.addEventListener = (type, callback) => {
  if (!listeners.has(`window:${type}`)) listeners.set(`window:${type}`, []);
  listeners.get(`window:${type}`).push(callback);
};
window.removeEventListener = noop;
window.dispatchEvent = event => {
  for (const callback of listeners.get(`window:${event.type}`) || []) callback(event);
};
window.matchMedia = () => ({ matches: false, addEventListener: noop });
window.print = noop;
window.open = () => null;

const nativeFetch = globalThis.fetch;
globalThis.fetch = async input => {
  const url = input instanceof URL ? input : new URL(String(input));
  if (url.protocol !== 'file:') return nativeFetch(input);
  try {
    const file = fileURLToPath(url);
    const text = fs.readFileSync(file, 'utf8');
    return {
      ok: true,
      status: 200,
      async json() { return JSON.parse(text); },
      async text() { return text; }
    };
  } catch {
    return { ok: false, status: 404, async json() { throw new Error('404'); } };
  }
};

await import(path.join(root, 'js/bootstrap.js'));

const expectedScripts = [
  'js/storage.js','js/catalog.js','js/quote.js','js/parser-local.js','js/parser-ai.js',
  'js/sync.js','js/export.js','js/ui.js','js/state.js','js/patches.js','js/ai-runtime.js'
];

const result = {
  ready: window.APP_BOOTSTRAP_READY === true,
  version: window.APP_VERSION,
  badge: elements.get('appVersionBadge').textContent,
  footer: elements.get('appVersionFooter').textContent,
  title: document.title,
  catalogCategories: Object.keys(window.PRICE_CATALOG || {}).length,
  materialItems: window.MATERIAL_PRICE_DB?.items?.length || 0,
  loadedScripts,
  expectedScripts,
  scriptsMatch: JSON.stringify(loadedScripts) === JSON.stringify(expectedScripts)
};

console.log(JSON.stringify(result, null, 2));
if (!result.ready || !result.version || !result.scriptsMatch || result.catalogCategories < 1 || result.materialItems < 1) {
  process.exitCode = 1;
}
