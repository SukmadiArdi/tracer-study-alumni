const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const puppeteer  = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Daftar User-Agent untuk dirotasi
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];
const acakUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public directory

// Jeda aman (Polite Crawling)
const jedaAman = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ===== NORMALISASI NAMA (hilangkan karakter pengganggu) =====
function normalisasiNama(nama) {
    return nama
        .toLowerCase()
        // Hapus gelar/titel umum di awal atau akhir nama
        .replace(/\b(drs?|dr|prof|ir|hj?|m\.?si|s\.?kom|s\.?pd|s\.?h|m\.?m|m\.?pd|apt|st|se)\b\.?/gi, '')
        // Ganti apostrof & tanda kutip berbagai jenis menjadi spasi
        .replace(/[''`'"]/g, ' ')
        // Hilangkan tanda hubung (nama majemuk tetap terbaca per kata)
        .replace(/[-_]/g, ' ')
        // Hilangkan tanda baca lain (titik, koma, kurung, dll)
        .replace(/[^a-z0-9\s]/g, '')
        // Hilangkan huruf vokal/konsonan tunggal yang tidak bermakna
        .replace(/\b[b-df-hj-np-tv-z]\b/gi, '') // Hapus konsonan tunggal (inisial)
        // Normalkan multiple spasi menjadi 1 spasi
        .replace(/\s+/g, ' ')
        .trim();
}

// Endpoint API untuk mencari data PDDikti (Cek ketersediaan NIM via API JSON langsung — tanpa Puppeteer)
app.get('/api/pddikti/:nim', async (req, res) => {
    const nimYangDicari = req.params.nim;
    console.log(`\n🔍 [PDDikti] Cek NIM: ${nimYangDicari}`);

    try {
        // Langsung hit API JSON resmi PDDikti (ditemukan dari monitoring Network Tab)
        const apiUrl = `https://api-pddikti.kemdiktisaintek.go.id/pencarian/mhs/${nimYangDicari}/`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://pddikti.kemdiktisaintek.go.id/',
                'Origin': 'https://pddikti.kemdiktisaintek.go.id',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(10000) // Timeout 10 detik
        });

        if (!response.ok) {
            console.log(`⚠️ API PDDikti merespon ${response.status} untuk NIM ${nimYangDicari}`);
            return res.json({ status: 'sukses', data: null });
        }

        const rawText = await response.text();
        const data = JSON.parse(rawText);
        
        let ditemukan = null;

        // Format 1: API mengembalikan satu objek langsung (NIM exact match)
        // Contoh: { id, nim, nama, nama_pt, nama_prodi, ... }
        if (data?.nim === nimYangDicari) {
            ditemukan = data;
        }
        // Format 2: API mengembalikan daftar (fuzzy search)
        // Contoh: { mahasiswa: [...], Count: 50 }
        else if (Array.isArray(data?.mahasiswa)) {
            ditemukan = data.mahasiswa.find(m => m.nim === nimYangDicari) || null;
        }
        // Fallback: cek apakah NIM muncul di raw JSON body
        else if (rawText.includes(nimYangDicari)) {
            ditemukan = { nim: nimYangDicari, nama: '—', nama_pt: 'UMM', nama_prodi: '—' };
        }

        if (ditemukan) {
            console.log(`✅ NIM ${nimYangDicari} DITEMUKAN: ${ditemukan.nama} (${ditemukan.nama_prodi})`);
            res.json({
                status: 'sukses',
                data: {
                    nim: ditemukan.nim,
                    nama: ditemukan.nama,
                    namaPt: ditemukan.nama_pt,
                    namaProdi: ditemukan.nama_prodi,
                    keterangan: 'Ditemukan di PDDikti'
                }
            });
        } else {
            console.log(`❌ NIM ${nimYangDicari} tidak ditemukan di antara ${data?.mahasiswa?.length || 0} hasil.`);
            res.json({ status: 'sukses', data: null });
        }

    } catch (error) {
        console.error(`❌ Gagal menghubungi API PDDikti:`, error.message);
        res.status(500).json({ status: 'error', pesan: 'Gagal menghubungi API PDDikti' });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Backend menyala!`);
    console.log(`   ➜  Local:   http://localhost:${PORT}`);
    console.log(`   ➜  Network: http://0.0.0.0:${PORT}`);
});


// ================================================================
//  LEVENSHTEIN DISTANCE — Pengukur kemiripan dua string
// ================================================================
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

// Hitung skor kemiripan nama (0–100), makin tinggi makin mirip
function skorKemiripanNama(namaDb, namaDitemukan) {
    const a = namaDb.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const b = namaDitemukan.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length, 1);
    return Math.round((1 - dist / maxLen) * 100);
}

// ================================================================
//  ENDPOINT: ENRICHMENT via Google Dorking (v3 — Full Strategy)
//  GET /api/enrichment/:nim?nama=...&program=...&tahun=...
// ================================================================
app.get('/api/enrichment/:nim', async (req, res) => {
    const nim       = req.params.nim;
    const nama      = (req.query.nama     || '').trim();
    const program   = (req.query.program  || '').trim();
    const tahun     = (req.query.tahun    || '').trim();
    const institusi = 'Universitas Muhammadiyah Malang';
    const pt        = 'UMM';

    console.log(`\n🔎 [Enrichment v3] NIM:${nim} | "${nama}" | ${program} | ${tahun}`);
    if (!nama) return res.status(400).json({ status: 'error', pesan: 'nama wajib' });

    // Jeda acak mirip manusia
    const jedaManusia = (min = 3000, max = 7000) =>
        jedaAman(Math.floor(Math.random() * (max - min + 1)) + min);
    const bersih = s => (s || '').replace(/\s+/g, ' ').trim();

    // Query blocks
    const Q = {
        nama:      `"${nama}"`,
        namaInst:  `"${nama}" "${institusi}"`,
        namaProdi: `"${nama}" "${program}" "${pt}"`,
        namaTahun: `"${nama}" "${tahun}" "${pt}"`,
    };

    const hasil = {
        linkedin: '', instagram: '', facebook: '', tiktok: '', portfolio: '',
        email: '', noHp: '', tempatKerja: '', posisi: '',
        statusKerja: '', alamatKerja: '', cvUrl: '',
        sumber: [], skorNama: {},
    };

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
        });
        const page = await browser.newPage();
        await page.setUserAgent(acakUA());
        page.setDefaultTimeout(30000);

        // --------------------------------------------------------
        // CORE HELPER: Scrape Google SERP (Selector diperbarui 2025)
        // --------------------------------------------------------
        async function googleDork(query, maxHasil = 8) {
            const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=id&gl=id`;
            console.log(`   🔍 ${query.substring(0, 100)}`);
            try {
                // networkidle2: tunggu sampai JS selesai render (penting untuk Google)
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await jedaManusia(2000, 4000);

                // Cek CAPTCHA / unusual traffic
                const pageText = await page.evaluate(() => document.body?.innerText || '');
                if (/unusual traffic|captcha|i'm not a robot|lalu lintas yang tidak wajar/i.test(pageText)) {
                    console.warn('   ⚠️ CAPTCHA! Jeda 30 detik...');
                    await jedaAman(30000);
                    return [];
                }

                const items = await page.evaluate((max) => {
                    const results = [];
                    const seen = new Set();

                    // ============================================================
                    // STRATEGI 1 (UTAMA — Struktur Google 2025):
                    //   Google sekarang menggunakan `a.zReHs` langsung sebagai
                    //   elemen link yang wraps h3 judul. Tidak ada lagi div.tF2Cxc.
                    //   Struktur baru:
                    //     <a class="zReHs" href="...">
                    //       <h3>Judul Hasil</h3>
                    //     </a>
                    //     <cite class="qLRx3b ...">URL terlihat</cite>
                    // ============================================================
                    const primaryLinks = document.querySelectorAll('a.zReHs[href]');

                    for (const a of primaryLinks) {
                        const href = a.getAttribute('href') || a.href || '';
                        if (!href || !href.startsWith('http') || href.includes('google.com') || seen.has(href)) continue;
                        seen.add(href);

                        const h3 = a.querySelector('h3');
                        const title = h3?.innerText?.trim() || a.innerText?.trim() || '';

                        // Breadcrumb: cite yang paling dekat (sibling atau dekat dalam DOM)
                        let crumb = '';
                        let el = a.parentElement;
                        for (let i = 0; i < 5 && el; i++) {
                            const c = el.querySelector('cite');
                            if (c) { crumb = c.innerText?.trim() || ''; break; }
                            el = el.parentElement;
                        }

                        // Snippet: cari div teks di dekat link yang bukan heading
                        let snippet = '';
                        let elSnip = a.parentElement;
                        for (let i = 0; i < 5 && elSnip; i++) {
                            // Cari semua div/span yang punya teks cukup panjang bukan h3
                            const divs = elSnip.querySelectorAll('div, span');
                            for (const d of divs) {
                                if (d.querySelector('h3, a')) continue; // skip jika ada nested heading/link
                                const t = d.innerText?.trim() || '';
                                if (t.length > 40 && t.length < 400) { snippet = t; break; }
                            }
                            if (snippet) break;
                            elSnip = elSnip.parentElement;
                        }

                        results.push({ url: href, title, snippet, breadcrumb: crumb });
                        if (results.length >= max) break;
                    }

                    // ============================================================
                    // STRATEGI 2 (FALLBACK — kalau a.zReHs tidak ada):
                    //   Gunakan data-hveid sebagai penanda kartu hasil
                    // ============================================================
                    if (results.length === 0) {
                        const hveidCards = document.querySelectorAll('div[data-hveid]');
                        for (const card of hveidCards) {
                            const a = card.querySelector('a[href]');
                            if (!a) continue;
                            const href = a.getAttribute('href') || '';
                            if (!href.startsWith('http') || href.includes('google.com') || seen.has(href)) continue;
                            seen.add(href);
                            const h3 = card.querySelector('h3');
                            const cite = card.querySelector('cite');
                            results.push({
                                url:        href,
                                title:      h3?.innerText?.trim() || '',
                                snippet:    '',
                                breadcrumb: cite?.innerText?.trim() || '',
                            });
                            if (results.length >= max) break;
                        }
                    }

                    // ============================================================
                    // STRATEGI 3 (LAST RESORT — tangkap semua link non-Google):
                    // ============================================================
                    if (results.length === 0) {
                        const allA = document.querySelectorAll('a[href]');
                        for (const a of allA) {
                            const href = a.getAttribute('href') || '';
                            if (!href.startsWith('http') || href.includes('google') || seen.has(href)) continue;
                            // Skip link navigasi (About, Settings, dsb.) yg sangat pendek
                            if ((a.innerText?.trim() || '').length < 5) continue;
                            seen.add(href);
                            const h3 = a.querySelector('h3');
                            results.push({
                                url:        href,
                                title:      h3?.innerText?.trim() || a.innerText?.slice(0, 100).trim() || '',
                                snippet:    '',
                                breadcrumb: '',
                            });
                            if (results.length >= max) break;
                        }
                    }

                    return results;
                }, maxHasil);

                console.log(`      → ${items.length} hasil | ${items[0]?.url?.substring(0, 60) || '-'}`);
                return items;
            } catch (e) {
                console.warn(`   ⚠️ Dork error: ${e.message}`);
                return [];
            }
        }


        // Validasi nama pakai Levenshtein (threshold 55% mirip)
        function namaValid(teks, threshold = 55) {
            const skor = skorKemiripanNama(nama, teks);
            return skor >= threshold;
        }

        // Validasi kata kunci ada di teks
        function mengandungNama(teks, minKata = 2) {
            const kata = nama.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
            return kata.filter(w => teks.toLowerCase().includes(w)).length >= Math.min(minKata, kata.length);
        }

        // =====================================================
        // TAHAP 0: MASTER QUERY — Gambaran umum semua sosmed
        // =====================================================
        console.log('\n   🌐 [0] Master Query (gambaran semua sosmed)...');
        const master = await googleDork(
            `${Q.namaProdi} (site:linkedin.com OR site:instagram.com OR site:facebook.com OR site:tiktok.com)`
        );
        // Isi slot dari master query sebagai bootstrap
        for (const r of master) {
            const teks = r.title + ' ' + r.snippet + ' ' + r.breadcrumb;
            if (!hasil.linkedin && r.url.includes('linkedin.com/in/') && mengandungNama(teks)) {
                hasil.linkedin = r.url.split('?')[0];
            }
            if (!hasil.instagram && r.url.includes('instagram.com/') &&
                !r.url.match(/\/(p|reel|explore)\//)) {
                hasil.instagram = r.url.split('?')[0];
            }
            if (!hasil.facebook && r.url.includes('facebook.com/') &&
                !r.url.match(/\/(pages|groups|events)\//)) {
                hasil.facebook = r.url.split('?')[0];
            }
        }
        await jedaManusia(4000, 7000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 1: LINKEDIN (Akurasi Terbaik)
        // =====================================================
        console.log('   🔗 [1] LinkedIn — Breadcrumb Check...');
        if (!hasil.linkedin) {
            let rLI = await googleDork(`site:id.linkedin.com/in/ ${Q.namaInst}`);
            if (!rLI.length) rLI = await googleDork(`site:linkedin.com/in ${Q.namaInst}`);
            if (!rLI.length) rLI = await googleDork(`site:linkedin.com/in ${Q.namaProdi}`);

            for (const r of rLI) {
                if (!r.url.includes('linkedin.com/in/')) continue;
                const teksGabung = r.title + ' ' + r.snippet + ' ' + r.breadcrumb;

                // Breadcrumb check: makin akurat jika ada nama prodi + institusi
                const adaInstitusi = teksGabung.toLowerCase().includes('muhammadiyah') ||
                                     teksGabung.toLowerCase().includes('umm');
                const adaProdi     = program && teksGabung.toLowerCase().includes(program.toLowerCase().split(' ')[0]);
                const levSkor      = skorKemiripanNama(nama, r.title);

                if (levSkor >= 50 || (mengandungNama(teksGabung) && adaInstitusi)) {
                    hasil.linkedin = r.url.split('?')[0];
                    hasil.sumber.push(`LinkedIn(skor:${levSkor}%)`);
                    hasil.skorNama.linkedin = levSkor;

                    // 💡 Breadcrumb confidence level
                    const conf = adaInstitusi && adaProdi ? '95%' : adaInstitusi ? '80%' : '65%';
                    console.log(`      ✅ LinkedIn (conf:${conf}): ${hasil.linkedin}`);

                    // Ekstrak posisi & perusahaan dari snippet (pola "Jabatan · Perusahaan")
                    const mAt = r.snippet.match(/([A-Za-z][\w\s]{2,30})\s*(?:at|di|@|·)\s*([A-Za-z0-9][\w\s.,&-]{2,40})/i);
                    if (mAt && !hasil.posisi) {
                        hasil.posisi      = bersih(mAt[1]);
                        hasil.tempatKerja = bersih(mAt[2]);
                        hasil.sumber.push('kerja-linkedin');
                        console.log(`      💼 Posisi: ${hasil.posisi} @ ${hasil.tempatKerja}`);
                    }
                    break;
                }
            }
        }
        await jedaManusia(4000, 8000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 2: INSTAGRAM
        // =====================================================
        console.log('   📸 [2] Instagram...');
        if (!hasil.instagram) {
            // Instagram: HANYA nama, tanpa institusi (terlalu ketat)
            const rIG = await googleDork(`site:instagram.com "${nama}"`);
            for (const r of rIG) {
                if (!r.url.match(/instagram\.com\/[a-zA-Z0-9_.]+\/?$/)) continue;
                if (/\/(p|reel|explore|stories)\//.test(r.url)) continue;
                // Cukup 1 kata nama cocok untuk Instagram (nama di bio biasanya tidak lengkap)
                if (!mengandungNama(r.title + ' ' + r.snippet, 1)) continue;
                hasil.instagram = r.url.split('?')[0];
                hasil.sumber.push('Instagram');
                console.log(`      ✅ Instagram: ${hasil.instagram}`);
                break;
            }
        }
        await jedaManusia(4000, 8000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 3: FACEBOOK
        // =====================================================
        console.log('   💙 [3] Facebook...');
        if (!hasil.facebook) {
            const rFB = await googleDork(`site:facebook.com ${Q.namaInst} -pages -groups -events`);
            for (const r of rFB) {
                if (/\/(pages|groups|events|share|photo|video|reel)\//.test(r.url)) continue;
                if (!mengandungNama(r.title + ' ' + r.snippet, 1)) continue;
                hasil.facebook = r.url.split('?')[0];
                hasil.sumber.push('Facebook');
                console.log(`      ✅ Facebook: ${hasil.facebook}`);
                break;
            }
        }
        await jedaManusia(4000, 8000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 4: PORTOFOLIO (GitHub, Behance, Dribbble)
        // =====================================================
        console.log('   🎨 [4] Portofolio / GitHub...');
        const rPort = await googleDork(
            `${Q.namaInst} (site:github.com OR site:behance.net OR site:dribbble.com OR site:gitlab.com)`
        );
        for (const r of rPort) {
            if (mengandungNama(r.title + ' ' + r.snippet, 1)) {
                hasil.portfolio = r.url.split('?')[0];
                hasil.sumber.push('Portofolio:' + (new URL(r.url).hostname.replace('www.', '')));
                console.log(`      ✅ Portofolio: ${hasil.portfolio}`);
                break;
            }
        }
        await jedaManusia(4000, 7000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 5: EMAIL & NO HP (Harta Karun)
        // =====================================================
        console.log('   📧 [5] Email & HP...');

        // 5a. Email dari query langsung
        const rEmail = await googleDork(`${Q.namaProdi} "@gmail.com" OR "@yahoo.com" OR "@umm.ac.id"`);
        for (const r of rEmail) {
            const em = (r.title + ' ' + r.snippet).match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
            if (em && !hasil.email && mengandungNama(r.title + r.snippet, 1)) {
                hasil.email = em[0].toLowerCase();
                hasil.sumber.push('Email');
                console.log(`      ✅ Email: ${hasil.email}`);
                break;
            }
        }

        // 5b. Email dari repository UMM (lembar pengesahan skripsi)
        if (!hasil.email) {
            const rUMM = await googleDork(`site:umm.ac.id ${Q.namaProdi} "@gmail.com"`);
            for (const r of rUMM) {
                const em = (r.title + ' ' + r.snippet).match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
                if (em && mengandungNama(r.snippet, 1)) {
                    hasil.email = em[0].toLowerCase();
                    hasil.sumber.push('Email-UMM');
                    console.log(`      ✅ Email (UMM repo): ${hasil.email}`);
                    break;
                }
            }
        }

        // 5c. CV/Resume PDF
        if (!hasil.cvUrl) {
            const rCV = await googleDork(`filetype:pdf ${Q.namaProdi} (intitle:CV OR intitle:Resume OR intitle:Curriculum)`);
            for (const r of rCV) {
                if (r.url.match(/\.pdf$/i) && mengandungNama(r.title + r.snippet, 1)) {
                    hasil.cvUrl = r.url;
                    hasil.sumber.push('CV-PDF');
                    console.log(`      ✅ CV PDF: ${hasil.cvUrl}`);
                    // Coba ekstrak email dari snippet CV
                    const em = (r.snippet).match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
                    if (em && !hasil.email) { hasil.email = em[0].toLowerCase(); }
                    break;
                }
            }
        }

        // 5d. No HP / WhatsApp — TANPA institusi (data HP jarang menyebut kampus)
        const rHP = await googleDork(`"${nama}" ("wa.me" OR "0812" OR "0813" OR "0821" OR "0822" OR "0857" OR "0858" OR "628")`);
        for (const r of rHP) {
            const teks = r.title + ' ' + r.snippet;
            const waMe = teks.match(/wa\.me\/(\d+)/);
            const hp   = teks.match(/(\+62|628|08)[\d]{9,11}/);
            if (waMe && !hasil.noHp) {
                hasil.noHp = '0' + waMe[1].replace(/^62/, '');
                hasil.sumber.push('WhatsApp');
                console.log(`      ✅ WA: ${hasil.noHp}`);
            } else if (hp && !hasil.noHp) {
                hasil.noHp = hp[0].replace('+62', '0').replace(/^628/, '08');
                hasil.sumber.push('NoHP');
                console.log(`      ✅ HP: ${hasil.noHp}`);
            }
        }
        await jedaManusia(4000, 8000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 6: PNS / ASN CHECK
        // =====================================================
        console.log('   🏛️ [6] PNS / ASN Check...');
        if (!hasil.statusKerja) {
            const rPNS = await googleDork(`site:*.go.id ${Q.nama} ("NIP" OR "CPNS" OR "PPPK" OR "ASN" OR "LHKPN")`);
            const pnsHit = rPNS.find(r => mengandungNama(r.title + r.snippet, 1));
            if (pnsHit) {
                hasil.statusKerja = 'PNS';
                hasil.sumber.push('PNS-gov');
                const domain = pnsHit.url.match(/https?:\/\/([^/]+)/)?.[1] || '';
                if (!hasil.tempatKerja) hasil.tempatKerja = domain;
                console.log(`      ✅ PNS di: ${domain}`);
            }
        }
        await jedaManusia(3000, 6000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 7: WIRAUSAHA / OWNER / FOUNDER
        // =====================================================
        console.log('   🚀 [7] Wirausaha / Owner...');
        if (!hasil.statusKerja) {
            const rWira = await googleDork(
                `${Q.namaInst} (intitle:Owner OR intitle:Founder OR intitle:CEO) "Malang"`
            );
            for (const r of rWira) {
                if (!mengandungNama(r.title + r.snippet, 1)) continue;
                hasil.statusKerja = 'Wirausaha';
                hasil.sumber.push('Wirausaha-web');
                const mCo = r.snippet.match(/(?:Founder|Owner|CEO)\s+(?:of|at|di)?\s*([A-Z][\w\s.,&-]{2,40})/i);
                if (mCo && !hasil.tempatKerja) {
                    hasil.tempatKerja = bersih(mCo[1]);
                    console.log(`      ✅ Wirausaha: ${hasil.tempatKerja}`);
                }
                break;
            }
        }
        await jedaManusia(3000, 6000);
        await page.setUserAgent(acakUA());

        // =====================================================
        // TAHAP 8: INFO KERJA SWASTA (jika belum ditemukan)
        // =====================================================
        if (!hasil.tempatKerja) {
            console.log('   💼 [8] Info kerja swasta...');
            const rKerja = await googleDork(
                `${Q.namaInst} ("bekerja di" OR "works at" OR "Engineer" OR "Manager" OR "Staff" OR "Guru" OR "Dosen") -site:instagram.com`
            );
            for (const r of rKerja) {
                if (!mengandungNama(r.title + r.snippet, 1)) continue;
                const mKerja = r.snippet.match(/(?:bekerja di|works at|at)\s+([A-Z][\w\s.,&-]{2,40})/i);
                if (mKerja) {
                    hasil.tempatKerja = bersih(mKerja[1]);
                    hasil.statusKerja = hasil.statusKerja || 'Swasta';
                    hasil.sumber.push('kerja-web');
                    console.log(`      ✅ Kerja: ${hasil.tempatKerja}`);
                    break;
                }
            }

            // TAHAP 8b: Cari sosmed perusahaan (jika tempat kerja sudah diketahui)
            if (hasil.tempatKerja) {
                await jedaManusia(3000, 5000);
                const rCo = await googleDork(
                    `"${hasil.tempatKerja}" (site:instagram.com OR site:facebook.com) (intitle:Kontak OR intitle:About OR intitle:Alamat)`
                );
                for (const r of rCo) {
                    if (!hasil.alamatKerja) {
                        const mAlamat = r.snippet.match(/(?:Jl\.|Jalan|Alamat:?)\s+[\w\s.,]+/i);
                        if (mAlamat) hasil.alamatKerja = bersih(mAlamat[0]);
                    }
                }
            }
        }

        // =====================================================
        // INFER STATUS KERJA DARI NAMA PERUSAHAAN
        // =====================================================
        if (hasil.tempatKerja && !hasil.statusKerja) {
            const lwr = hasil.tempatKerja.toLowerCase();
            if (['kementerian','dinas','badan','pemerintah','rsud','puskesmas','sdn','sman','polri','tni','go.id','negeri','bpjs','bkn','komisi'].some(k => lwr.includes(k))) {
                hasil.statusKerja = 'PNS';
            } else if (['cv.','cv ','ud.','toko','warung','founder','owner','usaha','freelance','wiraswasta','startup','konsultan'].some(k => lwr.includes(k))) {
                hasil.statusKerja = 'Wirausaha';
            } else {
                hasil.statusKerja = 'Swasta';
            }
        }

        // Ringkasan
        const jmlSumber = [...new Set(hasil.sumber.map(s => s.split('(')[0]))].length;
        console.log(`\n✅ Enrichment selesai. ${jmlSumber} sumber: [${hasil.sumber.join(', ')}]\n`);
        res.json({ status: 'sukses', data: hasil });

    } catch (err) {
        console.error('❌ Enrichment error:', err.message);
        res.status(500).json({ status: 'error', pesan: err.message });
    } finally {
        if (browser) await browser.close();
    }
});
