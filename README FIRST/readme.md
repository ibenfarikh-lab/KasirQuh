README FIRST

👇

### 🔐 ATURAN WAJIB LOG PROYEK — README.md

Setiap pihak, proses, alat, atau aktivitas yang **mengakses, membaca, memeriksa, mengaudit, menganalisis, mengubah, menambah, menghapus, memindahkan, merapikan, memperbaiki, mengganti, memverifikasi, atau melakukan tindakan apa pun terhadap file/proyek** wajib meninggalkan log yang sesuai di `README FIRST`.

Tidak boleh ada perubahan atau tindakan terhadap proyek yang dilakukan tanpa dicatat di `README pembuatan

Setiap log wajib mencantumkan:
1. **Tanggal/Waktu** aktivitas.
2. **TRACE ID** pekerjaan.
3. **SCOPE** file/folder yang menjadi ruang lingkup.
4. **Aktivitas** — BACA / AUDIT / ANALISIS / UBAH / TAMBAH / HAPUS / PINDAH / PERBAIKI / VERIFIKASI / LAINNYA.
5. **File terkait** yang diakses atau diproses.
6. **Tujuan** aktivitas.
7. **Temuan/Hasil** aktivitas.
8. **Perubahan** file jika ada.
9. **Verifikasi** setelah perubahan atau pemeriksaan.
10. **Status** — PASS / FAIL / BLOCKED / NO CHANGE.
11. **Catatan** tambahan bila diperlukan.
12. **WAJIB MEMBUAT FILE LOG MD BARU** Nama log sesuai dengan tanggal pembuatan log

Jika aktivitas hanya berupa **baca, audit, pemeriksaan, atau diagnosis tanpa perubahan kode**, aktivitas tersebut tetap wajib dicatat dengan status `NO CHANGE`.

Jika aktivitas menemukan masalah tetapi belum melakukan perbaikan, temuan tetap wajib dicatat.

Jika pekerjaan merupakan kelanjutan dari pekerjaan sebelumnya, gunakan TRACE ID yang sama atau TRACE ID turunan yang jelas hubungannya dengan pekerjaan induk.


### 🛡️ ATURAN SCOPE

Setiap TRACE ID memiliki **SCOPE** yang wajib dihormati. File di luar SCOPE tidak boleh diubah tanpa persetujuan eksplisit. Jika pemeriksaan menemukan keterkaitan dengan file di luar SCOPE, catat sebagai **TEMUAN** saja dan jangan mengubah file tersebut sebelum scope diperluas secara eksplisit.

Untuk TRACE saat ini:
- `pelanggan.html` = target utama.
- CSS yang berkaitan langsung dengan `pelanggan.html` = termasuk scope.
- `readme.md` = wajib diperbarui untuk setiap log aktivitas.
- `admin.html` dan `index.html` = **di luar scope perubahan** kecuali ada keputusan eksplisit.

### 🧾 FORMAT LOG WAJIB

```text
[LOG AKTIVITAS]

Tanggal/Waktu :
TRACE ID      :
SCOPE         :
AKTIVITAS     :
FILE TERKAIT  :
TUJUAN        :
TEMUAN        :
PERUBAHAN     :
VERIFIKASI    :
STATUS        :
CATATAN       :
```

### 🚫 ATURAN RIWAYAT

Riwayat log sebelumnya tidak boleh dihapus atau ditimpa hanya untuk merapikan README. Log baru harus **ditambahkan secara berurutan**, sehingga `readme.md` tetap menjadi sumber histori pekerjaan proyek dan selalu dapat dibandingkan dengan kondisi file aktual.


