# Alumni Tracer Study System
### Sistem Informasi Tracer Study Alumni — Universitas Muhammadiyah Malang

Web-based tracer study system untuk melacak data karir, sosial media, dan memvalidasi status kelulusan alumni UMM secara efisien.

---

## ✨ Fitur Utama

- **Admin Login** — Autentikasi aman menggunakan Supabase Authentication
- **Manajemen Alumni** — Tambah, lihat, hapus, dan filter data alumni secara real-time
- **Import & Export Excel** — Upload data massal dari `.xlsx` dan unduh laporan hasil evaluasi metrik akurasi
- **Verifikasi PDDikti Otomatis (Direct API Intercept)** — Validasi data mahasiswa/lulusan langsung dari API PDDikti Kemdikbud secara super cepat
- **Auto Enrichment (Google Dorking & Heuristic)** — Pelacakan otomatis jejak digital (LinkedIn, Instagram, Portofolio, Info Kerja) menggunakan *headless browser* (Puppeteer) dan *Fallback Heuristik*
- **Inferensi Status Kerja** — Otomatis mendeteksi instansi (PNS / Swasta / Wirausaha) dari nama perusahaan
- **Accuracy Dashboard & Metrics** — Mengukur tingkat keberhasilan pelacakan (Coverage, Accuracy, Completeness) berdasarkan formula standar akademik
- **Batch Processing** — Memproses sinkronisasi PDDikti dan *Auto-Enrichment* untuk ribuan data sekaligus dalam satu klik
- **Verifikasi Manual** — Konfirmasi status hasil pelacakan sistem (Identified, Pending, Not Found) oleh admin

---

## 🛠️ Teknologi

| Teknologi | Fungsi |
|---|---|
| **Frontend** | |
| HTML5 + Vanilla CSS + TailwindCSS | Tampilan antarmuka yang modern dan responsif |
| JavaScript ES Module | Logika aplikasi sisi *client* |
| SheetJS (XLSX) | Manipulasi Import & Export file Excel |
| Lucide Icons | Ikon antarmuka |
| **Backend & Database** | |
| Node.js + Express | Server API lokal/production (*Proxy* & *Web Scraper*) |
| Puppeteer (Stealth Plugin) | Ekstraksi hasil Google Search (*Web Scraping*) |
| Supabase (PostgreSQL) | Database relasional cloud & Autentikasi Admin |

---

## 📁 Struktur Utama

```
├── public/                 → Folder aset frontend (UI)
│   ├── index.html          → Halaman utama Dashboard & Tabel
│   ├── css/index.css       → Styling Tailwind
│   └── js/
│       ├── main.js         → Controller utama & event handler UI
│       ├── supabase.js     → Konfigurasi client Supabase
│       ├── alumni.js       → Logika CRUD data ke PostgreSQL
│       ├── dashboard.js    → Logika kalkulasi metrik & export data
│       ├── tracking.js     → Logika sinkronisasi PDDikti (Direct API)
│       └── enrichment.js   → Logika Smart Search, Google Dork & Heuristic
├── server.js               → Server Node.js (PDDikti Proxy & Puppeteer Scraper)
├── schema.sql              → Struktur tabel database PostgreSQL
└── schema_functions.sql    → Custom RPC (Remote Procedure Call) metrik evaluasi
```

---

## 🚀 Deployment

Karena aplikasi ini menggunakan Puppeteer dan akses API yang membutuhkan Server, aplikasi ini dibagi menjadi dua arsitektur deployment:

- **Frontend (UI)**: Di-deploy ke platform statis/modern seperti **Vercel** atau **Netlify**.
- **Backend (Node.js API)**: Di-deploy ke platform yang mendukung Node.js & Docker (untuk *headless browser*) seperti **Railway.app** atau **Render.com**.

---

## ⚙️ Quality Attributes

| Aspek | Deskripsi |
|---|---|
| Functionality | Seluruh siklus CRUD, verifikasi eksternal, dan kalkulasi statistik berfungsi penuh |
| Usability | UI Dashboard dirancang intuitif untuk pemrosesan data berjumlah masif (ribuan baris) |
| Performance | Direct API Intercept memotong waktu verifikasi menjadi hitungan milidetik per data |
| Reliability | Database PostgreSQL + Supabase menjaga konsistensi tipe data relasional dengan sangat ketat |

---

## 🧪 System Testing (Quality Assurance)

Pengujian aplikasi **Alumni Tracer Study System** dilakukan untuk memastikan bahwa antarmuka, logika bisnis, perhitungan skor metrik, dan sinkronisasi eksternal berjalan dengan baik.

| ID | Aspek Kualitas | Fitur yang Diuji | Skenario Pengujian | Ekspektasi Hasil | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **F-01** | Functionality | Autentikasi (Login) | Memasukkan kredensial admin yang valid via Supabase. | Pengguna berhasil masuk dan session token tersimpan. | ✅ PASS |
| **F-02** | Functionality | Import Data Massal | Upload file `.xlsx` berisi >1000 baris. | Data diproses bertahap (batch insertion) ke Supabase. | ✅ PASS |
| **F-03** | Functionality | Verifikasi PDDikti | Klik tombol Track pada salah satu profil alumni. | *Direct API fetch* berhasil mengambil status lulusan tanpa di-blokir CORS. | ✅ PASS |
| **F-04** | Functionality | Batch Verification | Jalankan sinkronisasi PDDikti secara massal. | Progress bar berjalan mulus, sistem memberikan jeda otomatis menghindari rate-limit. | ✅ PASS |
| **F-05** | Functionality | Auto Enrichment | Klik "Mulai Auto" di modal enrichment. | Node.js Server melakukan Google Dorking dan mengembalikan data (atau fallback heuristik). | ✅ PASS |
| **F-06** | Functionality | Metrik Dashboard | Merubah status alumni di database lalu memuat ulang. | Skor Coverage, Accuracy, dan Completeness langsung terkalkulasi oleh *RPC PostgreSQL*. | ✅ PASS |
| **F-07** | Functionality | Export Excel | Klik "Unduh Hasil Evaluasi" pada dashboard. | File Excel `.xlsx` terunduh dengan detail kolom No, Nama, NIM, Status, Nilai, & Sosmed. | ✅ PASS |
| **U-01** | Usability | Filter & Search | Mencari nama dengan huruf kecil/besar di kolom pencarian. | Hasil tabel mem-filter data secara efisien tanpa *lag*. | ✅ PASS |
| **R-01** | Reliability | Data Persistence | Memuat ulang (Refresh) browser saat memproses batch enrichment. | Sistem bisa dilanjutkan dari posisi terakhir tanpa merusak database. | ✅ PASS |

---

*© 2026 Alumni Tracer Study System — Universitas Muhammadiyah Malang*
