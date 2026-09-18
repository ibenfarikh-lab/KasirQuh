# KasirQuh V3(00) Refactored

## Prinsip refactor
- Behavior, Firebase collection names, document fields, DOM IDs, and inline `onclick` contracts are preserved unless a path bug is explicitly corrected.
- Classic scripts are kept in deterministic order so legacy global functions remain compatible with existing HTML handlers.
- Root `index.html` is reduced to gateway markup + external CSS/JS.
- Admin and Pelanggan CSS/JS are separated into ordered modules.
- Shared public Firebase web configuration lives in `shared/js/app-config.js`; no private API secret is placed in the frontend.

## Structure
```text
index.html
assets/css/gateway.css
assets/js/gateway.js
shared/js/app-config.js
admin/
  index.html
  css/base.css + ordered overrides
  js/home-settings.js
  js/firebase-runtime.js
  js/modules/*.js
  js/pending-customer-notification.js
  script.js                 # legacy compatibility loader
pelanggan/
  index.html
  manifest-pelanggan.json
  css/*.css
  js/*.js
  js/modules/*.js
api/
manifest.json
sw.js
vercel.json
package.json
```

## Deployment/path fixes
- `/admin.html` -> `/admin/index.html`
- `/pelanggan.html` -> `/pelanggan/index.html`
- `/customer/index.html` -> `/pelanggan/index.html`
- Admin root manifest/icon links are made root-relative (`../`).
- Customer PWA manifest now uses `/pelanggan/index.html`, `/pelanggan/` scope, and root icon paths.
- Service worker cache entries and navigation fallbacks use the refactored paths.

## Android foundation
The app remains framework-free and can be wrapped later with Capacitor without moving to a `src/` tree. The existing classic-script/global contract is intentionally preserved in this pass to reduce migration risk.
