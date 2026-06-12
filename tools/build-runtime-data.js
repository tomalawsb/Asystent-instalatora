'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const config = readJson('app-version.json');
const catalog = readJson('cennik.json');
const materials = readJson('material-prices.json');

if (!config?.version || !config?.build) throw new Error('app-version.json nie zawiera version/build.');
if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) throw new Error('Niepoprawny cennik.json.');
if (!materials || typeof materials !== 'object' || !Array.isArray(materials.items)) throw new Error('Niepoprawny material-prices.json.');

const output = `/*\n * PLIK GENEROWANY — nie edytowac recznie.\n * Zrodla: app-version.json, cennik.json, material-prices.json.\n * Odbudowa: node tools/build-runtime-data.js\n */\n(function () {\n  'use strict';\n  window.APP_CONFIG = Object.freeze(${JSON.stringify(config)});\n  window.APP_VERSION = String(window.APP_CONFIG.version);\n  window.PRICE_CATALOG = ${JSON.stringify(catalog)};\n  window.MATERIAL_PRICE_DB = ${JSON.stringify(materials)};\n\n  document.title = String(window.APP_CONFIG.name || 'Pomocnik Instalatora PWA') + ' ' + window.APP_VERSION;\n  const applyVersion = () => {\n    const badge = document.getElementById('appVersionBadge');\n    if (badge) badge.textContent = 'Wersja ' + window.APP_VERSION;\n    const footer = document.getElementById('appVersionFooter');\n    if (footer) footer.textContent = 'Wersja programu: ' + window.APP_VERSION;\n  };\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyVersion, { once: true });\n  else applyVersion();\n}());\n`;

fs.writeFileSync(path.join(root, 'runtime-data.js'), output, 'utf8');
console.log(`Odbudowano runtime-data.js. Wersja: ${config.version}`);
