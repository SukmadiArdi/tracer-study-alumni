import { getAlumni, getAlumniStats, getUniqueYears, getUniquePrograms, createAlumni, deleteAlumni, updateStatus, saveEnrichmentToDatabase, getAlumniById } from "./alumni.js";
import { runTracking, jalankanSinkronisasiPDDiktiMassal, verifikasiSatuPDDikti } from "./tracking.js";
import { updateDashboard, addActivity } from "./dashboard.js";
import { generateSearchLinks, generateCompanySearchLinks, inferStatusKerja, renderEnrichmentModal, autoEnrichAlumni, fallbackEnrichAlumni } from "./enrichment.js";
import { supabase } from "./supabase.js";
import "./import-excel.js";

// ===== STATE GLOBAL =====
const PAGE_SIZE = 50;
let currentPage = 1;
let totalCount = 0;
let currentAlumniData = []; // Data halaman saat ini (bukan semua data)
let isLoading = false;

// State filter
let filterProgram = "All";
let filterYear = "All";
let filterStatus = "All";
let searchQuery = "";

// ===== 1. INISIALISASI & LOAD DATA =====
async function loadPage(page = 1) {
  if (isLoading) return;
  isLoading = true;
  currentPage = page;

  const tbody = document.getElementById("alumni-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-12 text-gray-400">
        <svg class="animate-spin w-8 h-8 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p class="text-sm">Memuat data...</p>
      </td></tr>`;
  }

  try {
    const { data, totalCount: tc } = await getAlumni({
      page: currentPage,
      pageSize: PAGE_SIZE,
      search: searchQuery,
      program: filterProgram,
      year: filterYear,
      status: filterStatus,
    });

    currentAlumniData = data;
    totalCount = tc;
    window.currentAlumniData = currentAlumniData;

    renderAlumniTable();
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("loadPage error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-400">Gagal memuat data. Silakan refresh.</td></tr>`;
  } finally {
    isLoading = false;
  }
}

async function loadDashboard() {
  try {
    const stats = await getAlumniStats();
    updateDashboard(stats);
  } catch (err) {
    console.error("loadDashboard error:", err);
  }
}

async function loadFilterOptions() {
  try {
    const [years, programs] = await Promise.all([getUniqueYears(), getUniquePrograms()]);

    const filterYear = document.getElementById("filter-year");
    if (filterYear) {
      filterYear.innerHTML =
        '<option value="All">Semua Tahun</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join("");
    }

    const filterProg = document.getElementById("filter-program");
    if (filterProg) {
      filterProg.innerHTML =
        '<option value="All">Semua Program</option>' +
        programs.map(p => `<option value="${p}">${p}</option>`).join("");
    }
  } catch (err) {
    console.error("loadFilterOptions error:", err);
  }
}

// ===== 2. EVENT LISTENER FILTER & SEARCH =====
let searchDebounce;
document.getElementById("search-alumni")?.addEventListener("input", (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = e.target.value.toLowerCase().trim();
    loadPage(1);
  }, 400);
});

document.getElementById("filter-program")?.addEventListener("change", (e) => {
  filterProgram = e.target.value;
  loadPage(1);
});
document.getElementById("filter-year")?.addEventListener("change", (e) => {
  filterYear = e.target.value;
  loadPage(1);
});
document.getElementById("filter-status")?.addEventListener("change", (e) => {
  filterStatus = e.target.value;
  loadPage(1);
});

// ===== 3. RENDER TABEL ALUMNI =====
function renderAlumniTable() {
  const tbody = document.getElementById("alumni-table-body");
  const countText = document.getElementById("table-count-text");
  const pageInfo = document.getElementById("table-page-info");
  const paginEl = document.getElementById("alumni-pagination");
  const prevBtn = document.getElementById("alumni-prev");
  const nextBtn = document.getElementById("alumni-next");
  const pageNumEl = document.getElementById("alumni-page-numbers");
  if (!tbody) return;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startItem = (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  if (countText) countText.textContent = `Menampilkan ${totalCount > 0 ? startItem : 0}–${endItem} dari ${totalCount.toLocaleString()} alumni`;
  if (pageInfo) pageInfo.textContent = totalCount > 0 ? `Halaman ${currentPage} / ${totalPages}` : "";

  if (currentAlumniData.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-12 text-gray-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm">Tidak ada alumni yang ditemukan</p>
      </td></tr>`;
    if (paginEl) paginEl.classList.add("hidden");
    if (window.lucide) lucide.createIcons();
    return;
  }

  const statusColor = {
    "Identified": "bg-emerald-100 text-emerald-700",
    "Pending": "bg-amber-100 text-amber-700",
    "Not Found": "bg-red-100 text-red-700"
  };

  tbody.innerHTML = currentAlumniData.map(a => {
    const enr = a.enrichment || {};
    const hasEnrichment = enr.tempatKerja || enr.linkedin || enr.email;
    const enrichBadge = hasEnrichment
      ? `<span class="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-1">
           <i data-lucide="check-circle" class="w-3 h-3"></i> Profil Terisi
         </span>` : "";
    const statusKerjaBadge = enr.statusKerja
      ? `<span class="text-xs text-gray-400 block mt-0.5">${enr.statusKerja}</span>` : "";
    const colorClass = statusColor[a.status] || "bg-gray-100 text-gray-600";

    return `
      <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
        <td class="px-4 py-3">
          <div class="font-medium text-gray-900 text-sm flex items-center flex-wrap gap-1">
            ${a.name}${enrichBadge}
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-500">${a.nim}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${a.program}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${a.year}</td>
        <td class="px-4 py-3">
          <div class="text-sm text-gray-700">${enr.tempatKerja || '<span class="text-gray-300 italic text-xs">Belum diisi</span>'}</div>
          ${statusKerjaBadge}
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}">
            ${{"Identified": "Teridentifikasi", "Pending": "Perlu Verifikasi", "Not Found": "Antrean data belum ditemukan"}[a.status] || a.status}
          </span>
          <div class="text-xs text-blue-600 mt-1 font-medium">PDDikti: ${a.confidence || 0}%</div>
          ${hasEnrichment ? `<div class="text-xs text-purple-600 mt-0.5">Profil: ${a.enrichmentScore || 0}% terisi</div>` : ''}
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button onclick="openEnrichmentModal('${a.id}')"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm">
              <i data-lucide="search" class="w-3 h-3"></i> Enrichment
            </button>
            <button onclick="handleTrackAlumni('${a.id}')"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
              <i data-lucide="radar" class="w-3 h-3"></i> Track
            </button>
            <button onclick="handleDeleteAlumni('${a.id}', '${a.name.replace(/'/g, "")}')"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");

  // Render pagination
  if (paginEl) paginEl.classList.remove("hidden");
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;

  if (pageNumEl) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);

    pageNumEl.innerHTML = pages.reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) {
        acc += `<span class="px-2 py-1.5 text-xs text-gray-400">...</span>`;
      }
      acc += `
        <button onclick="goToAlumniPage(${p})"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
          ${p === currentPage ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}">
          ${p}
        </button>`;
      return acc;
    }, "");
  }

  if (window.lucide) lucide.createIcons();
}

// ===== Navigasi Pagination =====
window.goToAlumniPage = function (page) {
  loadPage(page);
};
window.changeAlumniPage = function (dir) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const next = Math.min(Math.max(1, currentPage + dir), totalPages);
  loadPage(next);
};

// ===== 4. RENDER VERIFIKASI MANUAL (Server-Side) =====
const VERIF_PAGE_SIZE = 50;
let verifCurrentPage = 1;
let verifTotalCount = 0;
let verifData = [];
let verifSearchQuery = "";

async function loadVerificationPage(page = 1) {
  verifCurrentPage = page;
  try {
    const { data, totalCount: tc } = await getAlumni({
      page,
      pageSize: VERIF_PAGE_SIZE,
      search: verifSearchQuery,
      status: "Pending",
    });
    verifData = data;
    verifTotalCount = tc;
    renderVerification();
  } catch (err) {
    console.error("loadVerificationPage error:", err);
  }
}

let verifSearchDebounce;
document.getElementById("search-verification")?.addEventListener("input", (e) => {
  clearTimeout(verifSearchDebounce);
  verifSearchDebounce = setTimeout(() => {
    verifSearchQuery = e.target.value.toLowerCase().trim();
    loadVerificationPage(1);
  }, 400);
});

function renderVerification() {
  const container = document.getElementById("verification-list");
  const paginEl = document.getElementById("verification-pagination");
  const countEl = document.getElementById("verification-count");
  const pageNumEl = document.getElementById("verif-page-numbers");
  const prevBtn = document.getElementById("verif-prev");
  const nextBtn = document.getElementById("verif-next");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(verifTotalCount / VERIF_PAGE_SIZE));
  const startItem = (verifCurrentPage - 1) * VERIF_PAGE_SIZE + 1;
  const endItem = Math.min(verifCurrentPage * VERIF_PAGE_SIZE, verifTotalCount);

  if (countEl) {
    countEl.textContent = verifTotalCount > 0
      ? `Menampilkan ${startItem}–${endItem} dari ${verifTotalCount.toLocaleString()} alumni pending`
      : "Tidak ada alumni yang perlu diverifikasi";
  }

  if (verifData.length === 0) {
    container.innerHTML = `<p class="text-sm text-gray-400 text-center py-6">Tidak ada alumni yang perlu diverifikasi</p>`;
    if (paginEl) paginEl.classList.add("hidden");
    return;
  }

  container.innerHTML = verifData.map(a => `
    <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p class="text-sm font-medium text-gray-900">${a.name}</p>
        <p class="text-xs text-gray-400">${a.program} &bull; ${a.year} &bull; ${a.confidence || 0}% confidence</p>
      </div>
      <div class="flex gap-2">
        <button onclick="confirmVerify('${a.id}', 'approve')"
          class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
          Teridentifikasi
        </button>
        <button onclick="confirmVerify('${a.id}', 'reject')"
          class="px-3 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
          Antrean data belum ditemukan
        </button>
      </div>
    </div>
  `).join("");

  if (paginEl) paginEl.classList.remove("hidden");
  if (prevBtn) prevBtn.disabled = verifCurrentPage === 1;
  if (nextBtn) nextBtn.disabled = verifCurrentPage === totalPages;

  if (pageNumEl) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - verifCurrentPage) <= 1);
    pageNumEl.innerHTML = pages.reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc += `<span class="px-2 py-1.5 text-xs text-gray-400">...</span>`;
      acc += `
        <button onclick="goToVerifPage(${p})"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
          ${p === verifCurrentPage ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}">
          ${p}
        </button>`;
      return acc;
    }, "");
  }
}

window.changeVerifPage = function (dir) {
  const totalPages = Math.max(1, Math.ceil(verifTotalCount / VERIF_PAGE_SIZE));
  const next = Math.min(Math.max(1, verifCurrentPage + dir), totalPages);
  loadVerificationPage(next);
};
window.goToVerifPage = function (page) {
  loadVerificationPage(page);
};

// ===== 5. TRACKING ALUMNI =====
async function handleTrackAlumni(id) {
  const alumni = currentAlumniData.find(a => a.id === id);
  if (!alumni) return;

  showToast(`🔍 Sedang mencari data ${alumni.name} di PDDikti...`, "info");

  try {
    const result = await verifikasiSatuPDDikti(alumni);
    const finalStatus = await updateStatus(id, result.status, result.confidence);

    // Update data lokal pada halaman saat ini
    const idx = currentAlumniData.findIndex(a => a.id === id);
    if (idx !== -1) {
      currentAlumniData[idx].status = finalStatus;
      currentAlumniData[idx].confidence = result.confidence;
    }

    renderAlumniTable();
    // Refresh dashboard stats dari DB
    await loadDashboard();

    const labelStatus = {"Identified": "Teridentifikasi", "Pending": "Perlu Verifikasi", "Not Found": "Antrean data belum ditemukan"}[finalStatus] || finalStatus;
    addActivity(`Pencarian PDDikti ${alumni.name}: ${labelStatus} (${result.confidence}%)`, "radar", "text-blue-600", "bg-blue-50");
    showToast(`✅ Selesai! ${alumni.name} berstatus: ${labelStatus}`, finalStatus === "Identified" ? "success" : "info");
  } catch (e) {
    console.error(e);
    showToast(`❌ Gagal menghubungi server PDDikti untuk ${alumni.name}`, "error");
  }
}

// ===== 6. VERIFIKASI MANUAL =====
async function confirmVerify(id, action) {
  const status = action === "approve" ? "Identified" : "Not Found";
  const confidence = action === "approve" ? 90 : 0;
  try {
    await updateStatus(id, status, confidence);

    // Hapus dari daftar verifikasi lokal
    verifData = verifData.filter(a => a.id !== id);
    verifTotalCount = Math.max(0, verifTotalCount - 1);

    // Update tabel alumni jika item ada di halaman saat ini
    const idx = currentAlumniData.findIndex(a => a.id === id);
    if (idx !== -1) {
      currentAlumniData[idx].status = status;
      currentAlumniData[idx].confidence = confidence;
      renderAlumniTable();
    }

    renderVerification();
    await loadDashboard();

    const labelStatus = {"Identified": "Teridentifikasi", "Pending": "Perlu Verifikasi", "Not Found": "Antrean data belum ditemukan"}[status] || status;
    const name = verifData.find(a => a.id === id)?.name || currentAlumniData.find(a => a.id === id)?.name || "Alumni";
    addActivity(`${name} diverifikasi sebagai ${labelStatus}`, "check", "text-emerald-600", "bg-emerald-50");
    showToast(`Status diperbarui: ${labelStatus}`, "success");
  } catch (e) {
    console.error(e);
    showToast("Gagal memperbarui status", "error");
  }
}

// ===== 7. HAPUS ALUMNI =====
async function handleDeleteAlumni(id, name) {
  if (!confirm(`Hapus alumni "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await deleteAlumni(id);
    // Reload halaman saat ini
    await loadPage(currentPage);
    await loadDashboard();
    addActivity(`Alumni ${name} dihapus`, "trash-2", "text-red-600", "bg-red-50");
    showToast(`Alumni ${name} berhasil dihapus`, "info");
  } catch (e) {
    console.error(e);
    showToast("Gagal menghapus alumni", "error");
  }
}

// ===== 8. TAMBAH ALUMNI MANUAL =====
document.getElementById("add-alumni-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById("input-name")?.value.trim(),
    nim: document.getElementById("input-nim")?.value.trim(),
    program: document.getElementById("input-program")?.value,
    year: document.getElementById("input-year")?.value,
  };
  if (!data.name || !data.nim || !data.program || !data.year) {
    showToast("Harap isi semua field", "error");
    return;
  }
  try {
    await createAlumni(data);
    document.getElementById("add-alumni-form").reset();
    document.getElementById("add-alumni-modal")?.classList.add("hidden");
    // Refresh data & filter options
    await Promise.all([loadPage(1), loadDashboard(), loadFilterOptions()]);
    addActivity(`Alumni baru ditambahkan: ${data.name}`, "user-plus", "text-blue-600", "bg-blue-50");
    showToast(`${data.name} berhasil ditambahkan`, "success");
  } catch (err) {
    console.error(err);
    showToast("Gagal menambah alumni", "error");
  }
});

// ===== 9. ENRICHMENT MODAL =====
window.openEnrichmentModal = async function (alumniId) {
  const alumni = currentAlumniData.find(a => a.id === alumniId);
  if (!alumni) return;

  const freshData = await getAlumniById(alumniId);
  const existingEnrichment = freshData?.enrichment || {};
  const modalHTML = renderEnrichmentModal(alumni, existingEnrichment);

  document.getElementById("enrichment-modal")?.remove();
  document.body.insertAdjacentHTML("beforeend", modalHTML);
  if (window.lucide) lucide.createIcons();

  window.handleTempatKerjaInput = function (namaPerusahaan) {
    const inferred = inferStatusKerja(namaPerusahaan);
    const statusEl = document.getElementById("enr-status-kerja");
    const badgeEl = document.getElementById("infer-badge");
    if (statusEl && inferred) {
      statusEl.value = inferred;
      badgeEl?.classList.remove("hidden");
    }
    if (namaPerusahaan.trim().length > 2) {
      const cl = generateCompanySearchLinks(namaPerusahaan);
      const area = document.getElementById("company-search-area");
      const links = document.getElementById("company-search-links");
      if (area && links) {
        area.classList.remove("hidden");
        links.innerHTML = `
          <a href="${cl.linkedinCompany}" target="_blank" rel="noopener noreferrer" class="text-xs bg-[#0A66C2] text-white px-3 py-1.5 rounded-lg hover:opacity-90">LinkedIn</a>
          <a href="${cl.instagramCompany}" target="_blank" rel="noopener noreferrer" class="text-xs bg-pink-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90">Instagram</a>
          <a href="${cl.facebookCompany}" target="_blank" rel="noopener noreferrer" class="text-xs bg-[#1877F2] text-white px-3 py-1.5 rounded-lg hover:opacity-90">Facebook</a>
          <a href="${cl.mapsCompany}" target="_blank" rel="noopener noreferrer" class="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90">Google Maps</a>
          <a href="${cl.websiteCompany}" target="_blank" rel="noopener noreferrer" class="text-xs bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:opacity-90">Website</a>`;
      }
    }
  };

  window.bukaGoogleMaps = function () {
    const tempat = document.getElementById("enr-tempat-kerja")?.value?.trim() || "";
    const alamat = document.getElementById("enr-alamat-kerja")?.value?.trim() || "";
    const query = [tempat, alamat].filter(v => v !== "").join(", ");
    if (!query) { showToast("Isi dulu Tempat Bekerja atau Alamat!", "error"); return; }
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, "_blank");
  };

  if (existingEnrichment.tempatKerja) {
    window.handleTempatKerjaInput(existingEnrichment.tempatKerja);
  }
};

window.closeEnrichmentModal = function () {
  const modal = document.getElementById("enrichment-modal");
  if (modal) {
    modal.style.opacity = "0";
    modal.style.transition = "opacity 0.2s ease";
    setTimeout(() => modal.remove(), 220);
  }
};

// ===== TRIGGER AUTO ENRICHMENT (dari tombol di modal) =====
// Helper: cek apakah hasil enrichment meaningful (ada data asli dari internet)
function _isEnrichmentEmpty(data) {
  if (!data) return true;
  return !data.linkedin && !data.instagram && !data.facebook &&
         !data.email && !data.noHp && !data.tempatKerja;
}

window.triggerAutoEnrich = async function (alumniId, nim, btn) {
  const alumni = currentAlumniData.find(a => a.id === alumniId);
  if (!alumni) return;

  const statusEl = document.getElementById('auto-enrich-status');
  const msgEl    = document.getElementById('auto-enrich-msg');

  // UI: loading state
  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
  </svg> Mencari...`;
  if (statusEl) {
    statusEl.classList.remove('hidden');
    msgEl.textContent = '🔗 [1/4] Mencari LinkedIn via Google Dorking...';
  }

  let enrichData = null;
  let usedFallback = false;
  let clearIntervalFn = null;

  try {
    // Update progress setiap 15 detik agar user tidak bingung
    const steps = [
      '🔗 [1/4] Mencari LinkedIn...',
      '📸 [2/4] Mencari Instagram...',
      '📧 [3/4] Mencari Email...',
      '💼 [4/4] Mencari Info Kerja...',
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      if (msgEl) msgEl.textContent = steps[stepIdx];
    }, 16000);
    clearIntervalFn = () => clearInterval(interval);

    try {
      enrichData = await autoEnrichAlumni(alumni);
    } catch (serverErr) {
      // Server error (timeout, 500, dll) → langsung fallback
      console.warn('Auto enrichment server error, beralih ke fallback heuristik:', serverErr.message);
      enrichData = null;
    }

    clearInterval(interval);

    // Cek apakah data dari internet kosong → gunakan fallback
    if (_isEnrichmentEmpty(enrichData)) {
      console.info('Data Google Dorking kosong. Menggunakan fallback heuristik (usePencarianController logic)...');
      enrichData   = fallbackEnrichAlumni(alumni);
      usedFallback = true;

      if (statusEl && msgEl) {
        statusEl.className = 'mt-3 text-xs text-amber-800 bg-amber-100 rounded-lg px-3 py-2 flex items-center gap-2';
        msgEl.textContent  = '⚠️ Data tidak ditemukan di internet. Mengisi dengan prediksi heuristik — harap verifikasi sebelum menyimpan.';
      }
    }

  } catch (outerErr) {
    // Fallback jika ada error tak terduga di luar
    console.error('Unexpected error di triggerAutoEnrich:', outerErr);
    if (clearIntervalFn) clearIntervalFn();
    enrichData   = fallbackEnrichAlumni(alumni);
    usedFallback = true;

    if (statusEl && msgEl) {
      statusEl.className = 'mt-3 text-xs text-amber-800 bg-amber-100 rounded-lg px-3 py-2 flex items-center gap-2';
      msgEl.textContent  = '⚠️ Terjadi kesalahan. Mengisi dengan prediksi heuristik — harap verifikasi sebelum menyimpan.';
    }
  }

  // ===== ISI FORM DARI DATA (ASLI ATAU FALLBACK) =====
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  setVal('enr-linkedin',       enrichData.linkedin);
  setVal('enr-instagram',      enrichData.instagram);
  setVal('enr-facebook',       enrichData.facebook);
  setVal('enr-tiktok',         enrichData.tiktok);
  setVal('enr-email',          enrichData.email);
  setVal('enr-nohp',           enrichData.noHp);
  setVal('enr-tempat-kerja',   enrichData.tempatKerja);
  setVal('enr-posisi',         enrichData.posisi);
  setVal('enr-alamat-kerja',   enrichData.alamatKerja);

  // Status kerja via select
  if (enrichData.statusKerja) {
    const sel = document.getElementById('enr-status-kerja');
    if (sel) sel.value = enrichData.statusKerja;
  }

  // Trigger handleTempatKerjaInput jika ada tempat kerja
  if (enrichData.tempatKerja && window.handleTempatKerjaInput) {
    window.handleTempatKerjaInput(enrichData.tempatKerja);
  }

  // ===== UPDATE UI HASIL =====
  if (!usedFallback) {
    // Hasil nyata dari Google Dorking
    const found = enrichData.sumber?.length || 0;
    if (statusEl) {
      statusEl.className = 'mt-3 text-xs text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2';
      msgEl.textContent  = `✅ Selesai! ${found} sumber ditemukan: ${enrichData.sumber?.join(', ') || '-'}. Periksa dan simpan data di bawah.`;
    }
    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Selesai`;
    btn.className = btn.className.replace('bg-indigo-600 hover:bg-indigo-700', 'bg-emerald-600');
  } else {
    // Hasil heuristik fallback
    if (statusEl && !statusEl.textContent.includes('heuristik')) {
      statusEl.className = 'mt-3 text-xs text-amber-800 bg-amber-100 rounded-lg px-3 py-2 flex items-center gap-2';
      msgEl.textContent  = '⚠️ Data prediksi heuristik (usePencarianController) telah diisi. Harap verifikasi sebelum menyimpan.';
    }
    btn.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4"></i> Data Fallback`;
    btn.className = btn.className.replace('bg-indigo-600 hover:bg-indigo-700', 'bg-amber-500 hover:bg-amber-600');
    btn.disabled = false; // Izinkan user klik lagi jika mau mencoba ulang
  }

  if (window.lucide) lucide.createIcons();
};

window.saveEnrichment = async function (alumniId) {
  const btn = document.getElementById("save-enrichment-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg> Menyimpan...`;
  }

  const enrichmentData = {
    linkedin: document.getElementById("enr-linkedin")?.value.trim() || "",
    instagram: document.getElementById("enr-instagram")?.value.trim() || "",
    facebook: document.getElementById("enr-facebook")?.value.trim() || "",
    tiktok: document.getElementById("enr-tiktok")?.value.trim() || "",
    email: document.getElementById("enr-email")?.value.trim() || "",
    noHp: document.getElementById("enr-nohp")?.value.trim() || "",
    tempatKerja: document.getElementById("enr-tempat-kerja")?.value.trim() || "",
    posisi: document.getElementById("enr-posisi")?.value.trim() || "",
    alamatKerja: document.getElementById("enr-alamat-kerja")?.value.trim() || "",
    statusKerja: document.getElementById("enr-status-kerja")?.value || "",
    linkedinPerusahaan: document.getElementById("enr-linkedin-company")?.value.trim() || "",
    instagramPerusahaan: document.getElementById("enr-instagram-company")?.value.trim() || "",
    facebookPerusahaan: document.getElementById("enr-facebook-company")?.value.trim() || "",
    websitePerusahaan: document.getElementById("enr-website-company")?.value.trim() || "",
  };

  try {
    const result = await saveEnrichmentToDatabase(alumniId, enrichmentData);

    // Update row di halaman saat ini
    const idx = currentAlumniData.findIndex(a => a.id === alumniId);
    if (idx !== -1) {
      currentAlumniData[idx].enrichment = enrichmentData;
      currentAlumniData[idx].enrichmentScore = result.enrichmentScore;
      currentAlumniData[idx].status = result.status;
    }

    closeEnrichmentModal();
    renderAlumniTable();
    await loadDashboard();

    const name = currentAlumniData[idx]?.name || "Alumni";
    addActivity(`Enrichment ${name} disimpan (${result.enrichmentScore}% terisi)`, "check", "text-emerald-600", "bg-emerald-50");
    showToast(`✅ Data profil ${name} berhasil disimpan! (${result.enrichmentScore}% terisi)`, "success");
  } catch (err) {
    console.error("saveEnrichment error:", err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Simpan Data`;
      if (window.lucide) lucide.createIcons();
    }
    showToast("❌ Gagal menyimpan data. Silakan coba lagi.", "error");
  }
};

// ===== 10. TOAST NOTIFICATION =====
window.showToast = function (message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// ===== 11. SINKRONISASI PDDIKTI MASSAL =====
document.getElementById("btn-start-pddikti")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-start-pddikti");
  const progressArea = document.getElementById("pddikti-progress-area");
  const statusText = document.getElementById("pddikti-status-text");
  const countText = document.getElementById("pddikti-count-text");
  const progressBar = document.getElementById("pddikti-progress-bar");

  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg> Sedang Sinkronisasi...`;
  progressArea.classList.remove("hidden");

  const updateUI = (nama, proses, total, pesan) => {
    statusText.textContent = `Mencari data: ${nama} | ${pesan}`;
    countText.textContent = `${proses} / ${total} Alumni Terproses`;
    progressBar.style.width = `${total === 0 ? 0 : Math.round((proses / total) * 100)}%`;
  };

  try {
    const mode = document.querySelector('input[name="pddikti-sync-mode"]:checked')?.value || 'page';
    let targetData = [];

    if (mode === 'page') {
      targetData = currentAlumniData;
    } else {
      // Fetch dari database berdasarkan mode dengan Pagination (untuk bypass limit 1000)
      let allData = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      statusText.textContent = "Mengumpulkan seluruh data dari database...";

      while (hasMore) {
        let query = supabase.from("alumni").select("*").order("id", { ascending: true }).range(from, from + limit - 1);
        
        if (mode === 'pending') {
          query = query.lt("confidence", 70);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = allData.concat(data);
          from += limit;
          
          countText.textContent = `Menyiapkan ${allData.length} data...`;
          
          if (data.length < limit) {
             hasMore = false; // Data sudah habis
          }
        } else {
          hasMore = false;
        }
      }
      targetData = allData;
    }

    if (targetData.length === 0) {
      showToast("Tidak ada data untuk disinkronisasi", "info");
      return;
    }

    const totalSelesai = await jalankanSinkronisasiPDDiktiMassal(targetData, updateUI, updateStatus);
    showToast(`✅ Sinkronisasi Selesai! ${totalSelesai} data diproses.`, "success");
    addActivity(`Sinkronisasi massal PDDikti selesai: ${totalSelesai} data`, "server", "text-blue-600", "bg-blue-50");
    await Promise.all([loadPage(currentPage), loadDashboard()]);
  } catch (error) {
    console.error("Sinkronisasi Error:", error);
    showToast("❌ Terjadi kesalahan saat sinkronisasi PDDikti.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Mulai Sinkronisasi`;
    progressArea.classList.add("hidden");
    document.getElementById('sync-pddikti-modal')?.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
  }
});

// ===== EXPOSE GLOBAL =====
window.handleTrackAlumni = handleTrackAlumni;
window.handleDeleteAlumni = handleDeleteAlumni;
window.confirmVerify = confirmVerify;
window.updateFilterYearsOptions = () => {}; // Deprecated, handled by loadFilterOptions()
window.renderAlumniTable = renderAlumniTable;
window.createAlumni = createAlumni;

// ===== AUTO ENRICHMENT BATCH =====
window.startBatchEnrich = async function () {
  const mode = document.querySelector('input[name="batch-enrich-mode"]:checked')?.value || 'page';

  const btnStart   = document.getElementById('btn-start-batch-enrich');
  const btnClose   = document.getElementById('btn-close-batch-enrich');
  const progressEl = document.getElementById('batch-enrich-progress-area');
  const statusEl   = document.getElementById('batch-enrich-status-text');
  const countEl    = document.getElementById('batch-enrich-count-text');
  const barEl      = document.getElementById('batch-enrich-progress-bar');
  const logEl      = document.getElementById('batch-enrich-log');

  // Reset UI
  progressEl.classList.remove('hidden');
  logEl.innerHTML = '';
  barEl.style.width = '0%';
  btnStart.disabled = true;
  btnStart.innerHTML = `<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Memproses...`;
  btnClose.disabled = true;

  const addLog = (msg) => {
    const line = document.createElement('div');
    line.textContent = msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  };

  try {
    // Kumpulkan daftar alumni yang akan diproses
    let targets = [];

    if (mode === 'page') {
      targets = [...currentAlumniData];
      addLog(`Mode: Halaman ini (${targets.length} alumni)`);
    } else {
      // Ambil semua yang belum ter-enrich dari DB (berlaku untuk 'all' dan 'all_fast')
      addLog('Mengambil data dari database...');
      statusEl.textContent = 'Mengambil data...';
      let offset = 0;
      const batchSize = 200;
      while (true) {
        const { data, error } = await supabase
          .from('alumni')
          .select('id, name, nim, program, year, status, enrichment')
          .in('status', ['Pending', 'Not Found'])
          .range(offset, offset + batchSize - 1)
          .order('id', { ascending: true });
        if (error || !data || data.length === 0) break;
        targets.push(...data);
        if (data.length < batchSize) break;
        offset += batchSize;
      }
      addLog(`Mode: ${mode === 'all_fast' ? 'Prioritas' : 'Internet'} (${targets.length} alumni ditemukan)`);
    }

    if (targets.length === 0) {
      addLog('✅ Tidak ada alumni yang perlu diproses.');
      statusEl.textContent = 'Selesai — tidak ada data.';
      btnStart.disabled = false;
      btnStart.innerHTML = `<i data-lucide="zap" class="w-4 h-4"></i> Mulai Enrichment`;
      btnClose.disabled = false;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let done = 0, sukses = 0, fallback = 0, gagal = 0;
    const total = targets.length;

    for (const alumni of targets) {
      statusEl.textContent = `[${done + 1}/${total}] ${alumni.name || alumni.nama || '-'}`;
      countEl.textContent  = `${done} / ${total}`;
      barEl.style.width    = `${Math.round((done / total) * 100)}%`;

      let enrichData = null;
      let usedFallback = false;

      // Helper cek kosong
      const isEmpty = (d) => !d || (!d.linkedin && !d.instagram && !d.facebook && !d.email && !d.noHp && !d.tempatKerja);

      if (mode === 'all_fast') {
        enrichData = fallbackEnrichAlumni(alumni);
        usedFallback = true;
      } else {
        try {
          enrichData = await autoEnrichAlumni(alumni);
        } catch (_) {
          enrichData = null;
        }

        if (isEmpty(enrichData)) {
          enrichData   = fallbackEnrichAlumni(alumni);
          usedFallback = true;
        }
      }

      try {
        await saveEnrichmentToDatabase(alumni.id, enrichData);
        if (usedFallback) {
          fallback++;
          addLog(`⚠️ [${alumni.name || alumni.nama}] — data heuristik`);
        } else {
          sukses++;
          addLog(`✅ [${alumni.name || alumni.nama}] — ${enrichData.sumber?.join(', ') || 'tersimpan'}`);
        }
      } catch (saveErr) {
        gagal++;
        addLog(`❌ [${alumni.name || alumni.nama}] — gagal simpan`);
      }

      done++;
      
      // Jeda kecil agar tidak membebani server, jika all_fast jauh lebih cepat (tanpa jeda, biar browser napas sedikit dkk tunggu ui rerender)
      if (mode !== 'all_fast') {
        await new Promise(r => setTimeout(r, 800));
      } else if (done % 10 === 0) {
        // Biar UI progress jalan / tidak freez kalau datanya panjang
        await new Promise(r => setTimeout(r, 10));
      }
    }

    barEl.style.width   = '100%';
    countEl.textContent = `${done} / ${total}`;
    statusEl.textContent = `Selesai! ✅ ${sukses} internet · ⚠️ ${fallback} heuristik · ❌ ${gagal} gagal`;
    addLog(`--- Selesai: ${sukses} berhasil, ${fallback} heuristik, ${gagal} gagal ---`);

    // Refresh tabel & dashboard
    await Promise.all([loadPage(currentPage), loadDashboard()]);

  } catch (err) {
    console.error('Batch enrich error:', err);
    addLog(`❌ Error: ${err.message}`);
    statusEl.textContent = 'Terjadi kesalahan.';
  } finally {
    btnStart.disabled = false;
    btnStart.innerHTML = `<i data-lucide="zap" class="w-4 h-4"></i> Mulai Lagi`;
    btnClose.disabled = false;
    if (window.lucide) lucide.createIcons();
  }
};

// ===== INIT (Estafet dari Auth) =====
window.initializeAppData = async function () {
  // Jalankan semua inisialisasi secara paralel untuk maksimalkan kecepatan
  await Promise.all([
    loadPage(1),
    loadDashboard(),
    loadFilterOptions(),
    loadVerificationPage(1),
  ]);
};