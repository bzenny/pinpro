# Pin.Pro Beta v1.5 — Store-Owner Field Test

**Beta:** https://bzenny.github.io/pinpro/beta/  
**Official v1.2:** https://bzenny.github.io/pinpro/ (unchanged)

## First opening on phone, tablet or computer

1. Open the **beta** while online, then close and reopen it. In Settings, confirm **1.5.0-beta**.
2. The installed beta icon is amber and the app shows a **BETA** badge.
3. Existing beta stores should load in place. **Do not clear browser data to update.**
4. Work from sample data first. Keep the paper notebook during the whole field test.
5. Use the same browser/profile on the same device to reopen the same working records.

## Where records actually live

- The current working copy lives in **the browser's local storage on that device**. It is *not*
  in a normal Files/Downloads folder, and there is **no cloud sync** or login.
- Choose **Settings → Device storage & recovery → Save backup file** to create a portable JSON
  recovery copy. Android: Files → Downloads. iPhone/iPad: Files → Downloads (location depends
  on Safari settings). Computers: Downloads or your chosen folder.
- On supported desktop browsers, a save dialog may let you choose a folder.
- A **single home backup reminder appears about once per week**. Initiating a backup clears
  the reminder for seven days, even if new sales are recorded.
- **Check saved file** is now OPTIONAL. It attempts to reopen a downloaded JSON file and
  compare it to current records, but the weekly reminder does not require that step.
- **Restore backup file** replaces current records only after validating the file and
  confirming replacement. A corrupt/invalid file is rejected without replacing records.
- Backups may contain customer names, phone numbers, balances and transactions: protect files
  and make a second copy in a safe location.
- Never uninstall the app or clear its browser data before preserving a recovery file.

## Finance rules

Open **Settings → Explore Finance Rules**. All six topics are available in **English,
Cebuano, and Tagalog**:

1. **Cash sale:** selling a stock item deducts quantity and adds sale proceeds to drawer cash.
   A quick cash entry records *cash only*. Do not record a sale twice.
2. **Utang:** adds to the customer's receivable and, when an item is selected, deducts stock.
   If the count is too low, a warning appears, but the owner **may confirm and continue**;
   count stock later.
3. **Bayad:** reduces utang and adds physical drawer cash. Overpayment is blocked, because
   customer-credit liabilities are not modeled in this beta.
4. **Restock:** increases stock, recalculates weighted-average unit cost, and records a purchase.
   Check **Paid with my own money / GCash** to record paired owner contribution and purchase
   entries — net physical drawer cash stays unchanged. If drawer cash is insufficient, a prompt
   offers the personal-funds route in one tap.
5. **Expense:** paid from the drawer reduces physical cash. The same personal-funds checkbox
   adds a linked capital contribution with the expense so physical cash stays unchanged.
6. **Corrections:** stock counts adjust inventory but not cash. Customers/items with history
   are **archived**, preserving transactions; a recorded restock can be undone when no later
   stock movements make the cost reversal unsafe.

This beta does not provide separate GCash/bank balances. Personally paid expenses are represented
as *paired bookkeeping records*, not as real cash deposited in the drawer.
**Overview total is not net profit**; it is a simplified cash + stock-at-cost + collectible-utang figure.

## Field-test checklist

- [ ] Load existing beta records from v1.2/v1.3 without resetting
- [ ] Switch language and verify new Settings, archive, storage, finance and pop-up text
- [ ] Create item, customer, cash sale and utang
- [ ] Sell more stock than shown: see warning, confirm, and finish the sale
- [ ] Record utang for an item with a low count; confirm and continue
- [ ] Record customer payment and try an overpayment (blocked)
- [ ] Restock using drawer cash; note the weighted-average cost
- [ ] Restock with personal funds/GCash; check cash drawer stays unchanged
- [ ] Undo that restock before another stock movement; verify quantity, cost and funding reverse
- [ ] Record expense paid personally; verify capital + expense pair and unchanged cash
- [ ] Change stock count; verify the cash drawer is unaffected
- [ ] Settle a customer, archive them, show archived records and restore them
- [ ] Save a backup; confirm there is only one home reminder and it disappears for the week
- [ ] Optionally check the saved backup file, then test restoring it on another browser/profile
- [ ] Try an invalid JSON file; original data must remain unchanged
- [ ] Open offline in airplane mode, record a sale, then reconnect
- [ ] Repeat on Android Chrome and iOS Safari where available
- [ ] Confirm official v1.2 remains unchanged

## Cross-device launch polish (v1.5)

Test the same beta build across **laptop counter**, **iPad portrait/landscape**, and **phone**. 
Records stay local to each browser/device. This is layout portability, **not data sync**.

- [ ] Phone at 360–430 CSS px: bottom navigation remains visible, touch buttons and forms do not clip, on-screen keyboard does not hide an action
- [ ] iPad portrait / landscape: rail navigation, spacing, forms and lists adapt during rotation without resetting the current store
- [ ] Laptop around 1366×768: left rail, two-column overview, wide stock/customer grids, and keyboard/mouse controls work
- [ ] Laptop F2: open quick cash sale; F3: open utang; F4: open payment; /: focus stock/customer search outside text inputs
- [ ] Tap each tab: document/browser title changes and current tab is labeled accessibly
- [ ] Settings → Install / use offline: instructions are understandable for Chrome/Edge laptop, Safari iPad/iPhone, Chrome Android
- [ ] Settings and recovery messages still work in Cebuano and Tagalog
- [ ] Backup/restore/share shows progress and clears it after completion, cancellation or validation failure
- [ ] Simulated unexpected UI error shows an actionable translated recovery panel instead of a blank page
- [ ] Offline reopen works after first online load, but not with uninstalled local `file://` HTML alone

The beta includes a native-feeling **responsive PWA**, not completed App Store/Play Store
native packages. See [LAUNCH_READINESS.md](LAUNCH_READINESS.md) for their next acceptance gates.

## Report results

Include device model, OS, browser, selected language, actions performed, expected and actual
result, and a screenshot with customer contact information hidden.

Questions to ask testers: What slowed down an actual sale? Were accounting terms understandable?
Could you find a backup in the phone's Files app? Which transaction did you still need?
Would you trust the app instead of your notebook after a week?

**Release gate:** automated tests must pass, and real phone testing must confirm storage
restoration, offline reopen, language behavior and correct transactions before official release.
