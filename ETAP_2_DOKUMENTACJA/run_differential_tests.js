'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const ORIGINAL = process.argv[2];
if (!ORIGINAL) {
  console.error('Użycie: node ETAP_2_DOKUMENTACJA/run_differential_tests.js <ścieżka-do-app.js-z-etapu-1>');
  process.exit(2);
}

function element() {
  const noop = () => {};
  return { addEventListener: noop, removeEventListener: noop, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, appendChild: noop, remove: noop, click: noop, focus: noop, setSelectionRange: noop, querySelector: () => null, querySelectorAll: () => [], style: {}, dataset: {}, hidden: false, value: '', checked: false, textContent: '', innerHTML: '', files: [], selectionStart: 0, selectionEnd: 0 };
}
function contextFor(code, filename) {
  const storage = new Map(); const noop = () => {};
  const context = {
    console,
    localStorage: { getItem:k=>storage.has(k)?storage.get(k):null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k), clear:()=>storage.clear() },
    document: { addEventListener:noop, removeEventListener:noop, querySelectorAll:()=>[], querySelector:()=>null, getElementById:()=>element(), createElement:()=>element(), body:element(), documentElement:element() },
    window: { addEventListener:noop, removeEventListener:noop, matchMedia:()=>({matches:false,addEventListener:noop}), print:noop, open:()=>null, setTimeout, clearTimeout },
    navigator:{}, location:{protocol:'file:',reload:noop}, crypto:crypto.webcrypto, structuredClone:global.structuredClone,
    Blob:global.Blob, URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:noop}, fetch:async()=>{throw new Error('network disabled')},
    confirm:()=>true, alert:noop, setTimeout, clearTimeout, TextEncoder, TextDecoder
  };
  context.globalThis=context; vm.createContext(context); vm.runInContext(code, context, {filename}); return context;
}
function call(ctx, expr) { return JSON.parse(vm.runInContext(`JSON.stringify(${expr})`,ctx)); }
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const out={};
    for (const [k,v] of Object.entries(value)) {
      if (['id','deviceId','updatedAt','deletedAt'].includes(k)) continue;
      out[k]=normalize(v);
    }
    return out;
  }
  return value;
}
const originalCode=fs.readFileSync(ORIGINAL,'utf8');
const refactoredCode=fs.readFileSync(path.join(ROOT,'app.js'),'utf8');
const oldCtx=contextFor(originalCode,'original-app.js');
const newCtx=contextFor(refactoredCode,'refactored-app.js');
const fixtures=JSON.parse(fs.readFileSync(path.join(ROOT,'ETAP_1_TESTY','fixtures','parser_cases.json'),'utf8'));
const cases=[];
for (const f of fixtures) cases.push({name:`parser:${f.id}`,expr:`parseSmartCommand(${JSON.stringify(f.text)})`});
cases.push(
  {name:'calculateTotals',expr:`calculateTotals({services:[{quantity:2,priceNet:100}],distanceKm:50,freeKm:20,distanceRate:2})`},
  {name:'mergeCatalogs',expr:`mergeCatalogs({'A':[{'name':'X','unit':'szt','price_net':10}]},{'A':[{'name':'X','unit':'szt','price_net':20},{'name':'Y','unit':'szt','price_net':5}]})`},
  {name:'buildClientSms',expr:`buildClientSms({clientName:'Jan',clientPhone:'',clientAddress:'Mielec',visitDate:'2026-06-15',jobType:'Kamery CCTV',notes:'',distanceKm:40,distanceRate:2,freeKm:20,services:[{name:'Montaż kamery',unit:'szt',quantity:2,priceNet:100}]})`},
  {name:'buildReport',expr:`buildReport({clientName:'Jan',clientPhone:'',clientAddress:'Mielec',visitDate:'2026-06-15',jobType:'Kamery CCTV',notes:'',distanceKm:40,distanceRate:2,freeKm:20,services:[{name:'Montaż kamery',unit:'szt',quantity:2,priceNet:100}]})`}
);
let failed=0; const results=[];
for (const test of cases) {
  try {
    const before=normalize(call(oldCtx,test.expr)); const after=normalize(call(newCtx,test.expr));
    const equal=JSON.stringify(before)===JSON.stringify(after);
    results.push({name:test.name,status:equal?'PASS':'FAIL'}); if(!equal) failed++;
  } catch(error) { results.push({name:test.name,status:'ERROR',details:error.message}); failed++; }
}
const report={generatedAt:new Date().toISOString(),original:ORIGINAL,summary:{pass:results.filter(x=>x.status==='PASS').length,fail:failed},results};
fs.writeFileSync(path.join(__dirname,'differential-results.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(__dirname,'differential-results.md'),`# Test różnicowy etapu 2\n\n- Zgodne: **${report.summary.pass}**\n- Różnice: **${report.summary.fail}**\n\n`+results.map(x=>`- ${x.status}: ${x.name}${x.details?` — ${x.details}`:''}`).join('\n')+'\n');
console.log(`PASS: ${report.summary.pass} | FAIL: ${report.summary.fail}`);
process.exit(failed?1:0);
