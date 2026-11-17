# Pin.Pro Beta v1.3 — Field Testing Guide

**Beta URL:** https://bzenny.github.io/pinpro/beta/  
**Official release (do not use for testing):** https://bzenny.github.io/pinpro/

Use the **amber BETA icon** and BETA badge for testing. The beta and official app use separate
browser data keys; backups can move data between devices only when deliberately imported.

## Before the first test

1. Update/open the beta while connected to the internet, then fully close and reopen it.
2. Check **Settings** for version **1.3.0-beta**.
3. Keep your paper notebook for the test week. Use *sample data* first, never your official ledger.
4. In **Settings → Device storage & recovery**, save a JSON backup. Find it using your phone/tablet/computer
   Files app (usually Downloads, unless you picked another location). Choose **Verify saved backup** and
   select that downloaded file. The verified date should appear.
5. Keep another backup somewhere safe before resetting the browser, clearing storage, changing phones,
   or installing a new build.

### What local storage means

The *working copy* is in the current device's browser storage, **not in a regular folder**, and no
account/server automatically syncs it. Opening the same URL in a different browser or device will
not open the same store. A **JSON backup file** is the portable recovery copy: save or share the file
to a location you control, verify it, and restore it on the new device. A download notification is
**not** proof that the file was saved. Backups contain customer information — protect them.

## Finances: read the rules first

Open **Settings → Explore Finance Rules** and select each topic.

- **Stock-item cash sale:** increases cash and decreases item quantity. Do not also record it as
  a quick cash sale. A **quick cash sale** increases cash only, and does not adjust stock.
- **Utang:** increases the customer's receivable, not cash. Selecting an item reduces stock.
  Sale quantities above available stock are blocked.
- **Bayad:** reduces customer utang and increases drawer cash by the same amount. Overpayment
  is blocked. **GCash/bank payments are not yet supported as separate assets**; don't record
  them as drawer cash until received as physical cash.
- **Paid restock:** increases item quantity and decreases drawer cash. New average unit cost
  is weighted by existing stock and the new purchase. Restocks above available cash are blocked;
  record a genuine owner cash contribution under Money before using personally funded purchases.
- **Stock count:** adjusts inventory, not money. Such adjustments are logged.
- **Overview amount:** cash + stock at current cost + positive utang. It is *not net profit*.
- **Corrections:** deleting a customer with history archives them, preserving transactions.
  Deleting an item with history archives it only after its physical stock is counted down to zero.

## Test every workflow in English, Cebuano and Tagalog

- [ ] Install/open on Android Chrome or iOS Safari; verify BETA badge and v1.3.0-beta
- [ ] Enter an opening cash balance, three items and three customers
- [ ] Record a stock-linked cash sale, then test selling beyond available stock
- [ ] Record utang with an item; confirm cash **does not increase**
- [ ] Record a partial payment, then complete it; test an overpayment
- [ ] Restock an item at a different unit cost; confirm weighted-average cost
- [ ] Try restocking with insufficient drawer cash; record a real owner contribution first
- [ ] Count stock and confirm cash is unchanged
- [ ] Open **Explore Finance Rules** and switch all six topics
- [ ] Export to the device, locate the JSON file and verify it
- [ ] Enter another transaction, then verify the old backup again: it should report a mismatch
- [ ] Save and verify a fresh backup; restore it into a separate browser/profile/device
- [ ] Test offline (airplane mode), then reconnect and confirm the data remains
- [ ] Archive a fully paid customer with history and show archived records
- [ ] Confirm official version has not changed, and beta data stays separate

## Report issues

Send a screenshot (hide customer phone numbers), your device model, operating system, browser,
language, steps to reproduce, expected result, and actual result to the test coordinator.

Questions for participants:

1. What was confusing or took more than three taps?
2. Which daily transaction did you need that the app cannot represent?
3. Did any amount or quantity differ from your notebook?
4. Were you able to save, find, and verify your backup without assistance?
5. Would you use it daily? Why, or why not?

**Release gate:** complete automated smoke tests, field tests on at least Android and iOS,
successful offline reopen, and tested restore from a verified backup before promoting the beta
to the official channel.

> Beta only: keep your paper notebook while the app is being tested.
