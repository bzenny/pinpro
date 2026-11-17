(function installPinProBeta13() {
  'use strict';
  // This enhancement is beta-only. The official 1.2 app is untouched.
  const L = {
    storage: ['Device storage & recovery', 'Storage ug pag-uli sa datos', 'Storage at pagbawi ng datos'],
    rules: ['Explore Finance Rules', 'Susihon ang lagda sa kwarta', 'Alamin ang tuntunin sa pera'],
    verify: ['Verify saved backup', 'Susihon ang backup', 'Suriin ang backup'],
    download: ['Save backup to device', 'I-save ang backup sa device', 'I-save ang backup sa device'],
    restore: ['Restore from file', 'Ibalik gikan sa file', 'Ibalik mula sa file'],
    share: ['Share backup file', 'I-share ang backup file', 'I-share ang backup file'],
    storageInfo: [
      'Your working records are saved automatically in this browser on this device, not in a visible folder. Clearing browser data, changing browsers or uninstalling can remove them. GitHub does not receive your store records. No automatic cloud sync.',
      'Ang datos awtomatikong gitipigan sa browser niini nga device, dili sa makita nga folder. Mahimong mawala kini kon papason ang browser data o tangtangon ang app. Walay awtomatikong cloud sync.',
      'Awtomatikong nasa browser ng device na ito ang datos, hindi sa nakikitang folder. Maaari itong mawala kapag binura ang browser data o inalis ang app. Walang awtomatikong cloud sync.'
    ],
    fileInfo: [
      'Save a JSON backup to Files/Downloads or a folder you choose. Keep a second copy in a safe location. Use Verify to reopen the saved file; only then is it marked as verified. Backups contain customer contact details.',
      'I-save ang JSON file sa Files/Downloads o napiling folder. Pagtipig ug ikaduhang kopya. Gamita ang Verify aron ablihan pag-usab ang file. Adunay impormasyon sa kustomer ang backup.',
      'I-save ang JSON file sa Files/Downloads o napiling folder. Magtago ng ikalawang kopya. Gamitin ang Verify para buksan muli ang file. May impormasyon ng customer ang backup.'
    ],
    lastVerified: ['Last verified backup', 'Kataposang nasusi nga backup', 'Huling nasuring backup'],
    notVerified: ['Not yet verified', 'Wala pa masusi', 'Hindi pa nasusuri'],
    cashOnly: [
      'This beta tracks physical store cash only. Do not record bank/GCash payments as cash until those funds actually enter the store cash drawer. A separate digital-wallet ledger is planned, not yet supported.',
      'Pisikal nga kwarta lang sa tindahan ang gisubay niining beta. Ayaw irekord ang GCash/bank isip cash hangtod masulod sa cash drawer.',
      'Pisikal na perang nasa kaha lamang ang sinusubaybayan ng beta. Huwag itala ang GCash/bank bilang cash hanggang nasa kaha na.'
    ],
    funding: ['Paid from store cash', 'Gibayran sa kwarta sa tindahan', 'Binayaran mula sa kaha'],
    corrupted: [
      'Stored records could not be read. The app will not replace them automatically. Restore a verified backup or use the two-step reset.',
      'Dili mabasa ang gitipig nga datos. Dili kini awtomatikong pulihan. Ibalik ang backup o i-reset.',
      'Hindi mabasa ang nakaimbak na datos. Hindi ito awtomatikong papalitan. Ibalik ang backup o i-reset.'
    ]
  };
  const say = key => (L[key] || [key])[LI[lang]] || (L[key] || [key])[0];
  const notice = message => toast(message);
  const storedRaw = (() => { try { return localStorage.getItem(KEY); } catch (_) { return null; } })();
  let storageCorrupt = !!storedRaw && !D;
  let savedSnapshot = D ? JSON.stringify(D) : null;
  let lastStorageRaw = storedRaw;
  const baseSave = Store.save.bind(Store);
  const baseWipe = ACT.wipe;
  let pickerMode = 'restore';

  function persistOrRollback() {
    try {
      if (localStorage.getItem(KEY) !== lastStorageRaw) {
        D = savedSnapshot ? JSON.parse(savedSnapshot) : null;
        notice('This store changed in another tab. Reload the app to avoid overwriting newer transactions.');
        return false;
      }
    } catch (_) {
      D = savedSnapshot ? JSON.parse(savedSnapshot) : null;
      notice('Device storage is unavailable. No changes were recorded.');
      return false;
    }
    if (baseSave(D)) {
      savedSnapshot = JSON.stringify(D);
      lastStorageRaw = localStorage.getItem(KEY);
      return true;
    }
    D = savedSnapshot ? JSON.parse(savedSnapshot) : null;
    notice('Save failed. No changes were recorded. Free device space or export a backup.');
    return false;
  }

  commit = function () {
    if (!persistOrRollback()) { render(); return false; }
    closeSheet(); render(); return true;
  };
  FORM.setup = function (fd) {
    if (storageCorrupt) return notice(say('corrupted'));
    D = blankData();
    D.store.name = (fd.name || '').trim();
    D.store.openingCash = r2(num(fd.openingCash));
    if (!D.store.name || D.store.openingCash < 0) { D = null; return notice('Enter a store name and valid opening cash.'); }
    if (persistOrRollback()) { render(); notice(t('t_ready')); } else render();
  };
  ACT.sample = () => {
    if (storageCorrupt) return notice(say('corrupted'));
    D = sampleData();
    D.store.capital = Math.floor(totalNow() / 1000) * 1000;
    if (persistOrRollback()) notice(t('t_sample'));
    render();
  };
  ACT.setCapital = () => {
    D.store.capital = totalNow();
    if (commit()) notice(t('t_cap_set'));
  };
  ACT.wipe = async () => {
    if (!(await ask(t('a_wipe1'))) || !(await ask(t('a_wipe2')))) return;
    try {
      Store.clear();
      if (localStorage.getItem(KEY) !== null) throw new Error('Still present');
      savedSnapshot = null; lastStorageRaw = null; storageCorrupt = false; D = null;
      Object.assign(state, { tab: 'home', cust: null, q: '' });
      closeSheet(); render();
    } catch (_) { notice('Reset failed: device storage is unavailable.'); }
  };

  const originalSetup = viewSetup;
  viewSetup = function () {
    if (!storageCorrupt) return originalSetup();
    return '<div class="card"><h2>⚠️ Recovery required</h2><p>' + esc(say('corrupted')) +
      '</p><button class="btn primary" data-act="restore">' + esc(say('restore')) +
      '</button><button class="btn ghost" data-act="storage">' + esc(say('storage')) +
      '</button><button class="btn ghost danger" data-act="wipe">' + esc(t('wipe_btn')) + '</button></div>';
  };

  function validateFile(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Not a Pin.Pro record');
    if (!obj.store || typeof obj.store !== 'object' || Array.isArray(obj.store)) throw new Error('Missing store');
    for (const key of ['items', 'customers', 'ledger', 'cash']) {
      if (!Array.isArray(obj[key])) throw new Error('Missing ' + key + ' records');
      if (obj[key].length > 150000) throw new Error('Too many records');
      const ids = new Set();
      for (const x of obj[key]) {
        if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !x.id ||
            ids.has(x.id)) throw new Error('Invalid or duplicate ID in ' + key);
        ids.add(x.id);
      }
    }
    const finite = v => typeof v === 'number' && Number.isFinite(v);
    for (const i of obj.items) {
      if (typeof i.name !== 'string' || !finite(i.cost) || i.cost < 0 ||
          !finite(i.price) || i.price < 0 || !finite(i.stock)) throw new Error('Invalid inventory item');
    }
    for (const c of obj.customers) if (typeof c.name !== 'string') throw new Error('Invalid customer');
    const customers = new Set(obj.customers.map(x => x.id));
    const dateOK = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
    for (const e of obj.ledger) {
      if (!customers.has(e.customerId) || !['utang', 'bayad'].includes(e.type) ||
          !finite(e.amount) || e.amount <= 0 || !dateOK(e.date)) throw new Error('Invalid customer ledger');
    }
    for (const c of obj.cash) {
      if (!CATS[c.cat] || !finite(c.amount) || c.amount < 0 || !dateOK(c.date))
        throw new Error('Invalid cash entry');
    }
    return true;
  }

  function comparable(d) {
    const { lastBackup, lastBackupVerified, ...store } = d.store || {};
    return JSON.stringify({ store, items: d.items, customers: d.customers,
      ledger: d.ledger, cash: d.cash, adjustments: d.adjustments || [] });
  }

  async function handleFile(e) {
    // Capture handler intentionally supersedes the old, lenient restore listener.
    e.stopImmediatePropagation();
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      if (f.size > 10 * 1024 * 1024) throw new Error('Backup is too large');
      const obj = JSON.parse(await f.text());
      validateFile(obj);
      if (pickerMode === 'verify') {
        if (!D) throw new Error('No working store available for comparison');
        if (comparable(obj) !== comparable(D))
          throw new Error('The saved file differs from current data. Make a new backup and verify it before more transactions.');
        D.store.lastBackup = today();
        D.store.lastBackupVerified = true;
        if (commit()) notice('Backup verified. Keep the file in a safe location.');
      } else {
        if (D && !(await ask(t('a_restore')))) return;
        D = migrate(obj);
        if (!D) throw new Error('Invalid backup');
        if (!persistOrRollback()) return render();
        storageCorrupt = false;
        state.tab = 'home'; state.cust = null;
        closeSheet(); render();
        notice(t('t_restored'));
      }
    } catch (err) { notice('Backup rejected: ' + (err.message || 'Invalid JSON')); }
  }
  $('#file').addEventListener('change', handleFile, true);
  function openPicker(mode) { pickerMode = mode; $('#file').click(); }
  ACT.restore = () => openPicker('restore');
  ACT.verify = () => openPicker('verify');

  function makeBackup() {
    const name = 'pinpro-beta-' + today() + '.json';
    return { name, file: new File([JSON.stringify(D, null, 2)], name, { type: 'application/json' }) };
  }
  doBackup = async function () {
    if (!D) return notice('Set up or restore a store before saving a backup.');
    const { name, file } = makeBackup();
    try {
      if (typeof window.showSaveFilePicker === 'function') {
        const handle = await window.showSaveFilePicker({
          suggestedName: name, types: [{ description: 'Pin.Pro backup', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(file); await writable.close();
        notice('Backup saved to your chosen folder. Open Verify to confirm its contents.');
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        notice('Download started. Find the file in Files/Downloads, then choose Verify backup.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') notice('Backup was not saved: ' + err.message);
    }
  };
  ACT.backup = doBackup;
  ACT.shareBackup = async () => {
    if (!D) return notice('No store data to share.');
    try {
      const { file } = makeBackup();
      if (!navigator.canShare || !navigator.canShare({ files: [file] }))
        return notice('Sharing files is unavailable here. Use Save backup to device.');
      await navigator.share({ files: [file], title: file.name });
      notice('File handed to the share menu. Verify any saved copy before relying on it.');
    } catch (err) {
      if (err.name !== 'AbortError') notice('Share failed: ' + err.message);
    }
  };

  function sheetStorage() {
    const last = D && D.store.lastBackupVerified && D.store.lastBackup ? esc(D.store.lastBackup) : say('notVerified');
    openSheet('<h2>📁 ' + esc(say('storage')) + '</h2>' +
      '<p class="hint">' + esc(say('storageInfo')) + '</p>' +
      '<section class="card"><b>Working storage</b><p class="muted small">Browser: ' +
      esc(location.hostname + location.pathname) + '<br>Private data key: ' + esc(KEY) +
      '<br>Approximate stored size: ' + (Store.size() / 1024).toFixed(1) + ' KB</p></section>' +
      '<p class="hint">' + esc(say('fileInfo')) + '</p><p><b>' +
      esc(say('lastVerified')) + ': </b>' + last + '</p>' +
      '<button class="btn primary" data-act="backup">' + esc(say('download')) + '</button>' +
      '<button class="btn" data-act="verify">' + esc(say('verify')) + '</button>' +
      '<button class="btn" data-act="restore">' + esc(say('restore')) + '</button>' +
      '<button class="btn ghost" data-act="shareBackup">' + esc(say('share')) + '</button>');
  }
  ACT.storage = sheetStorage;

  const RULES = [
    {
      label: ['Cash sale', 'Cash nga baligya', 'Bentang cash'],
      text: [
        'A recorded stock-item sale reduces quantity and increases drawer cash by quantity × selling price. A quick cash entry increases cash only; it does not remove inventory. Never record the same sale both ways.',
        'Ang sale sa item mokuha sa stock ug modugang sa cash. Ang quick cash entry cash lamang, dili magkuha sa stock. Ayaw dobleha ang parehas nga sale.',
        'Ang bentang may item ay nagbabawas ng stock at nagdadagdag ng cash. Ang quick cash entry ay cash lang at hindi bawas-stock. Huwag doblehin ang benta.'
      ]
    },
    {
      label: ['Utang / credit sale', 'Utang nga baligya', 'Bentang utang'],
      text: [
        'Utang adds to the customer balance, not cash. Choosing an inventory item also reduces stock. Quantities above available stock are blocked. Customer credit limits warn before an override.',
        'Ang utang modugang sa balanse sa suki, dili sa cash. Kon pili-on ang item, moubos ang stock. Dili tugotan ang kulang nga stock.',
        'Ang utang ay dagdag sa balanse ng customer, hindi sa cash. Kapag may item, mababawasan ang stock. Hindi papayagan ang kulang na stock.'
      ]
    },
    {
      label: ['Customer payment', 'Bayad sa utang', 'Bayad sa utang'],
      text: [
        'Payment reduces utang and increases drawer cash by the same amount. Payment above the amount owed is blocked. This beta tracks only cash in the drawer, not GCash or bank balances.',
        'Ang bayad mopaubos sa utang ug modugang sa cash sa parehas nga kantidad. Dili tugotan ang sobra nga bayad.',
        'Binabawasan ng bayad ang utang at dinadagdagan ang cash ng parehong halaga. Hindi puwede ang sobrang bayad.'
      ]
    },
    {
      label: ['Restock & inventory cost', 'Pag-restock ug gasto', 'Restock at halaga'],
      text: [
        'A paid restock increases stock and subtracts its purchase cost from drawer cash. Unit cost becomes a weighted average of old stock cost and the new purchase. It cannot exceed available drawer cash. For personal funding, record an owner cash contribution before restocking.',
        'Ang restock modugang sa stock ug mokuha sa cash. Weighted average ang unit cost. Kon personal nga kwarta ang gigamit, irekord una kini isip dugang nga cash.',
        'Dagdag-stock at bawas-cash ang restock. Weighted average ang unit cost. Kung sariling pera ang ginamit, itala muna ang dagdag-kapital sa cash.'
      ]
    },
    {
      label: ['Expenses, funding & total', 'Gasto, kapital ug total', 'Gastos, puhunan at kabuuan'],
      text: [
        'Cash expenses reduce the drawer; an owner contribution increases it. The Overview total is cash + stock valued at average cost + customer receivables. It is NOT profit, sales revenue or bank balance. Stock counts change inventory only, not cash.',
        'Ang gasto mokuha sa cash; ang kapital modugang. Ang Overview total mao ang cash + kantidad sa stock + utang. DILI kini profit.',
        'Bawas-cash ang gastos; dagdag-cash ang puhunan. Ang Overview ay cash + halaga ng stock + utang. HINDI ito tubo.'
      ]
    },
    {
      label: ['Corrections & safeguards', 'Pag-ayo sa rekord', 'Pagwawasto at proteksyon'],
      text: [
        'Every transaction must save successfully or its in-memory changes are rolled back. Deleting an item or customer with history archives it, preserving records. Use stock count to correct physical stock. Back up before large corrections.',
        'Kon mapakyas ang save, ibalik ang mga kausaban. Ang item o customer nga adunay history i-archive aron mapreserba ang record.',
        'Kapag bigo ang pag-save, ibabalik ang pagbabago. Ang item o customer na may history ay ia-archive upang hindi mawala ang record.'
      ]
    }
  ];
  function sheetRules() {
    openSheet('<h2>📘 ' + esc(say('rules')) + '</h2><p class="hint">' +
      esc(say('cashOnly')) + '</p><label class="f"><span>Topic / Hilisgutan / Paksa</span>' +
      '<select id="ruleTopic">' + RULES.map((r, i) => '<option value="' + i + '">' +
        esc(r.label[LI[lang]]) + '</option>').join('') + '</select></label>' +
      '<section class="card"><p id="ruleDetail"></p></section>');
    showRule();
  }
  function showRule() {
    const el = $('#ruleTopic'), target = $('#ruleDetail');
    if (el && target) target.textContent = RULES[Number(el.value) || 0].text[LI[lang]];
  }
  document.addEventListener('change', e => { if (e.target.id === 'ruleTopic') showRule(); });
  ACT.rules = sheetRules;

  const originalSettings = sheetSettings;
  sheetSettings = function () {
    if (!D) return sheetStorage();
    originalSettings();
    const el = $('#sheet .sheet-card');
    el.insertAdjacentHTML('beforeend', '<h3>' + esc(say('storage')) +
      '</h3><button class="btn" data-act="storage">📁 ' + esc(say('storage')) +
      '</button><button class="btn ghost" data-act="rules">📘 ' + esc(say('rules')) +
      '</button><p class="hint small">' + esc(say('cashOnly')) + '</p>');
  };
  ACT.settings = sheetSettings;

  // Financial safeguards: drawer cash is a real physical account, never a virtual placeholder.
  FORM.sold = function (fd, id) {
    const i = getItem(id), qty = r2(num(fd.qty)), price = r2(num(fd.price));
    if (!i || i.archived) return notice('Choose an active item.');
    if (qty <= 0 || price <= 0) return notice('Quantity and selling price must be greater than zero.');
    if (qty > i.stock) return notice('Insufficient stock. Correct the stock count before selling.');
    i.stock = r2(i.stock - qty);
    D.cash.push({ id: uid(), cat: 'benta', amount: r2(qty * price),
      note: i.name + ' ×' + fmtQty(qty), date: today(), at: Date.now(),
      itemId: i.id, stockDelta: -qty });
    if (commit()) notice(t('t_plus_cash', { v: peso(qty * price) }));
  };

  const oldSheetBayad = sheetBayad;
  sheetBayad = function (cid) {
    oldSheetBayad(cid);
    const f = $('#sheet form[data-form="bayad"]');
    if (f) {
      const checkbox = f.querySelector('input[name="toCash"]');
      if (checkbox) checkbox.closest('label').remove();
      f.insertAdjacentHTML('beforeend', '<p class="hint small">' + esc(say('cashOnly')) + '</p>');
    }
  };
  ACT.newBayad = sheetBayad;
  FORM.bayad = function (fd) {
    const c = getCust(fd.cid), amount = r2(num(fd.amount));
    if (!c) return notice(t('t_pick_cust'));
    if (amount <= 0) return notice(t('t_need_amount'));
    const bal = balanceOf(c.id);
    if (amount > bal) return notice('Payment exceeds the amount owed. Record an exact or smaller amount.');
    const e = { id: uid(), customerId: c.id, type: 'bayad', amount,
      note: (fd.note || '').trim(), date: today(), at: Date.now() };
    const cash = { id: uid(), cat: 'bayad', amount, note: t('note_pay', { c: c.name }),
      date: e.date, at: e.at, linkId: e.id };
    e.cashId = cash.id;
    D.cash.push(cash); D.ledger.push(e);
    if (commit()) notice(balanceOf(c.id) <= 0 ? t('t_paid_full', { c: c.name }) :
      t('t_received', { v: peso(balanceOf(c.id)) }));
  };

  FORM.utang = async function (fd) {
    const amount = r2(num(fd.amount));
    if (amount <= 0) return notice(t('t_need_amount'));
    const newName = (fd.newName || '').trim();
    if (!fd.cid && !newName) return notice(t('t_need_cust'));
    const selected = fd.itemId && getItem(fd.itemId);
    const q = selected ? r2(num(fd.qty)) : 0;
    if (fd.itemId && (!selected || selected.archived || q <= 0))
      return notice('Choose an active item and a quantity greater than zero.');
    if (selected && q > selected.stock)
      return notice('Insufficient stock. Correct the stock count before recording utang.');
    let c = fd.cid ? getCust(fd.cid) : null;
    if (fd.cid && (!c || c.archived)) return notice('Choose an active customer.');
    if (c) {
      const bal = balanceOf(c.id);
      if (c.limit && bal + amount > c.limit &&
          !(await ask(t('a_over_limit', { c: c.name, l: peso(c.limit), b: peso(bal + amount) })))) return;
    } else {
      c = { id: uid(), name: newName, phone: '', email: '', limit: 0 };
      D.customers.push(c);
    }
    const e = { id: uid(), customerId: c.id, type: 'utang', amount,
      note: (fd.note || '').trim(), date: today(), at: Date.now() };
    if (selected) {
      selected.stock = r2(selected.stock - q);
      e.itemId = selected.id; e.stockDelta = -q;
      if (!e.note) e.note = selected.name + ' ×' + fmtQty(q);
    }
    D.ledger.push(e);
    if (commit()) notice(t('t_recorded', { c: c.name, v: peso(amount) }));
  };

  const originalRestockSheet = sheetRestock;
  sheetRestock = function (id) {
    originalRestockSheet(id);
    const f = $('#sheet form[data-form="restock"]');
    if (f) {
      const check = f.querySelector('input[name="fromCash"]');
      if (check) check.closest('label').remove();
      f.insertAdjacentHTML('beforeend', '<p class="hint small">' + esc(say('funding')) +
        '. To use personal funds, record a capital contribution in Money first.</p>');
    }
  };
  ACT.restock = sheetRestock;
  FORM.restock = function (fd, id) {
    const i = getItem(id), packs = r2(num(fd.packs)),
      pcs = Math.round(num(fd.pcs)), packCost = r2(num(fd.packCost));
    if (!i || i.archived) return notice('Choose an active item.');
    if (packs <= 0 || pcs < 1 || packCost <= 0)
      return notice('Packs, units per pack, and pack cost must be greater than zero.');
    const qty = r2(packs * pcs), spent = r2(packs * packCost);
    if (spent > cashOnHand()) return notice('Not enough store cash for this restock. Record owner funding first.');
    const oldStock = i.stock, oldCost = i.cost, oldPack = i.packSize;
    i.cost = r2((Math.max(0, oldStock) * oldCost + spent) /
      (Math.max(0, oldStock) + qty));
    i.stock = r2(oldStock + qty); i.packSize = pcs;
    D.cash.push({ id: uid(), cat: 'paninda', amount: spent,
      note: i.name + ' +' + fmtQty(qty), date: today(), at: Date.now(),
      itemId: i.id, stockDelta: qty, priorCost: oldCost, priorPackSize: oldPack });
    if (commit()) notice('Restocked ' + fmtQty(qty) + ' ' + i.name + ' and paid ' + peso(spent) + '.');
  };

  const oldCount = FORM.count;
  FORM.count = function (fd, id) {
    const i = getItem(id), n = r2(num(fd.count));
    if (!i || !Number.isFinite(n) || n < 0) return notice('Stock count must be zero or greater.');
    const before = i.stock;
    D.adjustments = D.adjustments || [];
    D.adjustments.push({ id: uid(), itemId: id, from: before, to: n, date: today(), at: Date.now() });
    i.stock = n;
    if (commit()) notice('Stock count updated: ' + fmtQty(before) + ' → ' + fmtQty(n) + '.');
  };

  FORM.cash = function (fd) {
    const amount = r2(num(fd.amount));
    if (amount <= 0) return notice(t('t_need_amount'));
    if (!CATS[fd.cat]) return notice('Choose a valid cash category.');
    if (CATS[fd.cat] === 'out' && amount > cashOnHand())
      return notice('Not enough drawer cash. Record actual owner funding before this expense.');
    D.cash.push({ id: uid(), cat: fd.cat, amount, note: (fd.note || '').trim(),
      date: fd.date || today(), at: Date.now() });
    if (commit()) notice(t('t_saved'));
  };
  FORM.item = async function (fd, id) {
    const name = (fd.name || '').trim();
    if (!name) return notice(t('t_need_name'));
    const cost = r2(num(fd.cost)), price = r2(num(fd.price));
    if (price < cost && !(await ask(t('a_price_below')))) return;
    const low = r2(num(fd.low)), packSize = Math.max(1, Math.round(num(fd.packSize)) || 1);
    if (id) {
      const item = getItem(id);
      if (!item) return notice('Item not found.');
      Object.assign(item, { name, cost, price, low, packSize });
    } else D.items.push({ id: uid(), name, cost, price, stock: r2(num(fd.stock)), low, packSize });
    if (commit()) notice(t('t_saved'));
  };
  FORM.settings = function (fd) {
    Object.assign(D.store, {
      name: (fd.name || '').trim() || D.store.name,
      openingCash: r2(num(fd.openingCash)),
      capital: r2(num(fd.capital)),
      budget: r2(num(fd.budget))
    });
    if (commit()) notice(t('t_saved'));
  };

  // Archived records stay accessible; history is never silently erased.
  state.showArchivedCustomers = false;
  state.showArchivedItems = false;
  // Archived items have a zero low-stock alert threshold, keeping active reorder lists clean.
  const baseCustRows = custRows;
  custRows = function () {
    const all = D.customers;
    D.customers = all.filter(c => !!c.archived === !!state.showArchivedCustomers);
    try { return baseCustRows(); } finally { D.customers = all; }
  };
  const baseItemRows = itemRows;
  itemRows = function () {
    const all = D.items;
    D.items = all.filter(i => !!i.archived === !!state.showArchivedItems);
    try { return baseItemRows(); } finally { D.items = all; }
  };
  const baseListahan = viewListahan;
  viewListahan = function () {
    return baseListahan().replace('<div class="toolbar">',
      '<button class="btn ghost" data-act="showArchivedCustomers">' +
      (state.showArchivedCustomers ? 'Show active customers' : 'Show archived customers') +
      '</button><div class="toolbar">');
  };
  const basePaninda = viewPaninda;
  viewPaninda = function () {
    return basePaninda().replace('<div class="toolbar">',
      '<button class="btn ghost" data-act="showArchivedItems">' +
      (state.showArchivedItems ? 'Show active items' : 'Show archived items') +
      '</button><div class="toolbar">');
  };
  ACT.showArchivedCustomers = () => { state.showArchivedCustomers = !state.showArchivedCustomers; render(); };
  ACT.showArchivedItems = () => { state.showArchivedItems = !state.showArchivedItems; render(); };
  const basePicker = custPicker;
  custPicker = function (owingOnly) {
    const all = D.customers;
    D.customers = all.filter(c => !c.archived);
    try { return basePicker(owingOnly); } finally { D.customers = all; }
  };
  const originalUtangSheet = sheetUtang;
  sheetUtang = function (cid) {
    originalUtangSheet(cid);
    const s = $('#sheet select[name="itemId"]');
    if (s) for (const option of Array.from(s.options))
      if (D.items.some(i => i.id === option.value && i.archived)) option.remove();
  };
  ACT.newUtang = sheetUtang;

  delCust = async function (id) {
    const c = getCust(id);
    if (!c) return;
    if (balanceOf(id) > 0) return notice('Customer still owes money. Settle the balance before archiving.');
    const hasHistory = D.ledger.some(e => e.customerId === id);
    if (!(await ask((hasHistory ? 'Archive customer and preserve all transactions: ' :
      'Delete customer with no transactions: ') + c.name + '?'))) return;
    if (hasHistory) c.archived = true;
    else D.customers = D.customers.filter(x => x.id !== id);
    state.cust = null;
    if (commit()) notice(hasHistory ? 'Customer archived, with history preserved.' : 'Customer removed.');
  };
  ACT.delCust = delCust;
  ACT.unarchiveCust = id => {
    const c = getCust(id);
    if (c) { c.archived = false; if (commit()) notice('Customer restored to active list.'); }
  };
  const baseCustomer = viewCustomer;
  viewCustomer = function (id) {
    const c = getCust(id), html = baseCustomer(id);
    return c && c.archived ?
      '<button class="btn" data-act="unarchiveCust" data-id="' + esc(id) +
      '">Restore customer to active list</button>' + html : html;
  };

  ACT.delItem = async id => {
    const i = getItem(id);
    if (!i) return;
    const history = D.ledger.some(e => e.itemId === id) ||
      D.cash.some(e => e.itemId === id) ||
      (D.adjustments || []).some(e => e.itemId === id);
    if (history && i.stock !== 0)
      return notice('Count stock to zero before archiving an item with transaction history.');
    if (!(await ask((history ? 'Archive item and keep its history: ' :
      'Delete unused item: ') + i.name + '?'))) return;
    if (history) { i.savedLow = i.low; i.low = 0; i.archived = true; }
    else D.items = D.items.filter(x => x.id !== id);
    if (commit()) notice(history ? 'Item archived. History preserved.' : 'Item removed.');
  };
  ACT.unarchiveItem = id => {
    const i = getItem(id);
    if (i) {
      i.archived = false;
      if (typeof i.savedLow === 'number') { i.low = i.savedLow; delete i.savedLow; }
      if (commit()) notice('Item restored to active stock.');
    }
  };
  const oldItemSheet = sheetItem;
  sheetItem = function (id) {
    oldItemSheet(id);
    const i = getItem(id);
    if (i && i.archived) {
      const card = $('#sheet .sheet-card');
      card.insertAdjacentHTML('beforeend', '<button class="btn" data-act="unarchiveItem" data-id="' +
        esc(id) + '">Restore item to active stock</button>');
    }
  };
  ACT.item = sheetItem;
  const oldDelCash = ACT.delCash;
  ACT.delCash = async id => {
    const rec = D.cash.find(c => c.id === id);
    if (!rec) return;
    if (rec.cat === 'paninda' && rec.itemId && rec.stockDelta > 0) {
      const later = D.cash.some(c => c.itemId === rec.itemId && c.at > rec.at) ||
        D.ledger.some(e => e.itemId === rec.itemId && e.at > rec.at) ||
        (D.adjustments || []).some(a => a.itemId === rec.itemId && a.at > rec.at);
      if (later) return notice('Later stock movements exist. Use stock count and a correcting cash entry instead.');
      if (!(await ask('Undo this restock, including stock, cash and average cost?'))) return;
      const item = getItem(rec.itemId);
      if (!item || item.stock < rec.stockDelta)
        return notice('Stock has changed. Correct it using a stock count.');
      item.stock = r2(item.stock - rec.stockDelta);
      if (typeof rec.priorCost === 'number') item.cost = rec.priorCost;
      if (typeof rec.priorPackSize === 'number') item.packSize = rec.priorPackSize;
      D.cash = D.cash.filter(c => c.id !== id);
      if (commit()) notice('Restock reversed.');
      return;
    }
    return oldDelCash(id);
  };

  // The main store data in 1.2 may have no adjustments. The field is optional for old backups.
  if (D && !Array.isArray(D.adjustments)) D.adjustments = [];
  render();
})();
