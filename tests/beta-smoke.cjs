(async function runPinProBetaSmoke() {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const assert = require('node:assert/strict');
  const html = fs.readFileSync('beta/index.html', 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'one inline app script');
  assert.doesNotMatch(html, /src="upgrade-v1\.3\.js"/);
  assert.equal((html.match(/<script\b/g) || []).length, 1, 'one-file architecture');
  const nodes = new Map();
  const db = new Map();
  let failing = false, downloadFile = null;
  function node(key) {
    if (nodes.has(key)) return nodes.get(key);
    const n = { innerHTML: '', textContent: '', value: '', style: {}, hidden: false,
      classList: { add() {}, remove() {}, contains() {return false;} },
      querySelector() { return null; },
      insertAdjacentHTML(_p,s) { this.innerHTML += s; },
      addEventListener(type,fn) { (this.listeners ||= []).push({type,fn}); },
      click() {this.clicks=(this.clicks||0)+1;}, remove() {}, appendChild() {} };
    nodes.set(key,n);return n;
  }
  const document = {
    documentElement: {lang:'en'}, title:'', body:node('body'),head:node('head'),
    querySelector:node,createElement:()=>node('new'+Math.random()),
    addEventListener() {}
  };
  const localStorage = {
    getItem(key) {return db.has(key)?db.get(key):null;},
    setItem(key,val) {if(failing)throw Error('QuotaExceededError');db.set(key,String(val));},
    removeItem(key) {db.delete(key);}
  };
  class TestFile {
    constructor(parts,name) {this.name=name;this.body=parts.join('');this.size=this.body.length;downloadFile=this;}
  }
  const URLMock = {createObjectURL:()=> 'blob:test',revokeObjectURL(){}};
  const ctx=vm.createContext({
    console,document,localStorage,Date,Math,File:TestFile,URL:URLMock,
    location:{hostname:'bzenny.github.io',pathname:'/pinpro/beta/',origin:'https://bzenny.github.io',protocol:'https:'},
    window:{addEventListener(){}},navigator:{language:'en',storage:{persist:()=>Promise.resolve(true)}},
    setTimeout(){return 1;},clearTimeout(){},scrollTo(){}
  });
  vm.runInContext(match[1],ctx,{filename:'beta/index.html',timeout:15000});
  const exec=code=>vm.runInContext(code,ctx);
  assert.equal(exec('APP_VERSION'),'1.5.0');
  assert.equal(exec('CHANNEL'),'beta');
  assert.match(document.title,/Pin\.Pro Beta/,'live document title on setup');
  assert.match(html,/<meta name="robots" content="noindex, nofollow">/,'beta not indexed');
  assert.match(html,/@media\(min-width:700px\)/,'tablet rail breakpoint');
  assert.match(html,/@media\(min-width:1100px\)/,'desktop grid breakpoint');
  assert.match(html,/@media\(max-width:360px\)/,'compact-phone breakpoint');
  assert.match(html,/env\(safe-area-inset-bottom\)/,'native safe-area inset');
  assert.match(html,/<div id="busy"/,'accessible shared loading overlay');
  assert.match(html,/<div id="app-error"/,'accessible error fallback');
  assert.doesNotMatch(html,/react-helmet|AppContext\.jsx|ErrorBoundary\.jsx/,'no unnecessary React dependencies');
  assert.equal(exec('typeof tabIcon'),'function','platform-neutral inline navigation icons');
  assert.match(exec("tabIcon('paninda')"),/<svg/);
  assert.equal(node('#file').listeners.filter(x=>x.type==='change').length,1,'one authoritative restore handler');
  // A thrown handler must show a localized, dismissible, non-destructive error.
  exec("runSafely(() => {throw new Error('simulated button failure');})");
  assert.equal(node('#app-error').hidden,false,'unexpected error is visible to owner');
  assert.match(node('#app-error').innerHTML,/Something went wrong/);
  exec('dismissUnexpected()');
  assert.equal(node('#app-error').hidden,true,'error panel dismisses');
  await exec(`withBusy('ui_save_progress', async () => {
    if ($('#busy').hidden) throw Error('spinner must be visible while operating');
    if ($('#busy-text').textContent !== t('ui_save_progress')) throw Error('wrong loading label');
  })`);
  assert.equal(node('#busy').hidden,true,'spinner cleared in finally');
  exec('ask = async () => true');
  exec("FORM.setup({name:'QA Store',openingCash:'1000'})");
  assert.ok(db.has('pinpro.beta.v1'),'beta store saved in separate namespace');
  assert.match(exec('viewHome()'),/overview-layout/,'home separates dashboard and supporting panels');
  assert.match(node('#tabs').innerHTML,/<svg/,'bottom/side navigation uses crisp icons');
  assert.ok(!node('#tabs').innerHTML.includes('</button>;'),'tabs joined without stray separators');
  exec("ACT.tab('paninda')");
  assert.match(document.title,/Stock|Baligya|Paninda/,'tab title follows current screen');
  exec("ACT.tab('home')");
  assert.match(document.title,/Overview|Sumaryo|Buod/,'home page title follows current screen');
  await exec("FORM.item({name:'Rice',cost:'10',price:'15',stock:'5',low:'2',packSize:'1'},null)");
  await exec("FORM.sold({qty:'2',price:'15'},D.items[0].id)");
  assert.equal(exec('D.items[0].stock'),3);
  assert.equal(exec('cashOnHand()'),1030);
  await exec("FORM.sold({qty:'5',price:'15'},D.items[0].id)");
  assert.equal(exec('D.items[0].stock'),-2,'seller can confirm low-stock sale');
  assert.equal(exec('cashOnHand()'),1105);
  exec("FORM.cust({name:'Maria',phone:'',email:'',limit:'500'},null)");
  await exec("FORM.utang({cid:D.customers[0].id,amount:'15',itemId:D.items[0].id,qty:'1'})");
  assert.equal(exec('D.items[0].stock'),-3,'utang can proceed after warning');
  assert.equal(exec('balanceOf(D.customers[0].id)'),15);
  assert.equal(exec('cashOnHand()'),1105,'utang does not increase drawer cash');
  await exec("FORM.bayad({cid:D.customers[0].id,amount:'15',note:''})");
  assert.equal(exec('balanceOf(D.customers[0].id)'),0);
  assert.equal(exec('cashOnHand()'),1120);
  await exec("FORM.bayad({cid:D.customers[0].id,amount:'1',note:''})");
  assert.equal(exec('balanceOf(D.customers[0].id)'),0,'overpayment refused');
  const beforeExternal=exec('cashOnHand()');
  await exec("FORM.restock({packs:'1',pcs:'10',packCost:'100',fromOwn:'on'},D.items[0].id)");
  assert.equal(exec('D.items[0].stock'),7);
  assert.equal(exec('cashOnHand()'),beforeExternal,'personal restock leaves drawer unchanged');
  assert.equal(exec("D.cash.filter(x=>x.cat==='dagdag').length"),1,'capital funding entry created');
  assert.equal(exec('D.items[0].cost'),10);
  await exec("FORM.restock({packs:'1',pcs:'2',packCost:'60'},D.items[0].id)");
  assert.equal(exec('D.items[0].stock'),9);
  assert.equal(exec('D.items[0].cost'),14.44,'weighted-average inventory cost');
  assert.equal(exec('cashOnHand()'),beforeExternal-60);
  await exec("ACT.delCash(D.cash.findLast(x=>x.cat==='paninda').id)");
  assert.equal(exec('D.items[0].stock'),7,'undo restores stock');
  assert.equal(exec('D.items[0].cost'),10,'undo restores average cost');
  assert.equal(exec('cashOnHand()'),beforeExternal,'undo restores drawer cash');
  await exec("FORM.cash({cat:'gastos',amount:'200',note:'Delivery',date:today(),fromOwn:'on'})");
  assert.equal(exec('cashOnHand()'),beforeExternal,'personal expense leaves drawer unchanged');
  assert.equal(exec("D.cash.filter(x=>x.cat==='dagdag').length"),2);
  await exec("ACT.delCash(D.cash.findLast(x=>x.cat==='gastos').fundedBy)");
  assert.equal(exec('cashOnHand()'),beforeExternal,'deleting funding removes the linked expense');
  assert.equal(exec("D.cash.filter(x=>x.cat==='dagdag').length"),1);
  // A second personally funded restock can be reversed as one linked transaction.
  await exec("FORM.restock({packs:'1',pcs:'1',packCost:'30',fromOwn:'on'},D.items[0].id)");
  assert.equal(exec('D.items[0].stock'),8);
  assert.equal(exec('cashOnHand()'),beforeExternal);
  await exec("ACT.delCash(D.cash.findLast(x=>x.cat==='paninda').fundedBy)");
  assert.equal(exec('D.items[0].stock'),7,'personal restock undo reverses stock');
  assert.equal(exec('cashOnHand()'),beforeExternal,'personal restock undo reverses paired funding');
  await exec("FORM.restock({packs:'1',pcs:'3',packCost:'5000'},D.items[0].id)");
  assert.equal(exec('D.items[0].stock'),10,'insufficient drawer cash offers own-money route');
  assert.equal(exec('cashOnHand()'),beforeExternal,'auto own-funds route leaves drawer unchanged');
  await exec("ACT.delCash(D.cash.findLast(x=>x.cat==='paninda').id)");
  assert.equal(exec('D.items[0].stock'),7);
  // Failed write rolls the entire in-memory sale back.
  failing=true;
  await exec("FORM.sold({qty:'1',price:'15'},D.items[0].id)");
  assert.equal(exec('D.items[0].stock'),7);
  assert.equal(exec('cashOnHand()'),beforeExternal);
  assert.ok(node('#app').innerHTML,'last saved view still rendered after failed storage write');
  failing=false;
  assert.match(exec('viewHome()'), /data-act="backup"/);
  assert.equal((exec('viewHome()').match(/data-act="backup"/g)||[]).length,1,'one home reminder');
  await exec('doBackup()');
  assert.ok(downloadFile&&downloadFile.body.includes('"items"'),'JSON backup downloaded');
  assert.equal(exec('D.store.lastBackup.length'),10,'backup requested date recorded');
  assert.equal((exec('viewHome()').match(/data-act="backup"/g)||[]).length,0,'weekly reminder cleared');
  const fileInput=node('#file');
  const handler=fileInput.listeners[0].fn;
  const saved=downloadFile.body;
  exec("selectBackup('restore')");
  await handler({target:{files:[{size:50,text:async()=> '{"items":[]}'}],value:''}});
  assert.equal(exec('D.items[0].stock'),7,'malformed backup refused');
  const attack=JSON.parse(saved);
  attack.items[0].id='bad"><img onerror=alert(1)>';
  await handler({target:{files:[{size:500,text:async()=>JSON.stringify(attack)}],value:''}});
  assert.equal(exec('D.items[0].stock'),7,'malicious backup refused');
  exec("selectBackup('verify')");
  await handler({target:{files:[{size:saved.length,text:async()=>saved}],value:''}});
  assert.equal(exec('D.store.lastBackupChecked.length'),10,'optional file verification recorded');
  // No return of reminder after any new sale until the seven-day interval.
  await exec("FORM.sold({qty:'1',price:'15'},D.items[0].id)");
  assert.equal((exec('viewHome()').match(/data-act="backup"/g)||[]).length,0);
  await exec("ACT.delCust(D.customers[0].id)");
  assert.equal(exec('D.customers[0].archived'),true);
  assert.equal(exec('D.ledger.length'),2,'archived customer history preserved');
  exec("ACT.lang('ceb')");
  exec('ACT.rules()');
  assert.match(node('#sheet').innerHTML,/Mga lagda sa kwarta/);
  exec('ACT.storage()');
  assert.match(node('#sheet').innerHTML,/Pagtipig ug pagbawi/);
  await exec("FORM.item({name:'Sardines',cost:'2',price:'4',stock:'0',low:'1',packSize:'1'},null)");
  const spare=exec('D.items[1].id');
  await exec("FORM.sold({qty:'1',price:'4'},D.items[1].id)");
  exec("FORM.count({count:'0'},D.items[1].id)");
  await exec("ACT.delItem(D.items[1].id)");
  assert.equal(exec('D.items[1].archived'),true,'used item archived with history retained');
  assert.equal(exec("D.cash.some(x=>x.itemId===D.items[1].id)"),true);
  exec("ACT.unarchiveItem(D.items[1].id)");
  assert.equal(exec('D.items[1].archived'),false);
  exec("ACT.lang('tl')");
  exec('ACT.rules()');
  assert.match(node('#sheet').innerHTML,/Mga tuntunin sa pera/);
  const sw=fs.readFileSync('beta/sw.js','utf8');
  assert.match(sw,/const VERSION = '1\.5\.0'/);
  assert.doesNotMatch(sw,/upgrade-v1\.3\.js/);
  assert.match(sw,/'\.\/index\.html'/);
  console.log('PASS beta 1.5: responsive shell, native navigation, safe errors, progress, titles, cash/credit, funded purchases, weekly backup, archives, offline caching');
})().catch(err=>{console.error(err);process.exitCode=1;});
