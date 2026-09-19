# KasirQuh V4 — FINAL INTEGRASI v21

Paket ini melanjutkan audit integrasi V4 di atas mesin legacy yang dipertahankan.

## Audit deploy/cache v21
- `vercel.json` tersedia di root proyek agar aturan header Vercel terbaca saat deploy dari root.
- Root gateway melakukan cleanup satu kali untuk Service Worker lama dan Cache Storage lama, lalu reload. `localStorage`, `sessionStorage` selain marker cleanup, IndexedDB, dan data Firestore tidak dihapus.
- V4 aktif tidak mendaftarkan Service Worker baru, sehingga tidak menambah lapisan cache offline yang dapat menahan versi lama.
- URL utama tetap `/`, `/admin/`, dan `/customer/`.
- Asset V4 memakai path relatif sehingga aman ketika halaman dibuka dari subfolder.

## Data/tenant
- Operasional V4 memakai `toko/{tokoId}/{collection}`.
- `pengguna/{uid}` tetap menjadi sumber `role` dan `tokoId` Admin.
- `toko_v13` dipertahankan hanya sebagai fallback compatibility Customer/legacy.

## Verifikasi
- Seluruh JavaScript paket diperiksa dengan `node --check`.
- Struktur ZIP diverifikasi dengan `unzip -t`.


## Deploy audit v22
- Root, Admin, and Customer perform a one-time cleanup of legacy service-worker registrations/cache on first load of this build.
- Admin and Customer use the same Firebase 10.12.2 compat SDK family as the shared bootstrap.
- No service worker is shipped by V4.
- Firestore security rules are intentionally not included; configure production rules separately.


## v25 FIX
Added an inline Firebase namespace/init fallback in Admin and Customer entrypoints so local testing cannot fail merely because shared/firebase-bootstrap.js was not executed. Shared bootstrap remains the canonical implementation.
