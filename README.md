# Pin.Pro

Stock, utang list and money for sari-sari stores — all on the owner's phone.
No server, no login, works offline. English · Cebuano · Tagalog.

| | Link | Who uses it |
|---|---|---|
| **Official** | https://bzenny.github.io/pinpro/ | Store owners (after launch) |
| **Beta** | https://bzenny.github.io/pinpro/beta/ | Test users only |

Beta and official keep **separate data**, even on the same phone. Beta shows an amber icon and a BETA badge.

## What's in this repo

```
index.html              ← the whole app (official)
manifest.webmanifest    ← makes it installable ("Add to Home screen")
sw.js                   ← makes it work offline
icons/                  ← blue app icons
beta/index.html         ← self-contained beta app (no runtime upgrade script)
beta/sw.js              ← beta-specific offline cache
beta/icons/             ← amber icons for testers
tests/beta-smoke.cjs     ← automated accounting and backup regression checks
TESTING.md              ← guide to send to test users
```

Store data never touches GitHub. It lives only in the current device/browser's local storage.
A user-selected JSON file in Files/Downloads (or another folder) is the portable recovery copy.
Settings explains this storage distinction, includes optional file verification, and links to
finance rules. The home backup reminder is weekly, not transaction-by-transaction.

## How to release a new version

1. **Test first:** update `beta/index.html` directly and bump the beta `sw.js` version. Run `node tests/beta-smoke.cjs` and the GitHub Actions beta workflow.
2. Testers get the update the next time they open the app with internet.
3. **When testers are happy:** copy the same `index.html` to the root, and change `VERSION` in the root `sw.js`. Commit.

Never put an untested file straight into the root — that's the official app people rely on.

## Later: Play Store / App Store

Both apps remain single-file HTML applications suitable for later Capacitor integration.
Native releases will need platform-specific backup-file handling, storage adapters, and device testing.
