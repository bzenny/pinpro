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
beta/                   ← the same app for testers (amber icons)
TESTING.md              ← guide to send to test users
```

Store data never touches GitHub. It lives only on each user's phone (browser storage),
and owners can back it up as a file from ⚙️ Settings.

## How to release a new version

1. **Test first:** replace `beta/index.html` with the new file. In `beta/sw.js`, change `VERSION` (e.g. `1.2.0` → `1.3.0`). Commit.
2. Testers get the update the next time they open the app with internet.
3. **When testers are happy:** copy the same `index.html` to the root, and change `VERSION` in the root `sw.js`. Commit.

Never put an untested file straight into the root — that's the official app people rely on.

## Later: Play Store / App Store

This same `index.html` can be wrapped with Capacitor for Android and iOS.
Only the `Store` section at the top of the script (where data is saved) needs to change.
