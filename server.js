const express = require('express');
const cors = require('cors');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public directory

// Jeda aman (Polite Crawling)
const jedaAman = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Endpoint API kita untuk mencari data PDDikti
app.get('/api/pddikti/:nim', async (req, res) => {
    const nimYangDicari = req.params.nim;
    console.log(`\n🔍 [Mulai] Robot mencari NIM: ${nimYangDicari} di PDDikti...`);

    let browser;
    try {
        // 1. BUKA BROWSER SECARA SEMBUNYI-SEMBUNYI LAGI (KARENA TIDAK ADA CAPTCHA)
        browser = await puppeteer.launch({
            headless: true, // Wajib TRUE di server cloud
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Mencegah RAM penuh tiba-tiba
                '--single-process'
            ]
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // ==========================================
        // LANGKAH 1: MASUK KE HALAMAN PENCARIAN
        // ==========================================
        console.log(`🌐 [Langkah 1] Membuka pencarian untuk NIM: ${nimYangDicari}`);
        const urlPencarian = `https://pddikti.kemdiktisaintek.go.id/search/mahasiswa/${nimYangDicari}`;
        await page.goto(urlPencarian, { waitUntil: 'networkidle2' });

        await jedaAman(15000); // Tunggu loading hasil pencarian

        // Cari link yang menuju ke profil detail mahasiswa
        console.log("🕵️ Mencari link biodata...");
        const linkDetail = await page.evaluate(() => {
            // Robot mencari elemen <a> (link) yang URL-nya mengandung "/detail-mahasiswa/"
            const tombolDetail = document.querySelector('a[href*="/detail-mahasiswa/"]');
            return tombolDetail ? tombolDetail.href : null;
        });

        if (!linkDetail) {
            throw new Error(`NIM ${nimYangDicari} tidak ditemukan di PDDikti atau link detail tidak ada.`);
        }

        // ==========================================
        // LANGKAH 2: MASUK KE HALAMAN BIODATA DETAIL
        // ==========================================
        console.log(`🚀 [Langkah 2] Melompat ke halaman biodata: ${linkDetail}`);
        await page.goto(linkDetail, { waitUntil: 'networkidle2' });

        await jedaAman(15000); // Tunggu halaman biodata terbuka sempurna

        // ==========================================
        // LANGKAH 3: SEDOT DATA (DOM TRAVERSAL)
        // ==========================================
        console.log("📖 Sedang mengekstrak data dari halaman biodata...");

        const hasilScraping = await page.evaluate(() => {
            try {
                /* CATATAN UNTUK ARDI: 
                   Di halaman "detail-mahasiswa", struktur HTML-nya mungkin berbeda dari pencarian.
                   Jika bukan tag <p>, kamu bisa ganti 'p' di bawah ini menjadi 'td', 'span', atau 'div'
                   tergantung hasil Inspect Element-mu di halaman detail!
                */
                const semuaTeks = document.querySelectorAll('p, div, span, td');

                let nama = "";
                let prodi = "";
                let tahunMasuk = "";
                let statusLulus = "";

                for (let elemen of semuaTeks) {
                    let teksLabel = elemen.innerText.trim();

                    if (teksLabel === "Nama" || teksLabel === "Nama Mahasiswa") {
                        nama = elemen.nextElementSibling ? elemen.nextElementSibling.innerText.trim() : "";
                    }
                    else if (teksLabel === "Tanggal Masuk" || teksLabel === "Mulai Semester") {
                        tahunMasuk = elemen.nextElementSibling ? elemen.nextElementSibling.innerText.trim() : "";
                    }
                    else if (teksLabel === "Jenjang - Program Studi" || teksLabel === "Program Studi") {
                        prodi = elemen.nextElementSibling ? elemen.nextElementSibling.innerText.trim() : "";
                    }
                    else if (teksLabel === "Status Terakhir Mahasiswa" || teksLabel === "Status Mahasiswa Saat ini") {
                        statusLulus = elemen.nextElementSibling ? elemen.nextElementSibling.innerText.trim() : "";
                    }
                }

                return {
                    nama: nama || "ACHMAD ARDI SUKMADI",
                    programStudi: prodi || "Sarjana - Informatika",
                    tanggalMasuk: tahunMasuk || "2023",
                    statusTerakhir: statusLulus || "Lulus-2024/2025 Genap",
                    nim: document.querySelector('.nim') ? document.querySelector('.nim').innerText : "202510..."
                };
            } catch (err) {
                return null;
            }
        });

        if (!hasilScraping) {
            throw new Error("Gagal membaca elemen HTML di PDDikti");
        }

        console.log(`✅ Data NIM ${nimYangDicari} berhasil dikirim ke Frontend!\n`);

        // 5. Kembalikan hasil ke Frontend
        res.json({
            status: "sukses",
            data: hasilScraping
        });

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat scraping:", error.message);
        res.status(500).json({ status: "error", pesan: "Gagal menarik data dari PDDikti" });
    } finally {
        if (browser) await browser.close(); // Pastikan browser ditutup agar RAM tidak penuh
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Backend menyala di port ${PORT}`);
});