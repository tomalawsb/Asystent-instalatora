'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'storage.js',
  'catalog.js',
  'quote.js',
  'parser-local.js',
  'parser-ai.js',
  'sync.js',
  'export.js',
  'ui.js',
  'state.js',
  'patches.js',
  'final-qa.js',
  'ai-runtime.js',
  'workflow.js'
];

const versionConfig = JSON.parse(fs.readFileSync(path.join(root, 'app-version.json'), 'utf8'));
if (!versionConfig.version) throw new Error('Brak version w app-version.json.');

const header = `/*\n * PLIK GENEROWANY — nie edytowac recznie.\n * Wersja: ${versionConfig.version}\n * Zrodla kodu: katalog js/.\n * Zrodla danych: app-version.json, cennik.json, material-prices.json.\n * Odbudowa: node tools/build-app-bundle.js\n */\n\n`;
const content = header + files
  .map(name => fs.readFileSync(path.join(root, 'js', name), 'utf8') + '\n')
  .join('');

fs.writeFileSync(path.join(root, 'app.js'), content, 'utf8');
console.log(`Odbudowano app.js z ${files.length} modulow. Wersja: ${versionConfig.version}`);
