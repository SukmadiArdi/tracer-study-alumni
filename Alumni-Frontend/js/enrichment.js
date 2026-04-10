// enrichment.js
import { db } from "./firebase.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ===== 1. GENERATE LINK PENCARIAN SOSMED ALUMNI =====
export function generateSearchLinks(nama, institusi = "Universitas Muhammadiyah Malang") {
  const namaEnc = encodeURIComponent(nama);
  const namaInst = encodeURIComponent(`${nama} ${institusi}`);
  const namaLinkedin = encodeURIComponent(nama);
  const namaEmail = encodeURIComponent(`"${nama}" "gmail.com" OR "yahoo.com" OR "email"`);
  const namaHP = encodeURIComponent(`"${nama}" "0812" OR "0813" OR "0821" OR "0822" OR "0857" OR "0858" OR "whatsapp"`);
  const namaKerja = encodeURIComponent(`"${nama}" "bekerja" OR "works at" OR "jabatan" OR "engineer" OR "manager" OR "staff"`);

  return {
    // ✅ Langsung ke halaman alumni UMM di LinkedIn — filter nama di sana
    linkedin: `https://www.linkedin.com/school/university-of-muhammadiyah-malang/people/?keywords=${namaEnc}`,

    instagram: `https://www.instagram.com/explore/search/keyword/?q=${namaEnc}`,
    facebook: `https://www.facebook.com/search/people/?q=${namaInst}`,
    tiktok: `https://www.tiktok.com/search/user?q=${namaEnc}`,
    googleLinkedin: `https://www.google.com/search?q=site:linkedin.com/in+${namaLinkedin}`,
    googleEmail: `https://www.google.com/search?q=${namaEmail}`,
    googleHP: `https://www.google.com/search?q=${namaHP}`,
    googleKerja: `https://www.google.com/search?q=${namaKerja}`,
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


// ===== 4. SIMPAN DATA ENRICHMENT KE FIRESTORE (DIPERBARUI) =====
export async function saveEnrichmentToFirestore(alumniId, enrichmentData) {
  try {
    const alumniDocRef = doc(db, "alumni", alumniId);

    // Ambil data alumni saat ini untuk mempertahankan skor PDDikti
    const snap = await getDoc(alumniDocRef);
    const currentData = snap.exists() ? snap.data() : {};

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

    // 3. Simpan ke Firestore
    // Ingat: Jangan menimpa `confidence` agar skor PDDikti tetap aman
    await updateDoc(alumniDocRef, {
      enrichment: enrichmentData,
      enrichmentUpdatedAt: new Date().toISOString(),
      enrichmentScore: enrichmentScore, // Simpan skor profil di field terpisah
      status: statusBaru // Simpan status gabungan
    });

    return { enrichmentScore, status: statusBaru };
  } catch (error) {
    console.error("Error menyimpan enrichment:", error);
    throw error;
  }
}


// ===== 5. AMBIL DATA SATU ALUMNI BY ID =====
// ⚠️ TIDAK DIUBAH — logika Firestore tetap sama
export async function getAlumniById(alumniId) {
  try {
    const alumniDocRef = doc(db, "alumni", alumniId);
    const snap = await getDoc(alumniDocRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  } catch (error) {
    console.error("Error mengambil alumni by id:", error);
    return null;
  }
}


// ===== 6. RENDER HTML MODAL ENRICHMENT =====
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