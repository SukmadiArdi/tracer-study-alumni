# Alumni Tracer Study System
### Sistem Informasi Tracer Study Alumni — Universitas Muhammadiyah Malang

Web-based tracer study system untuk melacak data karir dan sosial media alumni UMM secara efisien.

---

## ✨ Fitur Utama

- **Admin Login** — Autentikasi aman menggunakan Firebase Authentication
- **Manajemen Alumni** — Tambah, lihat, hapus, dan filter data alumni
- **Import Excel** — Upload data alumni massal dari file `.xlsx`
- **Enrichment Data** — Pencarian semi-otomatis ke LinkedIn (UMM), Instagram, Facebook, TikTok, dan Google
- **Smart Search** — Cari email, nomor HP, dan info kerja alumni via Google operator
- **Inferensi Status Kerja** — Otomatis mendeteksi PNS / Swasta / Wirausaha dari nama perusahaan
- **Confidence Score** — Skor kelengkapan data (0–100%) per alumni
- **Verifikasi Manual** — Konfirmasi data alumni oleh admin
- **Dashboard Real-time** — Statistik progress pelacakan alumni (Identified, Pending, Not Found)
- **Toast Notification** — Feedback interaktif untuk setiap aksi pengguna

---

## 🛠️ Teknologi

| Teknologi | Fungsi |
|---|---|
| HTML5 + TailwindCSS | Tampilan antarmuka |
| JavaScript ES Module | Logika aplikasi frontend |
| Firebase Authentication | Login & autentikasi admin |
| Firebase Firestore | Database cloud real-time |
| SheetJS (XLSX 0.20.2) | Import data Excel |
| Lucide Icons | Ikon antarmuka |

---

## 📁 Struktur File

```
├── index.html          → Halaman utama & UI
├── firebase.js         → Konfigurasi Firebase
├── main.js             → Controller utama & event handler
├── alumni.js           → CRUD data alumni (Firestore)
├── enrichment.js       → Smart Search & simpan enrichment
└── import-excel.js     → Modul import file Excel
```

---

## 🚀 Deployment

**Live Website:** https://username.github.io/tracer-study-alumni/

**GitHub Repository:** https://github.com/username/tracer-study-alumni

---

## ⚙️ Quality Attributes

| Aspek | Deskripsi |
|---|---|
| Functionality | Semua operasi CRUD dan enrichment berjalan |
| Usability | Dashboard minimalis dan mudah digunakan |
| Efficiency | Data diambil real-time dari Firebase Firestore |
| Reliability | Database cloud mencegah kehilangan data |

---

## 🧪 System Testing (Quality Assurance)

Pengujian aplikasi **Alumni Tracer Study System** dilakukan untuk memastikan bahwa seluruh antarmuka, logika bisnis, dan integrasi *database* (Firebase) berjalan sesuai dengan aspek kualitas yang telah ditentukan.

| ID | Aspek Kualitas | Fitur yang Diuji | Skenario Pengujian | Ekspektasi Hasil | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **F-01** | Functionality | Autentikasi (Login) | Memasukkan kredensial admin yang valid. | Pengguna berhasil masuk dan dialihkan ke halaman *Dashboard*. | ✅ PASS |
| **F-02** | Functionality | Autentikasi (Login) | Memasukkan kredensial admin yang salah. | Sistem menolak akses dan memunculkan pesan error. | ✅ PASS |
| **F-03** | Functionality | Create Alumni | Menambahkan data alumni baru via form Modal. | Modal tertutup, data tersimpan di *database*, dan muncul di tabel. | ✅ PASS |
| **F-04** | Functionality | Delete Alumni | Menekan tombol hapus lalu konfirmasi. | Data terhapus dari *database* dan baris hilang dari tabel. | ✅ PASS |
| **F-05** | Functionality | Filter & Pencarian | Mengetikkan nama/NIM atau mengubah *dropdown* prodi/tahun/status. | Tabel memperbarui data yang ditampilkan secara *real-time*. | ✅ PASS |
| **F-06** | Functionality | Import Excel | Upload file `.xlsx` berisi data alumni. | Semua baris tersimpan ke Firestore dan muncul di tabel. | ✅ PASS |
| **F-07** | Functionality | Enrichment Data | Mengisi form enrichment dan klik Simpan Data. | Data sosmed & pekerjaan tersimpan, confidence score terupdate. | ✅ PASS |
| **F-08** | Functionality | Smart Search | Klik tombol LinkedIn / Google di modal enrichment. | Tab baru terbuka dengan hasil pencarian yang relevan. | ✅ PASS |
| **F-09** | Functionality | Inferensi Status Kerja | Ketik nama perusahaan mengandung kata kunci PNS/Wirausaha. | Status pekerjaan terisi otomatis. | ✅ PASS |
| **F-10** | Functionality | Verifikasi Manual | Mengklik tombol Confirm pada halaman Verifikasi Manual. | Status alumni menjadi Identified, antrean verifikasi berkurang. | ✅ PASS |
| **U-01** | Usability | Dashboard Statistik | Memuat halaman Dashboard setelah ada perubahan data. | Statistik angka dan progress bar ter-*update* dengan akurat. | ✅ PASS |
| **U-02** | Usability | User Feedback | Melakukan aksi CRUD atau enrichment. | Muncul notifikasi *toast* sebagai feedback keberhasilan/gagal. | ✅ PASS |
| **R-01** | Reliability | Persistensi Data | Melakukan *refresh* halaman (F5). | Data alumni tetap tampil karena tersimpan di Firestore cloud. | ✅ PASS |

---

*© 2026 Alumni Tracer Study System — Universitas Muhammadiyah Malang*
