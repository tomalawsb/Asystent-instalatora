'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = ["storage.js", "catalog.js", "quote.js", "parser-local.js", "parser-ai.js", "sync.js", "export.js", "ui.js", "state.js", "patches.js", "ai-runtime.js"];
const header = `/*\n * PLIK GENEROWANY — nie edytować ręcznie.\n * Źródła: katalog js/.\n * Odbudowa: node tools/build-app-bundle.js\n */\n\n`;
const content = header + files.map(name => fs.readFileSync(path.join(root, 'js', name), 'utf8') + '\n').join('');
fs.writeFileSync(path.join(root, 'app.js'), content, 'utf8');
console.log(`Odbudowano app.js z ${files.length} modułów.`);
