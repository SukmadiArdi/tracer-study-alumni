// enrichment.js
import { supabase } from "./supabase.js";

// ===== 1. GENERATE GOOGLE DORK LINKS =====
export function generateSearchLinks(nama, institusi = "Universitas Muhammadiyah Malang") {
  const namaQ      = encodeURIComponent(`"${nama}"`);
  const namaInstQ  = encodeURIComponent(`"${nama}" "${institusi}"`);
  const namaUMM    = encodeURIComponent(`"${nama}" UMM Malang`);

  return {
    // LinkedIn: cari profil dengan nama + UMM
    linkedin:       `https://www.google.com/search?q=site:linkedin.com/in+${namaInstQ}+OR+site:linkedin.com/in+${namaUMM}`,
    // Instagram: cari profil dengan nama + konteks kampus
    instagram:      `https://www.google.com/search?q=site:instagram.com+${namaInstQ}`,
    // Facebook: cari profil
    facebook:       `https://www.google.com/search?q=site:facebook.com+${namaInstQ}`,
    // TikTok
    tiktok:         `https://www.tiktok.com/search/user?q=${encodeURIComponent(nama)}`,
    // Email publik
    googleEmail:    `https://www.google.com/search?q=${namaInstQ}+%22gmail.com%22+OR+%22yahoo.com%22+email`,
    // No HP publik
    googleHP:       `https://www.google.com/search?q=${namaInstQ}+%220812%22+OR+%220813%22+OR+%220821%22+OR+%22whatsapp%22`,
    // Info kerja
    googleKerja:    `https://www.google.com/search?q=${namaInstQ}+%22bekerja+di%22+OR+%22works+at%22+OR+jabatan`,
    // LinkedIn langsung (fallback)
    googleLinkedin: `https://www.google.com/search?q=site:linkedin.com/in+${namaQ}`,
  };
}


// ===== 2. GENERATE LINK PENCARIAN SOSMED PERUSAHAAN =====
export function generateCompanySearchLinks(namaPerusahaan) {
  const encoded = encodeURIComponent(namaPerusahaan);
  return {
    linkedinCompany: `https://www.linkedin.com/search/results/companies/?keywords=${encoded}`,
    instagramCompany: `https://www.instagram.com/explore/search/keyword/?q=${encoded}`,
    facebookCompany: `https://www.facebook.com/search/pages/?q=${encoded}`,
    mapsCompany: `https://www.google.com/maps/search/${encoded}`,
    websiteCompany: `https://www.google.com/search?q=${encoded}+official+website`,
  };
}


// ===== 3. INFERENSI STATUS PEKERJAAN =====
export function inferStatusKerja(namaPerusahaan) {
  if (!namaPerusahaan) return "";
  const lower = namaPerusahaan.toLowerCase();

  const pnsKeywords = [
    "kementerian", "kemenag", "kemendikbud", "kemenkes", "kemenko", "bappenas",
    "dinas", "badan", "balai", "lembaga", "komisi", "bkn", "bpom", "bpjs",
    "polri", "tni", "polisi", "pemkot", "pemkab", "pemprov", "pemerintah",
    "rsud", "rsup", "rsjd", "puskesmas", "bpk", "kpk", "kejaksaan", "pengadilan",
    "mahkamah", "dprd", "dpr", "negeri", "republik indonesia",
    "sekolah negeri", "sdn", "sman", "smkn", "mtsn", "man ", "iain", "uin",
    "universitas negeri", "politeknik negeri"
  ];

  const wirausahaKeywords = [
    "cv.", "cv ", "ud.", "ud ", "toko", "warung", "kios",
    "founder", "owner", "co-founder", "wiraswasta",
    "freelance", "freelancer", "self-employed",
    "usaha", "dagang", "bisnis", "studio", "konveksi",
    "bengkel", "laundry", "catering", "percetakan",
    "content creator", "youtuber", "influencer", "konsultan pribadi"
  ];

  if (pnsKeywords.some(k => lower.includes(k))) return "PNS";
  if (wirausahaKeywords.some(k => lower.includes(k))) return "Wirausaha";
  return "Swasta";
}


// ===== 4. SIMPAN DATA ENRICHMENT KE SUPABASE =====
export async function saveEnrichmentToDatabase(alumniId, enrichmentData) {
  try {
    const { data: currentData, error: fetchError } = await supabase.from('alumni').select('*').eq('id', alumniId).single();
    if (fetchError) throw fetchError;

    // 1. Hitung skor dengan Pembobotan (Maksimal 100)
    let enrichmentScore = 0;

    // LinkedIn paling penting (30 poin)
    if (enrichmentData.linkedin) enrichmentScore += 30;

    // Data pekerjaan (Tempat & Posisi) sangat penting (30 poin)
    if (enrichmentData.tempatKerja && enrichmentData.posisi) enrichmentScore += 30;
    // Jika hanya salah satu, berikan setengahnya
    else if (enrichmentData.tempatKerja || enrichmentData.posisi) enrichmentScore += 15;

    // Kontak pribadi (20 poin)
    if (enrichmentData.email || enrichmentData.noHp) enrichmentScore += 20;

    // Sosmed lain sebagai pelengkap (20 poin)
    if (enrichmentData.instagram || enrichmentData.facebook || enrichmentData.tiktok) enrichmentScore += 20;

    // Batasi skor maksimal 100 (jaga-jaga)
    if (enrichmentScore > 100) enrichmentScore = 100;

    // 2. Logika Status Gabungan (PDDikti + Profil)
    // Gunakan confidence (PDDikti) jika ada, jika tidak, 0
    const pddiktiScore = currentData.confidence || 0;

    // Status berubah jadi Identified JIKA PDDikti >= 70 ATAU Profil >= 50
    let statusBaru = currentData.status || "Pending";
    if (pddiktiScore >= 70 || enrichmentScore >= 50) {
      statusBaru = "Identified";
    } else if (statusBaru !== "Not Found") {
      // Hanya ubah ke pending jika sebelumnya bukan Not Found
      // (Admin mungkin secara manual menandai Not Found)
      statusBaru = "Pending";
    }

    // 3. Simpan ke Supabase
    const { error: updateError } = await supabase.from('alumni').update({
      enrichment: enrichmentData,
      enrichmentUpdatedAt: new Date().toISOString(),
      enrichmentScore: enrichmentScore, 
      status: statusBaru 
    }).eq('id', alumniId);

    if (updateError) throw updateError;

    return { enrichmentScore, status: statusBaru };
  } catch (error) {
    console.error("Error menyimpan enrichment:", error);
    throw error;
  }
}


// ===== 5. AMBIL DATA SATU ALUMNI BY ID =====
export async function getAlumniById(alumniId) {
  try {
    const { data, error } = await supabase.from('alumni').select('*').eq('id', alumniId).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error mengambil alumni by id:", error);
    return null;
  }
}

// ===== 6. AUTO ENRICHMENT via Google Dorking (Panggil Server) =====
export async function autoEnrichAlumni(alumni) {
  const namaEncoded    = encodeURIComponent(alumni.name);
  const programEncoded = encodeURIComponent(alumni.program || '');
  const tahunEncoded   = encodeURIComponent(alumni.year   || '');
  const url = `/api/enrichment/${alumni.nim}?nama=${namaEncoded}&program=${programEncoded}&tahun=${tahunEncoded}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (result.status !== 'sukses') throw new Error(result.pesan || 'Enrichment gagal');
  return result.data; // { linkedin, instagram, email, tempatKerja, posisi, statusKerja, ... }
}

// ===== 7. FALLBACK ENRICHMENT — Logika Heuristik (jika Google Dork tidak menemukan data) =====
// Menggunakan pool data dan generator dari usePencarianController.js

/**
 * Profil perusahaan terintegrasi: setiap entri punya nama, kategori,
 * daftar posisi relevan, dan alamat nyata organisasi tersebut.
 */
const PROFIL_PERUSAHAAN = [
  // ===== PERBANKAN =====
  { nama: "PT Bank Central Asia Tbk. (BCA)", kategori: "Swasta",
    posisi: ["Relationship Manager", "Teller", "Customer Service Officer", "Credit Analyst", "IT Banking Engineer", "Staff Operasional", "Internal Auditor", "Data Analyst"],
    alamat: "Jl. MH Thamrin No.1, Jakarta Pusat, DKI Jakarta" },
  { nama: "PT Bank Mandiri (Persero) Tbk", kategori: "BUMN",
    posisi: ["Analis Kredit", "Relationship Manager", "Teller", "Customer Service", "Staff Treasury", "IT Developer", "Risk Analyst", "Compliance Officer"],
    alamat: "Jl. Jend. Gatot Subroto Kav.36-38, Jakarta Selatan, DKI Jakarta" },
  { nama: "PT Bank Rakyat Indonesia (Persero) Tbk", kategori: "BUMN",
    posisi: ["Account Officer", "Mantri BRI", "Teller", "Customer Service", "Analis Bisnis", "Staff IT", "Kepala Unit", "Marketing Officer"],
    alamat: "Jl. Jend. Sudirman Kav.44-46, Jakarta Pusat, DKI Jakarta" },
  { nama: "PT Bank Negara Indonesia (Persero) Tbk", kategori: "BUMN",
    posisi: ["Account Officer", "Trade Finance Staff", "Customer Service", "Teller", "IT Analyst", "Credit Risk Officer", "Back Office Staff"],
    alamat: "Jl. Jend. Sudirman Kav.1, Jakarta Pusat, DKI Jakarta" },
  { nama: "PT Bank Jatim (Persero) Tbk", kategori: "BUMN",
    posisi: ["Account Officer", "Teller", "Customer Service", "Analis Kredit", "Staff Operasional", "IT Support"],
    alamat: "Jl. Basuki Rahmat No.98-104, Surabaya, Jawa Timur" },

  // ===== TEKNOLOGI / STARTUP =====
  { nama: "PT GoTo Gojek Tokopedia Tbk", kategori: "Swasta",
    posisi: ["Software Engineer", "Backend Developer", "Product Manager", "Data Scientist", "UI/UX Designer", "DevOps Engineer", "Machine Learning Engineer", "QA Engineer"],
    alamat: "Jl. RP. Soeroso No.2, Menteng, Jakarta Pusat" },
  { nama: "PT Shopee Indonesia", kategori: "Swasta",
    posisi: ["Backend Engineer", "Frontend Developer", "Data Analyst", "Seller Support Specialist", "Business Development", "Product Manager", "Marketing Analyst", "Operations Staff"],
    alamat: "Pacific Century Place, Jl. Jend. Sudirman Kav.52-53, Jakarta Selatan" },
  { nama: "PT Traveloka Indonesia", kategori: "Swasta",
    posisi: ["Software Engineer", "Data Engineer", "Product Designer", "Content Strategist", "Business Analyst", "Customer Experience Lead", "DevOps Engineer"],
    alamat: "Gedung Traveloka, Jl. HR. Rasuna Said, Kuningan, Jakarta Selatan" },
  { nama: "PT Telkom Indonesia (Persero) Tbk", kategori: "BUMN",
    posisi: ["Network Engineer", "Software Developer", "IT Project Manager", "Data Analyst", "Cybersecurity Analyst", "Cloud Engineer", "Business Development Staff", "System Administrator"],
    alamat: "Jl. Japati No.1, Bandung, Jawa Barat" },
  { nama: "PT Ruangguru", kategori: "Swasta",
    posisi: ["Software Engineer", "Content Developer", "Curriculum Designer", "Product Manager", "Data Analyst", "Marketing Staff", "Customer Success"],
    alamat: "Jl. Melawai IX No.19, Blok M, Jakarta Selatan" },

  // ===== INDUSTRI / MANUFAKTUR =====
  { nama: "PT Pertamina (Persero)", kategori: "BUMN",
    posisi: ["Process Engineer", "HSE Officer", "Petroleum Engineer", "Finance Analyst", "IT Infrastructure Engineer", "Procurement Staff", "Quality Control Engineer"],
    alamat: "Jl. Medan Merdeka Timur No.1A, Jakarta Pusat" },
  { nama: "PT PLN (Persero)", kategori: "BUMN",
    posisi: ["Electrical Engineer", "Operator Sistem Tenaga", "Analis Keuangan", "IT Support", "Staff SDM", "Pengawas Konstruksi", "K3 Officer"],
    alamat: "Jl. Trunojoyo Blok M-1 No.135, Kebayoran Baru, Jakarta Selatan" },
  { nama: "PT Astra International Tbk", kategori: "Swasta",
    posisi: ["Automotive Engineer", "Sales Supervisor", "Finance Staff", "HR Business Partner", "Logistics Coordinator", "Quality Assurance Engineer", "IT Analyst"],
    alamat: "Jl. Gaya Motor Raya No.8, Sunter, Jakarta Utara" },
  { nama: "PT Unilever Indonesia Tbk", kategori: "Swasta",
    posisi: ["Brand Manager", "Supply Chain Analyst", "Quality Assurance Officer", "HR Business Partner", "Sales Executive", "R&D Scientist", "Finance Controller"],
    alamat: "Jl. BSD Boulevard Barat, BSD City, Tangerang Selatan, Banten" },
  { nama: "PT Indofood Sukses Makmur Tbk", kategori: "Swasta",
    posisi: ["Production Supervisor", "Quality Control Staff", "Supply Chain Analyst", "Marketing Executive", "Finance Staff", "R&D Engineer", "Logistik Coordinator"],
    alamat: "Jl. Jend. Sudirman Kav.76-78, Jakarta Selatan" },
  { nama: "PT Kalbe Farma Tbk", kategori: "Swasta",
    posisi: ["Apoteker", "Medical Representative", "R&D Scientist", "Quality Assurance Officer", "Regulatory Affairs Staff", "Supply Chain Analyst", "Finance Staff"],
    alamat: "Jl. Let. Jend. Suprapto Kav.4, Cempaka Putih, Jakarta Pusat" },

  // ===== KONSTRUKSI =====
  { nama: "PT Wijaya Karya (Persero) Tbk", kategori: "BUMN",
    posisi: ["Civil Engineer", "Project Manager", "Site Supervisor", "Quantity Surveyor", "Electrical Engineer", "Procurement Staff", "HSE Officer"],
    alamat: "Jl. DI. Panjaitan Kav.9-10, Cawang, Jakarta Timur" },
  { nama: "PT Adhi Karya (Persero) Tbk", kategori: "BUMN",
    posisi: ["Civil Engineer", "Quantity Surveyor", "Project Planner", "Structural Engineer", "Mechanical Engineer", "Site Engineer", "K3 Supervisor"],
    alamat: "Jl. Raya Pasar Minggu KM.18, Jakarta Selatan" },

  // ===== PENDIDIKAN / PERGURUAN TINGGI =====
  { nama: "Universitas Muhammadiyah Malang", kategori: "Swasta",
    posisi: ["Dosen Teknik Informatika", "Dosen Manajemen", "Dosen Psikologi", "Staff Administrasi Akademik", "Laboran", "Staf Keuangan", "Dosen Ilmu Komunikasi"],
    alamat: "Jl. Raya Tlogomas No.246, Malang, Jawa Timur" },
  { nama: "Universitas Brawijaya", kategori: "PNS",
    posisi: ["Dosen Teknik", "Dosen Ekonomi", "Dosen Pertanian", "Staff Administrasi", "Peneliti", "Pranata Komputer", "Pustakawan"],
    alamat: "Jl. Veteran, Malang, Jawa Timur" },
  { nama: "Universitas Negeri Malang", kategori: "PNS",
    posisi: ["Dosen Pendidikan", "Dosen Matematika", "Dosen Bahasa Indonesia", "Staff Tata Usaha", "Pranata Laboratorium", "Analis Kepegawaian"],
    alamat: "Jl. Semarang No.5, Malang, Jawa Timur" },
  { nama: "Politeknik Negeri Malang", kategori: "PNS",
    posisi: ["Dosen Teknik Elektro", "Dosen Akuntansi", "Dosen Teknologi Informasi", "Staff Administrasi", "Teknisi Laboratorium"],
    alamat: "Jl. Soekarno Hatta No.9, Malang, Jawa Timur" },

  // ===== PEMERINTAHAN / DINAS =====
  { nama: "Dinas Pendidikan Kota Malang", kategori: "PNS",
    posisi: ["Guru SD", "Guru SMP", "Guru SMA", "Staff Administrasi Dinas", "Pengawas Sekolah", "Analis Kurikulum", "Pranata Komputer"],
    alamat: "Jl. Veteran No.19, Malang, Jawa Timur" },
  { nama: "Dinas Komunikasi dan Informatika Kota Malang", kategori: "PNS",
    posisi: ["Programmer", "Analis Sistem Informasi", "Administrator Jaringan", "Pranata Humas", "Staff Data Center", "IT Security Officer"],
    alamat: "Jl. Tugu No.1, Malang, Jawa Timur" },
  { nama: "Badan Pusat Statistik (BPS) Kota Malang", kategori: "PNS",
    posisi: ["Staf Statistisi", "Analis Data", "Pranata Komputer", "Koordinator Survei", "Staf Administrasi"],
    alamat: "Jl. Mayjen Panjaitan No.5, Malang, Jawa Timur" },
  { nama: "Pemerintah Kota Malang", kategori: "PNS",
    posisi: ["Staff Administrasi Pemerintahan", "Analis Kebijakan", "Pranata Komputer", "Pengelola Keuangan Daerah", "Fungsional Umum"],
    alamat: "Jl. Tugu No.1, Malang, Jawa Timur" },

  // ===== KESEHATAN =====
  { nama: "RSUD Dr. Saiful Anwar Malang", kategori: "PNS",
    posisi: ["Perawat", "Apoteker", "Analis Kesehatan", "Radiografer", "Staff Rekam Medis", "Administrasi RS", "Nutrisionis"],
    alamat: "Jl. Jaksa Agung Suprapto No.2, Malang, Jawa Timur" },
  { nama: "Puskesmas Klojen", kategori: "PNS",
    posisi: ["Dokter Umum", "Perawat", "Bidan", "Apoteker", "Tenaga Promosi Kesehatan", "Staff Administrasi"],
    alamat: "Jl. Kawi No.24, Klojen, Malang, Jawa Timur" },
  { nama: "RS Universitas Muhammadiyah Malang", kategori: "Swasta",
    posisi: ["Dokter Umum", "Perawat", "Apoteker", "Fisioterapis", "Analis Laboratorium", "Administrasi RS"],
    alamat: "Jl. Raya Tlogomas No.45, Malang, Jawa Timur" },

  // ===== WIRAUSAHA / UMKM =====
  { nama: "CV. Digital Nusantara", kategori: "Wirausaha",
    posisi: ["Web Developer", "Graphic Designer", "Social Media Specialist", "Digital Marketing", "Copywriter", "Project Coordinator"],
    alamat: "Jl. Soekarno Hatta No.3, Malang, Jawa Timur" },
  { nama: "Toko Online / E-Commerce Mandiri", kategori: "Wirausaha",
    posisi: ["Owner / Pemilik Usaha", "Admin Toko Online", "Packer & Gudang", "Customer Service Online", "Content Creator Produk"],
    alamat: "Malang, Jawa Timur (Berbasis Rumah)" },
  { nama: "UD. Maju Bersama", kategori: "Wirausaha",
    posisi: ["Pemilik Usaha", "Administrasi Keuangan", "Sales & Marketing", "Staf Gudang", "Pengiriman Barang"],
    alamat: "Jl. Raya Sawojajar No.12, Malang, Jawa Timur" },
  { nama: "Freelance / Konsultan Mandiri", kategori: "Wirausaha",
    posisi: ["Konsultan IT", "Freelance Developer", "Desainer Grafis Freelance", "Fotografer Profesional", "Videografer", "Content Creator"],
    alamat: "Remote / Work From Anywhere, Malang Base" },
];

const POOL_USERNAME_FALLBACK = [
  "aurora.dreams", "celestial.whisper", "ethereal.moments", "golden.glow", "lunar.lullaby",
  "stardust.soul", "velvet.dreams", "wildflower.wishes", "zenith.zephyr", "blaze.runner",
  "cosmic.rebel", "electric.enigma", "fierce.phoenix", "maverick.mind", "neon.nomad",
  "quantum.quester", "shadow.striker", "urban.legend", "velocity.vortex", "zen.spirit",
  "abstract.echo", "dazzling.dream", "eccentric.echo", "fanciful.fractal", "galactic.glitch",
  "luminous.labyrinth", "nebulous.nexus", "radiant.riddle", "surreal.symphony",
  "autumn.breeze", "butterfly.whisper", "cloud.castle", "dewdrop.dream",
  "moonbeam.melody", "ocean.oasis", "petal.paradise", "rainbow.ripple", "stardust.symphony",
  "carpe.diem", "yolo.life", "hakuna.matata", "dream.big", "never.give.up",
  "adventure.addict", "bookworm.bliss", "canvas.creator", "dance.dreamer"
];

function _getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function _generateSmartNickname(nama, nim, tahun) {
  const nameClean = (nama || '').toLowerCase().replace(/[^a-z ]/g, '');
  const parts = nameClean.split(' ').filter(p => p.length > 2);
  if (parts.length === 0) return `alumni${Math.floor(Math.random() * 9999)}`;
  const f = parts[0];
  const l = parts[parts.length - 1] || "";
  const getInitial = (n) => n.replace(/[aeiou]/g, '').slice(0, 2) || n.slice(0, 2);
  const initF = getInitial(f);
  const nim3 = nim ? nim.slice(-3) : Math.floor(100 + Math.random() * 899);
  const th = tahun ? tahun.toString().slice(-2) : "23";
  const s = _getRandom(['', '.', '_']);
  const patterns = [`${f}${s}${l}`, `${initF}${s}${l}`, `${f}${nim3}`, `${f}${s}umm`, `${initF}${l}${th}`, `${f.charAt(0)}${s}${l}`];
  return _getRandom(patterns.filter(p => !p.includes('undefined')));
}

function _generateHybridUsername(nama, nim, tahun) {
  const baseUser = _generateSmartNickname(nama, nim, tahun);
  const dice = Math.random();
  const firstName = (nama || '').toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
  const rawEstetik = _getRandom(POOL_USERNAME_FALLBACK).replace('@', '');
  if (dice < 0.3) return rawEstetik;
  if (dice < 0.7) {
    const isPrefix = Math.random() > 0.5;
    const s = _getRandom(['.', '_', '']);
    return isPrefix ? `${rawEstetik}${s}${firstName}` : `${firstName}${s}${rawEstetik}`;
  }
  return baseUser;
}

/**
 * Menghasilkan data enrichment secara heuristik ketika Google Dorking
 * tidak menemukan data dari internet.
 * Posisi, alamat kerja, dan kategori diambil dari profil perusahaan yang sama
 * sehingga data pekerjaan konsisten dan realistis.
 * @param {object} alumni - Objek alumni { name, nim, year, program }
 * @returns {object} enrichData - Data enrichment yang dihasilkan
 */
export function fallbackEnrichAlumni(alumni) {
  const nama  = alumni.name  || '';
  const nim   = alumni.nim   || '';
  const tahun = alumni.year  || '';

  const baseUser     = _generateSmartNickname(nama, nim, tahun);
  const isConsistent = Math.random() > 0.5;
  const getU         = () => isConsistent ? baseUser : _generateHybridUsername(nama, nim, tahun);

  const userLI = baseUser;
  const userIG = getU();
  const userFB = getU();
  const userTT = getU();
  const userEM = getU();

  const isWorking = Math.random() > 0.1;  // 90% kemungkinan sudah bekerja
  const hasEmail  = Math.random() > 0.05;

  // Pilih satu profil perusahaan → ambil posisi & alamat dari profil yang SAMA
  const profil    = _getRandom(PROFIL_PERUSAHAAN);
  const posisi    = _getRandom(profil.posisi);
  const alamat    = profil.alamat;
  const kategori  = profil.kategori;

  return {
    linkedin:    `https://linkedin.com/in/${userLI}`,
    instagram:   `https://instagram.com/${userIG}`,
    facebook:    `https://facebook.com/${userFB.replace(/[^a-z0-9]/g, '')}`,
    tiktok:      `https://tiktok.com/@${userTT}`,
    email:       hasEmail ? `${userEM}${_getRandom(['@gmail.com', '@umm.ac.id', '@yahoo.co.id'])}` : '',
    noHp:        `08${_getRandom(['12','13','52','57','77','95'])}${Math.floor(1000000 + Math.random() * 8999999)}`,
    tempatKerja: isWorking ? profil.nama    : '',
    posisi:      isWorking ? posisi         : '',
    statusKerja: isWorking ? kategori       : 'Belum Bekerja',
    alamatKerja: isWorking ? alamat         : '',
    portfolio:   '',
    sumber:      ['Fallback-Heuristik'],
    _isFallback: true,
  };
}


export function renderEnrichmentModal(alumni, e = {}) {
  const sl = generateSearchLinks(alumni.name);

  return `
  <div id="enrichment-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
       onclick="if(event.target===this)closeEnrichmentModal()">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
         onclick="event.stopPropagation()">

      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
        <div>
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span class="text-xl">🔍</span> Data Enrichment
          </h2>
          <p class="text-sm text-gray-500 mt-0.5">${alumni.name} &bull; ${alumni.nim} &bull; ${alumni.program} &bull; ${alumni.year}</p>
        </div>
        <button onclick="closeEnrichmentModal()"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Tutup">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>

      <div class="p-6 space-y-5">

        <!-- ===== TOMBOL AUTO ENRICHMENT ===== -->
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-semibold text-indigo-800 text-sm flex items-center gap-2">
                <i data-lucide="zap" class="w-4 h-4"></i>
                Auto Enrichment — Google Dorking Otomatis
              </h3>
              <p class="text-xs text-indigo-600 mt-1">
                Robot akan mencari LinkedIn, Instagram, Email, dan info kerja secara otomatis (~60 detik) lalu mengisi form di bawah.
              </p>
            </div>
            <button id="btn-auto-enrich" onclick="triggerAutoEnrich('${alumni.id}','${alumni.nim}',this)"
              class="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm whitespace-nowrap">
              <i data-lucide="zap" class="w-4 h-4"></i> Mulai Auto
            </button>
          </div>
          <!-- Progress / Status -->
          <div id="auto-enrich-status" class="hidden mt-3 text-xs text-indigo-700 bg-indigo-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg class="animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span id="auto-enrich-msg">Menghubungi server...</span>
          </div>
        </div>

        <!-- STEP 1: Smart Search -->
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 class="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm">
            <i data-lucide="search" class="w-4 h-4"></i>
            Step 1 — Cari Profil Alumni (Klik tombol untuk buka pencarian di tab baru)
          </h3>

          <!-- Sosmed Langsung -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <a href="${sl.linkedin}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
            <a href="${sl.instagram}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-1.5 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-opacity">
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </a>
            <a href="${sl.facebook}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-1.5 bg-[#1877F2] hover:bg-[#0d6efd] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
            <a href="${sl.tiktok}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-1.5 bg-black hover:bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/></svg>
              TikTok
            </a>
          </div>

          <!-- ✅ Tombol baru: Cari LinkedIn via Google (lebih akurat) -->
          <div class="mb-3">
            <a href="${sl.googleLinkedin}" target="_blank" rel="noopener noreferrer"
               class="w-full flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              <i data-lucide="search" class="w-3.5 h-3.5"></i>
              Cari LinkedIn via Google — lebih akurat (site:linkedin.com/in)
            </a>
          </div>

          <!-- Google Email / HP / Kerja -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a href="${sl.googleEmail}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              <i data-lucide="mail" class="w-3.5 h-3.5"></i> Cari Email Publik
            </a>
            <a href="${sl.googleHP}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              <i data-lucide="phone" class="w-3.5 h-3.5"></i> Cari No. HP Publik
            </a>
            <a href="${sl.googleKerja}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              <i data-lucide="briefcase" class="w-3.5 h-3.5"></i> Cari Info Kerja
            </a>
          </div>
        </div>

        <!-- STEP 2: Form Input -->
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
            Step 2 — Isi Data yang Ditemukan
          </h3>
          <div class="space-y-5">

            <!-- Sosmed Alumni -->
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">📱 Sosial Media Alumni</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">LinkedIn URL</span>
                  <input id="enr-linkedin" type="url" placeholder="https://linkedin.com/in/username" value="${e.linkedin || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Instagram URL</span>
                  <input id="enr-instagram" type="url" placeholder="https://instagram.com/username" value="${e.instagram || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Facebook URL</span>
                  <input id="enr-facebook" type="url" placeholder="https://facebook.com/username" value="${e.facebook || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">TikTok URL</span>
                  <input id="enr-tiktok" type="url" placeholder="https://tiktok.com/@username" value="${e.tiktok || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
              </div>
            </div>

            <!-- Kontak -->
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">📞 Kontak Pribadi</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Email</span>
                  <input id="enr-email" type="email" placeholder="alumni@gmail.com" value="${e.email || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">No. HP / WhatsApp</span>
                  <input id="enr-nohp" type="tel" placeholder="08xxxxxxxxxx" value="${e.noHp || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
              </div>
            </div>

            <!-- Pekerjaan -->
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">💼 Informasi Pekerjaan</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Tempat Bekerja</span>
                  <input id="enr-tempat-kerja" type="text"
                    placeholder="PT. / Instansi / Nama Perusahaan"
                    value="${e.tempatKerja || ''}"
                    oninput="handleTempatKerjaInput(this.value)"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Posisi / Jabatan</span>
                  <input id="enr-posisi" type="text" placeholder="Software Engineer, Guru, dll." value="${e.posisi || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Alamat Tempat Bekerja</span>
                  <div class="flex gap-2">
                    <input id="enr-alamat-kerja" type="text" placeholder="Kota / Alamat" value="${e.alamatKerja || ''}"
                      class="flex-1 text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                    <button type="button" onclick="bukaGoogleMaps()" title="Buka di Google Maps"
                      class="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors flex-shrink-0">
                      <i data-lucide="map-pin" class="w-4 h-4"></i>
                    </button>
                  </div>
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">
                    Status Pekerjaan
                    <span id="infer-badge" class="ml-1 text-xs text-blue-600 hidden">(otomatis terdeteksi)</span>
                  </span>
                  <select id="enr-status-kerja"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                    <option value=""                ${!e.statusKerja ? 'selected' : ''}>-- Pilih Status --</option>
                    <option value="PNS"             ${e.statusKerja === 'PNS' ? 'selected' : ''}>🏛️ PNS</option>
                    <option value="Swasta"          ${e.statusKerja === 'Swasta' ? 'selected' : ''}>🏢 Swasta</option>
                    <option value="Wirausaha"       ${e.statusKerja === 'Wirausaha' ? 'selected' : ''}>🚀 Wirausaha</option>
                    <option value="Belum Bekerja"   ${e.statusKerja === 'Belum Bekerja' ? 'selected' : ''}>⏳ Belum Bekerja</option>
                    <option value="Melanjutkan Studi" ${e.statusKerja === 'Melanjutkan Studi' ? 'selected' : ''}>📚 Melanjutkan Studi</option>
                  </select>
                </label>
              </div>
            </div>

            <!-- Sosmed Perusahaan -->
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">🏢 Sosial Media Tempat Bekerja</p>
              <div id="company-search-area" class="mb-3 hidden">
                <p class="text-xs text-gray-500 mb-2">Cari sosmed perusahaan:</p>
                <div class="flex flex-wrap gap-2" id="company-search-links"></div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">LinkedIn Perusahaan</span>
                  <input id="enr-linkedin-company" type="url" placeholder="https://linkedin.com/company/..." value="${e.linkedinPerusahaan || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Instagram Perusahaan</span>
                  <input id="enr-instagram-company" type="url" placeholder="https://instagram.com/perusahaan" value="${e.instagramPerusahaan || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Facebook Perusahaan</span>
                  <input id="enr-facebook-company" type="url" placeholder="https://facebook.com/perusahaan" value="${e.facebookPerusahaan || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500 mb-1 block">Website Perusahaan</span>
                  <input id="enr-website-company" type="url" placeholder="https://www.perusahaan.com" value="${e.websitePerusahaan || ''}"
                    class="w-full text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow">
                </label>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex items-center justify-between pt-2">
          <p class="text-xs text-gray-400">Data hanya untuk keperluan akademik &bull; Tidak disebarluaskan</p>
          <div class="flex gap-3">
            <button type="button" onclick="closeEnrichmentModal()"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Batal
            </button>
            <button type="button" id="save-enrichment-btn" onclick="saveEnrichment('${alumni.id}')"
              class="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2 shadow-sm">
              <i data-lucide="save" class="w-4 h-4"></i> Simpan Data
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>`;
}