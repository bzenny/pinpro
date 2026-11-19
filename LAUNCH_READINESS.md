# Pin.Pro — Cross-device and native launch readiness

**Current beta:** v1.5, responsive offline-first PWA at https://bzenny.github.io/pinpro/beta/  
**Supported layout goals:** small phone, Android tablet, iPad portrait/landscape, desktop/laptop counter.  
**Code structure:** one self-contained `beta/index.html` application; one beta service worker, install manifest and image assets. Production remains separate.

## Interaction contract

| Layout | Navigation | Primary behavior | Controls |
|---|---|---|---|
| Phone < 700 CSS px | Fixed bottom dock, 4 clear SVG tabs | One-column cards, quick actions, bottom-sheet forms | Touch targets 48+ px, native software keyboard, safe-area padding |
| Tablet 700–1099 CSS px | Left navigation rail | Spacious single- or two-column overview depending on orientation, touch-forward | 50+ px controls, focus indicators, adaptive sheet |
| Laptop / counter >= 1100 CSS px | Persistent left rail | Two-column overview and inventory/customer lists | Mouse + touch, F2 quick cash sale, F3 utang, F4 payment, / search |
| Large desktop >= 1400 CSS px | Same rail | Wider content with capped readable width; no stretched cards | Pointer, keyboard and touch |

Use *CSS viewport pixels*, not device marketing names. Test iPad landscape and browser zoom: either can cross a breakpoint. No business logic should depend on the layout size.

## Design principles

1. **Read first, act fast.** Large totals, grouped related actions, obvious status and low-stock warnings; the checkout action must remain fast.
2. **No fragile animation.** Motion is quick and subtle, respects reduced-motion accessibility preference; function never depends on animation.
3. **Errors are recoverable.** Unexpected runtime errors show a translated, dismissible recovery panel. A stored snapshot is preserved; no automatic reset.
4. **Progress only for real async work.** Backups, optional verification, restore and sharing show one accessible loading overlay and always clear it, including on failure.
5. **One app, one interaction model.** Same information architecture and translated wording in English/Cebuano/Tagalog. Layout adapts, accounting rules do not.
6. **Avoid deceptive synchronization.** The current working copy is browser-local. A laptop, iPad and phone **do not share records automatically**, even if opened to the same store name. Backup/export-restore is the current transfer method.
7. **Beta is not indexed.** Its document title updates per screen; static public SEO should only be optimized when promoting the official app or building a dedicated marketing website.

## Installation and offline use

- **Laptop / desktop:** open HTTPS beta in Chrome or Edge, use browser install control if offered, and launch as an installed app.
- **iPad / iPhone:** open in Safari; Share → Add to Home Screen. Launch the installed icon.
- **Android:** open in Chrome, then browser menu → Install app / Add to Home screen.
- **First use online:** open the app with internet to allow the service worker to cache application assets; then verify airplane mode and a full reopen.
- **Local file (`file://`) is not an equivalent install path:** service workers normally require HTTPS or localhost. For a counter laptop, install the PWA from its HTTPS site (or run a managed localhost distribution in a later release).

## Data safety and portability

- Existing beta records remain under `pinpro.beta.v1`; official data uses `pinpro.v1`.
- Manual JSON backup, share, validation and restore remain available in Settings.
- The app makes **no** cross-device real-time claims, no silent cloud sync, and sends no store transaction history to GitHub.
- Browser cleanup, OS storage pressure or uninstalling can remove local records. Before relying on a new device, export, find and restore a backup in a separate test profile.
- For a real multi-device store, a later design needs an explicit conflict-resolution and synchronization model, user authentication or device pairing, encryption, and an offline queue. Do **not** copy unsynchronized edits in two directions via backup files.

## Native app build gates (next phase, not shipped by this beta)

1. **Platform shell:** Capacitor-style iOS/Android wrappers while preserving accessible screen semantics. Replace `Store` with a durable platform adapter (e.g., SQLite or suitably persistent storage).
2. **Files and recovery:** Native document picker, atomic writes, import validation and secure optional backups. Test on iOS Photos/Files, Android documents provider and desktop file pickers.
3. **Device capabilities:** Android system Back, iOS swipe-back, hardware keyboard and OS appearance settings without confusing browser back/history.
4. **Privacy and stores:** App privacy disclosures, permissions minimized, accessible UI, verified offline behavior, no embedded secrets, app signing and app icon/splash assets.
5. **Real-world tests:** At minimum iPhone Safari/PWA, iPad portrait/landscape Safari/PWA, Android Chrome/PWA, and laptop Chrome/Edge/PWA. Validate 360px phone, 768px/820px tablet and 1366px laptop in both portrait/landscape where relevant.
6. **Cross-device syncing:** Optional future requirement; not part of the current v1.5 PWA. Decide whether one authoritative store database, peer-to-peer local LAN or a secured cloud sync is appropriate before architecting it.

## Acceptance checklist before promoting to official

- [ ] Real laptop counter can complete repeated sales, cash out and utang without layout or key traps
- [ ] iPad orientation switch preserves current working data and all controls remain visible
- [ ] Phone safe areas, long translated labels, keyboard-on-screen forms and bottom sheet navigation work
- [ ] App installed from browser reopens offline and saves new transactions in each environment
- [ ] Saved backup can be located and restored on a second device, without claiming live sync
- [ ] Async busy state clears after success, cancel, malformed file, rejected permission and storage failure
- [ ] Unexpected exception shows localized recovery screen; previous local records are still loadable
- [ ] Automated Node smoke tests and GitHub Actions pass
- [ ] Root production v1.2 is unchanged until explicit release approval

This document is a product and QA target, not proof of native App Store / Play Store approval.
