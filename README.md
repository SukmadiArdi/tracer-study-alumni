# Alumni Tracer Study System

Web-based tracer study system used to track alumni career outcomes.

## Features

- Admin Login
- Alumni Management
- Alumni Tracking (OSINT Simulation)
- Manual Verification
- Dashboard Statistics
- Cloud Database

## Technology

- HTML
- TailwindCSS
- JavaScript
- Firebase Firestore
- Chart.js

## Deployment

**Live Website** https://username.github.io/tracer-study-alumni/

**GitHub Repository** https://github.com/username/tracer-study-alumni

## Quality Attributes

| Aspect | Description |
|------|-------------|
| Functionality | All CRUD operations work |
| Usability | Simple admin dashboard |
| Efficiency | Fast data retrieval from Firebase |
| Reliability | Cloud database prevents data loss |

## System Testing (Quality Assurance)

Pengujian aplikasi **Alumni Tracer Study System** dilakukan untuk memastikan bahwa seluruh antarmuka, logika bisnis, dan integrasi *database* (Firebase) berjalan sesuai dengan aspek kualitas yang telah ditentukan pada desain Daily Project 2.

| ID | Aspek Kualitas | Fitur yang Diuji | Skenario Pengujian | Ekspektasi Hasil | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **F-01** | Functionality | Autentikasi (Login) | Memasukkan kredensial admin yang valid. | Pengguna berhasil masuk dan dialihkan ke halaman *Dashboard*. | ✅ PASS |
| **F-02** | Functionality | Autentikasi (Login) | Memasukkan kredensial admin yang salah. | Sistem menolak akses dan memunculkan *alert* peringatan. | ✅ PASS |
| **F-03** | Functionality | Create Alumni | Menambahkan data alumni baru via form Modal. | Modal tertutup, data tersimpan di *database*, dan muncul di tabel. | ✅ PASS |
| **F-04** | Functionality | Delete Alumni | Menekan tombol hapus (ikon tempat sampah) lalu "Yes". | Data terhapus dari *database* dan baris hilang dari tabel. | ✅ PASS |
| **F-05** | Functionality | Filter & Pencarian | Mengetikkan nama/NIM atau mengubah *dropdown* prodi/tahun. | Tabel memperbarui data yang ditampilkan secara *real-time*. | ✅ PASS |
| **F-06** | Functionality | OSINT Tracking (Single) | Mengklik ikon *Radar* pada salah satu alumni. | *Confidence score* dihitung, status berubah (Identified/Pending/Not Found). | ✅ PASS |
| **F-07** | Functionality | OSINT Tracking (Massal)| Mengklik tombol "Track All Pending". | Sistem melakukan *looping* otomatis untuk memproses semua data yang berstatus Pending/Not Found. | ✅ PASS |
| **F-08** | Functionality | Verifikasi Manual | Mengklik tombol "Confirm" pada halaman *Manual Verification*. | Status alumni menjadi 100% Identified, antrean verifikasi berkurang. | ✅ PASS |
| **U-01** | Usability | Dashboard Charts | Memuat halaman *Dashboard* setelah ada perubahan data. | Statistik (angka, *progress ring*, grafik batang) ter-*update* dengan akurat. | ✅ PASS |
| **U-02** | Usability | User Feedback | Melakukan aksi CRUD atau *Tracking*. | Muncul notifikasi *toast* interaktif sebagai *feedback* keberhasilan/proses. | ✅ PASS |
| **R-01** | Reliability | Persistensi Log | Melakukan *refresh* halaman (F5). | Data pada *Recent Activity* tidak hilang karena tersimpan di *LocalStorage*. | ✅ PASS |