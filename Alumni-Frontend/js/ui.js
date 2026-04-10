// File: ui.js

const SECTIONS = ["dashboard", "alumni", "enrichment-view", "verification"];
const TITLES = { 
    "dashboard": "Dashboard", 
    "alumni": "Data Alumni", 
    "enrichment-view": "Enrichment Data", 
    "verification": "Verifikasi Manual" 
};

// Navigasi Menu
window.showSection = function (name) {
    SECTIONS.forEach(s => { 
        const el = document.getElementById("section-" + s); 
        if (el) el.classList.toggle("hidden", s !== name); 
    });
    
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = TITLES[name] || name;
    
    document.querySelectorAll(".nav-item").forEach(btn => {
        const active = btn.dataset.section === name;
        btn.classList.toggle("active-nav", active);
        btn.classList.toggle("text-white", active);
        btn.classList.toggle("text-white/80", !active);
    });
    
    if (name === "enrichment-view") renderEnrichmentSummary();
    if (window.lucide) lucide.createIcons();
};

// ==========================================
// PAGINATION & RENDER ENRICHMENT
// ==========================================
const ENRICH_PAGE_SIZE = 20;
let enrichCurrentPage = 1;

window.renderEnrichmentSummary = function () {
    if (!window.currentAlumniData) return;
    const allData = window.currentAlumniData;
    const tbody = document.getElementById("enrichment-table-body");
    const paginEl = document.getElementById("enrichment-pagination");
    const countEl = document.getElementById("enrichment-count");
    const prevBtn = document.getElementById("enrich-prev");
    const nextBtn = document.getElementById("enrich-next");
    const pageNumEl = document.getElementById("enrich-page-numbers");
    
    if (!tbody) return;

    // Update stat cards
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("count-linkedin", allData.filter(a => a.enrichment?.linkedin).length);
    set("count-email", allData.filter(a => a.enrichment?.email).length);
    set("count-tempat-kerja", allData.filter(a => a.enrichment?.tempatKerja).length);
    set("count-nohp", allData.filter(a => a.enrichment?.noHp).length);

    // Search filter
    const searchVal = (document.getElementById("search-enrichment")?.value || "").toLowerCase().trim();
    const filtered = allData.filter(a => {
        if (!searchVal) return true;
        return a.name?.toLowerCase().includes(searchVal) || a.nim?.toLowerCase().includes(searchVal);
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / ENRICH_PAGE_SIZE));
    if (enrichCurrentPage > totalPages) enrichCurrentPage = totalPages;

    const start = (enrichCurrentPage - 1) * ENRICH_PAGE_SIZE;
    const end = start + ENRICH_PAGE_SIZE;
    const visible = filtered.slice(start, end);

    if (countEl) {
        countEl.textContent = `Menampilkan ${start + 1}–${Math.min(end, filtered.length)} dari ${filtered.length} alumni`;
    }

    // Render kosong
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-sm text-gray-400">Tidak ada hasil pencarian.</td></tr>`;
        if (paginEl) paginEl.classList.add("hidden");
        return;
    }

    // Helper centang
    const check = val => val ? `<span class="text-emerald-500 flex justify-center font-bold">✓</span>` : `<span class="text-gray-300 flex justify-center">–</span>`;

    tbody.innerHTML = visible.map(a => {
        const enr = a.enrichment || {};
        const pct = a.confidence || 0;
        const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-400" : "bg-gray-200";
        const statusBadge = enr.statusKerja
            ? `<span class="text-xs font-semibold px-2 py-1 rounded-full ${enr.statusKerja === "PNS" ? "bg-blue-100 text-blue-700" : enr.statusKerja === "Wirausaha" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}">${enr.statusKerja}</span>`
            : `<span class="text-gray-300 text-xs">-</span>`;

        return `
        <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
                <p class="font-medium text-gray-900 text-sm">${a.name}</p>
                <p class="text-xs text-gray-400">${a.nim}</p>
            </td>
            <td class="px-4 py-3">${check(enr.linkedin)}</td>
            <td class="px-4 py-3">${check(enr.instagram)}</td>
            <td class="px-4 py-3">${check(enr.email)}</td>
            <td class="px-4 py-3">${check(enr.noHp)}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${enr.tempatKerja || '<span class="text-gray-300 italic text-xs">-</span>'}</td>
            <td class="px-4 py-3 text-center">${statusBadge}</td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                        <div class="h-full ${barColor} rounded-full" style="width:${pct}%"></div>
                    </div>
                    <span class="text-xs text-gray-500 w-8 text-right">${pct}%</span>
                </div>
            </td>
            <td class="px-4 py-3 text-center">
                <button onclick="openEnrichmentModal('${a.id}'); showSection('alumni')" class="text-xs bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Edit
                </button>
            </td>
        </tr>`;
    }).join("");

    if (paginEl) paginEl.classList.remove("hidden");
    if (prevBtn) prevBtn.disabled = enrichCurrentPage === 1;
    if (nextBtn) nextBtn.disabled = enrichCurrentPage === totalPages;

    if (pageNumEl) {
        pageNumEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - enrichCurrentPage) <= 1)
            .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                    acc += `<span class="px-2 py-1.5 text-xs text-gray-400">...</span>`;
                }
                acc += `<button onclick="goToEnrichPage(${p})" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${p === enrichCurrentPage ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}">${p}</button>`;
                return acc;
            }, "");
    }

    if (window.lucide) lucide.createIcons();
};

window.changeEnrichPage = function (dir) {
    const searchVal = (document.getElementById("search-enrichment")?.value || "").toLowerCase().trim();
    const total = window.currentAlumniData.filter(a => !searchVal || a.name?.toLowerCase().includes(searchVal) || a.nim?.toLowerCase().includes(searchVal)).length;
    const totalPages = Math.ceil(total / ENRICH_PAGE_SIZE);
    enrichCurrentPage = Math.min(Math.max(1, enrichCurrentPage + dir), totalPages);
    window.renderEnrichmentSummary();
};

window.goToEnrichPage = function (page) {
    enrichCurrentPage = page;
    window.renderEnrichmentSummary();
};

// Event listener pencarian
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("search-enrichment")?.addEventListener("input", () => {
        enrichCurrentPage = 1;
        window.renderEnrichmentSummary();
    });
});