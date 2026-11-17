(async function runPinProBetaSmoke() {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const assert = require('node:assert/strict');
  const html = fs.readFileSync('beta/index.html', 'utf8');
  const addon = fs.readFileSync('beta/upgrade-v1.3.js', 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'inline app script exists');
  assert.match(html, /<script src="upgrade-v1\.3\.js"><\/script>/);
  const db = new Map();
  let saveFail = false;
  const nodes = new Map();
  function node(key) {
    if (nodes.has(key)) return nodes.get(key);
    const n = { innerHTML: '', textContent: '', value: '', style: {}, hidden: false,
      classList: { add() {}, remove() {} },
      querySelector() { return null; },
      insertAdjacentHTML(_position, s) { this.innerHTML += s; },
      addEventListener(type, fn, options) { (this.listeners ||= []).push({ type, fn, options }); },
      click() {}, remove() {}, appendChild() {} };
    nodes.set(key, n);
    return n;
  }
  const document = {
    documentElement: { lang: 'en' }, body: node('body'), head: node('head'),
    querySelector: node, createElement: () => node('created-' + Math.random()),
    addEventListener() {}
  };
  const localStorage = {
    getItem(k) { return db.has(k) ? db.get(k) : null; },
    setItem(k, v) { if (saveFail) throw Error('QuotaExceededError'); db.set(k, String(v)); },
    removeItem(k) { db.delete(k); }
  };
  const ctx = vm.createContext({
    document, localStorage, console, Date, Math,
    location: { hostname: 'bzenny.github.io', pathname: '/pinpro/beta/', protocol: 'https:', origin: 'https://bzenny.github.io' },
    window: { addEventListener() {} },
    navigator: { language: 'en', storage: { persist: () => Promise.resolve(true) } },
    setTimeout() { return 1; }, clearTimeout() {}, scrollTo() {}, URL,
    File: class MockFile {}
  });
  vm.runInContext(match[1], ctx, { filename: 'beta/index.html' });
  vm.runInContext(addon, ctx, { filename: 'beta/upgrade-v1.3.js' });
  const exec = expr => vm.runInContext(expr, ctx);
  const get = expr => exec(expr);
  assert.equal(get('APP_VERSION'), '1.3.0');
  assert.equal(get('CHANNEL'), 'beta');
  exec("FORM.setup({name:'QA Store',openingCash:'1000'})");
  assert.ok(db.has('pinpro.beta.v1'), 'beta data saved separately');
  exec("FORM.item({name:'Rice',cost:'10',price:'15',stock:'5',low:'2',packSize:'1'},null)");
  assert.equal(get('D.items.length'), 1);
  const itemId = get('D.items[0].id');
  exec("FORM.sold({qty:'2',price:'15'},D.items[0].id)");
  assert.equal(get('D.items[0].stock'), 3);
  assert.equal(get('cashOnHand()'), 1030);
  exec("FORM.sold({qty:'5',price:'15'},D.items[0].id)");
  assert.equal(get('D.items[0].stock'), 3, 'overselling blocked');
  exec("FORM.cust({name:'Maria',phone:'',email:'',limit:'100'},null)");
  await exec("FORM.utang({cid:D.customers[0].id,amount:'15',itemId:D.items[0].id,qty:'1'})");
  assert.equal(get('D.items[0].stock'), 2);
  assert.equal(get('balanceOf(D.customers[0].id)'), 15);
  assert.equal(get('cashOnHand()'), 1030, 'utang does not move cash');
  await exec("FORM.utang({cid:D.customers[0].id,amount:'75',itemId:D.items[0].id,qty:'5'})");
  assert.equal(get('D.ledger.length'), 1, 'utang cannot oversell');
  exec("FORM.bayad({cid:D.customers[0].id,amount:'18',note:''})");
  assert.equal(get('D.ledger.length'), 1, 'overpayment blocked');
  exec("FORM.bayad({cid:D.customers[0].id,amount:'15',note:''})");
  assert.equal(get('balanceOf(D.customers[0].id)'), 0);
  assert.equal(get('cashOnHand()'), 1045);
  exec("FORM.restock({packs:'1',pcs:'2',packCost:'60'},D.items[0].id)");
  assert.equal(get('D.items[0].stock'), 4);
  assert.equal(get('D.items[0].cost'), 20, 'weighted-average inventory cost');
  assert.equal(get('cashOnHand()'), 985);
  // Simulate a storage failure: the change must be rolled back.
  saveFail = true;
  exec("FORM.sold({qty:'1',price:'15'},D.items[0].id)");
  assert.equal(get('D.items[0].stock'), 4, 'rollback after failed browser save');
  assert.equal(get('cashOnHand()'), 985);
  saveFail = false;
  const original = get('JSON.stringify(D)');
  const fileInput = node('#file');
  const handler = fileInput.listeners.find(x => x.type === 'change' && x.options === true);
  assert.ok(handler, 'strict backup handler installed');
  exec('ACT.restore()');
  await handler.fn({
    stopImmediatePropagation() {},
    target: { files: [{ size: 50, text: async () => '{"items":[]}' }], value: '' }
  });
  assert.equal(get('JSON.stringify(D)'), original, 'malformed backup rejected');
  exec('ACT.verify()');
  await handler.fn({
    stopImmediatePropagation() {},
    target: { files: [{ size: original.length, text: async () => original }], value: '' }
  });
  assert.equal(get('D.store.lastBackup.length'), 10, 'verified backup marked');
  // Preserve a settled customer's history via archive.
  exec('ask = async () => true');
  await exec('ACT.delCust(D.customers[0].id)');
  assert.equal(get('D.customers[0].archived'), true);
  assert.equal(get('D.ledger.length'), 2);
  exec('ACT.rules()');
  assert.match(node('#sheet .sheet-card').innerHTML, /Explore Finance Rules/);
  exec('ACT.storage()');
  assert.match(node('#sheet .sheet-card').innerHTML, /Device storage/);
  const sw = fs.readFileSync('beta/sw.js', 'utf8');
  assert.match(sw, /const VERSION = '1\.3\.0'/);
  assert.match(sw, /upgrade-v1\.3\.js/);
  console.log('Pin.Pro beta smoke tests passed: accounting, rollback, backup, archive, settings, offline cache.');
})().catch(err=>{ console.error(err); process.exitCode=1; });
