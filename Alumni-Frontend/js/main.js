import { getAlumni, createAlumni, deleteAlumni, updateStatus, saveEnrichmentToFirestore, getAlumniById } from "./alumni.js";
import { runTracking, jalankanSinkronisasiPDDiktiMassal, verifikasiSatuPDDikti } from "./tracking.js";
import { updateDashboard, addActivity } from "./dashboard.js";
import { generateSearchLinks, generateCompanySearchLinks, inferStatusKerja, renderEnrichmentModal } from "./enrichment.js";
import "./import-excel.js";

let currentAlumniData = [];

// ===== 1. INISIALISASI & LOAD DATA =====
async function loadData() {
  currentAlumniData = await getAlumni();
  window.currentAlumniData = currentAlumniData;
  document.dispatchEvent(new CustomEvent("alumni-loaded", { detail: currentAlumniData }));
  updateFilterYearsOptions();
  renderAlumniTable();
  renderVerification();
  updateDashboard(currentAlumniData);
  if (window.lucide) lucide.createIcons();
}

// ===== 2. FILTER DINAMIS & SEARCH =====
function updateFilterYearsOptions() {
  const filterYear = document.getElementById("filter-year");
  if (!filterYear) return;
  const uniqueYears = [...new Set(currentAlumniData.map(a => a.year))].filter(y => y).sort((a, b) => b - a);
  const currentVal = filterYear.value;
  filterYear.innerHTML =
    '<option value="All">Semua Tahun</option>' +
    uniqueYears.map(y => `<option value="${y}">${y}</option>`).join("");
  filterYear.value = uniqueYears.includes(parseInt(currentVal)) ? currentVal : "All";
}

document.getElementById("filter-program")?.addEventListener("change", () => { alumniCurrentPage = 1; renderAlumniTable(); });
document.getElementById("filter-year")?.addEventListener("change", () => { alumniCurrentPage = 1; renderAlumniTable(); });
document.getElementById("filter-status")?.addEventListener("change", () => { alumniCurrentPage = 1; renderAlumniTable(); });
document.getElementById("search-alumni")?.addEventListener("input", () => { alumniCurrentPage = 1; renderAlumniTable(); });
document.getElementById("search-verification")?.addEventListener("input", () => { verifCurrentPage = 1; renderVerification(); });

// ===== PAGINATION STATE ALUMNI =====
const ALUMNI_PAGE_SIZE = 20;
let alumniCurrentPage = 1;

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

  const fProg = document.getElementById("filter-program")?.value || "All";
  const fYear = document.getElementById("filter-year")?.value || "All";
  const fStat = document.getElementById("filter-status")?.value || "All";
  const searchVal = (document.getElementById("search-alumni")?.value || "").toLowerCase().trim();

  const filteredData = currentAlumniData.filter(a => {
    if (fProg !== "All" && a.program !== fProg) return false;
    if (fYear !== "All" && a.year.toString() !== fYear) return false;
    if (fStat !== "All") {
      if (fStat === "Enriched") {
        const enr = a.enrichment;
        if (!enr?.tempatKerja && !enr?.linkedin && !enr?.email) return false;
      } else {
        if (a.status !== fStat) return false;
      }
    }
    if (searchVal) {
      const matchName = a.name?.toLowerCase().trim().includes(searchVal);
      const matchNim = a.nim?.toString().toLowerCase().trim().includes(searchVal);
      if (!matchName && !matchNim) return false;
    }
    return true;
  });

  // Hitung pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ALUMNI_PAGE_SIZE));
  if (alumniCurrentPage > totalPages) alumniCurrentPage = totalPages;

  const start = (alumniCurrentPage - 1) * ALUMNI_PAGE_SIZE;
  const end = start + ALUMNI_PAGE_SIZE;
  const visible = filteredData.slice(start, end);

  // Update count & page info
  if (countText) countText.textContent = `Menampilkan ${filteredData.length} dari ${currentAlumniData.length} alumni`;
  if (pageInfo) pageInfo.textContent = filteredData.length > 0 ? `Halaman ${alumniCurrentPage} / ${totalPages}` : "";

  // Render kosong
  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center py-12 text-gray-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm">Tidak ada alumni yang ditemukan</p>
      </td></tr>`;
    if (paginEl) paginEl.classList.add("hidden");
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Render baris tabel
  const statusColor = {
    "Identified": "bg-emerald-100 text-emerald-700",
    "Pending": "bg-amber-100 text-amber-700",
    "Not Found": "bg-red-100 text-red-700"
  };

  tbody.innerHTML = visible.map(a => {
    const enr = a.enrichment || {};
    const hasEnrichment = enr.tempatKerja || enr.linkedin || enr.email;
    const enrichBadge = hasEnrichment
      ? `<span class="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-1">
           <i data-lucide="check-circle" class="w-3 h-3"></i> Enriched
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
            ${a.status}
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
            <button onclick="handleDeleteAlumni('${a.id}', '${a.name.replace(/'/g, '')}')"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");

  // Render pagination
  if (paginEl) paginEl.classList.remove("hidden");
  if (prevBtn) prevBtn.disabled = alumniCurrentPage === 1;
  if (nextBtn) nextBtn.disabled = alumniCurrentPage === totalPages;

  if (pageNumEl) {
    pageNumEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - alumniCurrentPage) <= 1)
      .reduce((acc, p, idx, arr) => {
        if (idx > 0 && p - arr[idx - 1] > 1) {
          acc += `<span class="px-2 py-1.5 text-xs text-gray-400">...</span>`;
        }
        acc += `
          <button onclick="goToAlumniPage(${p})"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
            ${p === alumniCurrentPage
            ? 'bg-red-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}">
            ${p}
          </button>`;
        return acc;
      }, "");
  }

  if (window.lucide) lucide.createIcons();
}

// ===== Navigasi Pagination Alumni =====
window.changeAlumniPage = function (dir) {
  const totalPages = Math.ceil(
    currentAlumniData.filter(() => true).length / ALUMNI_PAGE_SIZE
  );
  alumniCurrentPage = Math.min(Math.max(1, alumniCurrentPage + dir), totalPages);
  renderAlumniTable();
};

window.goToAlumniPage = function (page) {
  alumniCurrentPage = page;
  renderAlumniTable();
};

// ===== 4. RENDER VERIFIKASI MANUAL =====
const VERIF_PAGE_SIZE = 20;
let verifCurrentPage = 1;

function renderVerification() {
  const container = document.getElementById("verification-list");
  const paginEl = document.getElementById("verification-pagination");
  const countEl = document.getElementById("verification-count");
  const pageNumEl = document.getElementById("verif-page-numbers");
  const prevBtn = document.getElementById("verif-prev");
  const nextBtn = document.getElementById("verif-next");
  if (!container) return;

  const searchVal = (document.getElementById("search-verification")?.value || "").toLowerCase().trim();

  const pendingList = currentAlumniData.filter(a => {
    if (a.status !== "Pending") return false;
    if (searchVal) {
      const matchName = a.name?.toLowerCase().includes(searchVal);
      const matchNim = a.nim?.toLowerCase().includes(searchVal);
      if (!matchName && !matchNim) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(pendingList.length / VERIF_PAGE_SIZE));

  // Pastikan halaman tidak melebihi total
  if (verifCurrentPage > totalPages) verifCurrentPage = totalPages;

  const start = (verifCurrentPage - 1) * VERIF_PAGE_SIZE;
  const end = start + VERIF_PAGE_SIZE;
  const visible = pendingList.slice(start, end);

  // Count text
  if (countEl) {
    countEl.textContent = `Menampilkan ${start + 1}–${Math.min(end, pendingList.length)} dari ${pendingList.length} alumni pending`;
  }

  // Render list
  if (pendingList.length === 0) {
    container.innerHTML = `<p class="text-sm text-gray-400 text-center py-6">
      ${searchVal ? "Tidak ada hasil pencarian." : "Tidak ada alumni yang perlu diverifikasi"}
    </p>`;
    if (paginEl) paginEl.classList.add("hidden");
    return;
  }

  container.innerHTML = visible.map(a => `
    <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p class="text-sm font-medium text-gray-900">${a.name}</p>
        <p class="text-xs text-gray-400">${a.program} &bull; ${a.year} &bull; ${a.confidence || 0}% confidence</p>
      </div>
      <div class="flex gap-2">
        <button onclick="confirmVerify('${a.id}', 'approve')"
          class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
          Identified
        </button>
        <button onclick="confirmVerify('${a.id}', 'reject')"
          class="px-3 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
          Not Found
        </button>
      </div>
    </div>
  `).join("");

  // Render pagination
  if (paginEl) paginEl.classList.remove("hidden");

  // Prev / Next button state
  if (prevBtn) prevBtn.disabled = verifCurrentPage === 1;
  if (nextBtn) nextBtn.disabled = verifCurrentPage === totalPages;

  // Page number buttons
  if (pageNumEl) {
    pageNumEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => {
        // Tampilkan halaman di sekitar halaman aktif saja (max 5 tombol)
        return p === 1 || p === totalPages ||
          Math.abs(p - verifCurrentPage) <= 1;
      })
      .reduce((acc, p, idx, arr) => {
        // Tambah "..." jika ada gap
        if (idx > 0 && p - arr[idx - 1] > 1) {
          acc += `<span class="px-2 py-1.5 text-xs text-gray-400">...</span>`;
        }
        acc += `
          <button onclick="goToVerifPage(${p})"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
            ${p === verifCurrentPage
            ? 'bg-red-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}">
            ${p}
          </button>`;
        return acc;
      }, "");
  }
}

// ===== Navigasi Pagination =====
window.changeVerifPage = function (dir) {
  const searchVal = (document.getElementById("search-verification")?.value || "").toLowerCase().trim();
  const totalItems = currentAlumniData.filter(a => {
    if (a.status !== "Pending") return false;
    if (searchVal) {
      return a.name?.toLowerCase().includes(searchVal) || a.nim?.toLowerCase().includes(searchVal);
    }
    return true;
  }).length;
  const totalPages = Math.ceil(totalItems / VERIF_PAGE_SIZE);
  verifCurrentPage = Math.min(Math.max(1, verifCurrentPage + dir), totalPages);
  renderVerification();
};

window.goToVerifPage = function (page) {
  verifCurrentPage = page;
  renderVerification();
};

// ===== 5. TRACKING ALUMNI (DIUPDATE KE PDDIKTI) =====
async function handleTrackAlumni(id) {
  const alumni = currentAlumniData.find(a => a.id === id);
  if (!alumni) return;

  // 1. Munculkan toast loading agar user tahu sistem sedang bekerja
  showToast(`🔍 Sedang mencari data ${alumni.name} di PDDikti...`, "info");

  try {
    // 2. Panggil API PDDikti
    const result = await verifikasiSatuPDDikti(alumni);
    
    // 3. Simpan dan tangkap status akhirnya (yang sudah mempertimbangkan profil)
    const finalStatus = await updateStatus(id, result.status, result.confidence);
    
    // 4. Update data di memori aplikasi
    const idx = currentAlumniData.findIndex(a => a.id === id);
    if (idx !== -1) {
      currentAlumniData[idx].status = finalStatus; // Gunakan finalStatus
      currentAlumniData[idx].confidence = result.confidence;
    }
    window.currentAlumniData = currentAlumniData;

    // 5. Render ulang UI agar tabel dan dashboard langsung berubah
    renderAlumniTable();
    renderVerification();
    updateDashboard(currentAlumniData);

    // 6. Catat aktivitas dan tampilkan sukses
    addActivity(`Pencarian PDDikti ${alumni.name}: ${finalStatus} (${result.confidence}%)`, "radar", "text-blue-600", "bg-blue-50");
    showToast(`✅ Selesai! ${alumni.name} berstatus: ${finalStatus}`, finalStatus === "Identified" ? "success" : "info");

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
    const idx = currentAlumniData.findIndex(a => a.id === id);
    if (idx !== -1) {
      currentAlumniData[idx].status = status;
      currentAlumniData[idx].confidence = confidence;
    }
    window.currentAlumniData = currentAlumniData;
    renderAlumniTable();
    renderVerification();
    updateDashboard(currentAlumniData);
    const name = currentAlumniData.find(a => a.id === id)?.name || "Alumni";
    addActivity(`${name} diverifikasi sebagai ${status}`, "check", "text-emerald-600", "bg-emerald-50");
    showToast(`Status diperbarui: ${status}`, "success");
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
    currentAlumniData = currentAlumniData.filter(a => a.id !== id);
    window.currentAlumniData = currentAlumniData;
    renderAlumniTable();
    updateDashboard(currentAlumniData);
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
    const newId = await createAlumni(data);
    currentAlumniData.push({
      id: newId, ...data,
      year: parseInt(data.year),
      status: "Pending", confidence: 0, enrichment: {}
    });
    window.currentAlumniData = currentAlumniData;
    updateFilterYearsOptions();
    renderAlumniTable();
    updateDashboard(currentAlumniData);
    document.getElementById("add-alumni-form").reset();
    document.getElementById("add-alumni-modal")?.classList.add("hidden");
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

    // Gabungkan tempat + alamat, buang spasi ekstra
    const query = [tempat, alamat].filter(v => v !== "").join(", ");

    if (!query) {
      showToast("Isi dulu Tempat Bekerja atau Alamat!", "error");
      return;
    }

    const q = encodeURIComponent(query);
    window.open(`https://www.google.com/maps/search/${q}`, "_blank");
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
    const result = await saveEnrichmentToFirestore(alumniId, enrichmentData);
    const idx = currentAlumniData.findIndex(a => a.id === alumniId);
    
    if (idx !== -1) {
      currentAlumniData[idx].enrichment = enrichmentData;
      // Gunakan nilai enrichmentScore yang baru
      currentAlumniData[idx].enrichmentScore = result.enrichmentScore; 
      // Update status agar bisa berubah jadi 'Identified' jika profil cukup lengkap
      currentAlumniData[idx].status = result.status; 
    }
    
    window.currentAlumniData = currentAlumniData;
    closeEnrichmentModal();
    renderAlumniTable();
    updateDashboard(currentAlumniData);
    
    const name = currentAlumniData[idx]?.name || "Alumni";
    // Toast & Activity log juga diupdate untuk memanggil enrichmentScore
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

  // 1. Ubah tampilan tombol menjadi state Loading
  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg> Sedang Sinkronisasi...`;
  progressArea.classList.remove("hidden");

  // 2. Fungsi Callback untuk memperbarui UI Progress Bar dari tracking.js
  const updateUI = (nama, proses, total, pesan) => {
    statusText.textContent = `Mencari data: ${nama} | ${pesan}`;
    countText.textContent = `${proses} / ${total} Alumni Terproses`;
    const persentase = total === 0 ? 0 : Math.round((proses / total) * 100);
    progressBar.style.width = `${persentase}%`;
  };

  try {
    // 3. Eksekusi fungsi batch crawling (mengambil daftar alumni yang sedang aktif di memori)
    const totalSelesai = await jalankanSinkronisasiPDDiktiMassal(currentAlumniData, updateUI, updateStatus);

    // 4. Beri notifikasi dan catat aktivitas ke dashboard
    showToast(`✅ Sinkronisasi Selesai! ${totalSelesai} data diproses.`, "success");
    addActivity(`Sinkronisasi massal PDDikti selesai: ${totalSelesai} data`, "server", "text-blue-600", "bg-blue-50");

    // 5. Muat ulang data dari Firebase agar tabel & grafik ter-update otomatis
    await loadData();

  } catch (error) {
    console.error("Sinkronisasi Error:", error);
    showToast("❌ Terjadi kesalahan saat sinkronisasi PDDikti.", "error");
  } finally {
    // 6. Kembalikan kondisi UI Modal seperti semula
    btn.disabled = false;
    btn.innerHTML = `Mulai Sinkronisasi`;
    progressArea.classList.add("hidden");
    document.getElementById('sync-pddikti-modal').classList.add('hidden');
    if (window.lucide) lucide.createIcons();
  }
});

// ===== EXPOSE GLOBAL =====
window.handleTrackAlumni = handleTrackAlumni;
window.handleDeleteAlumni = handleDeleteAlumni;
window.confirmVerify = confirmVerify;
window.updateFilterYearsOptions = updateFilterYearsOptions;
window.renderAlumniTable = renderAlumniTable;
window.createAlumni = createAlumni;

// ===== INIT (Estafet dari Auth) =====
window.initializeAppData = function() {
  loadData();
};