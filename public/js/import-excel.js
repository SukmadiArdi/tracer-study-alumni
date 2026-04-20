// ===== IMPORT EXCEL MODULE =====
// import-excel.js — Fitur Import Data Alumni dari file .xlsx / .xls / .csv

import { createAlumni } from "./alumni.js";
import { updateDashboard, addActivity } from "./dashboard.js";

// ===== COLUMN MAPPING =====
const COLUMN_MAP = {
  "nama lulusan":  "name",
  "nama":          "name",
  "name":          "name",
  "nim":           "nim",
  "no. induk":     "nim",
  "tahun masuk":   "year",
  "tahun":         "year",
  "angkatan":      "year",
  "year":          "year",
  "program studi": "program",
  "prodi":         "program",
  "program":       "program",
  "fakultas":      "fakultas",
  "tanggal lulus": "tanggalLulus",
};

let importPreviewData = [];

// ===== FUNGSI UTAMA =====

function openImportModal() {
  document.getElementById("import-modal")?.remove();

  const html = `
  <div id="import-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
       onclick="if(event.target===this)closeImportModal()">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">

      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
        <div>
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>📂</span> Import Data Alumni dari Excel
          </h2>
          <p class="text-sm text-gray-500 mt-0.5">Mendukung format .xlsx, .xls, dan .csv</p>
        </div>
        <button onclick="closeImportModal()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>

      <div class="p-6 space-y-5">

        <!-- Format Info -->
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p class="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4"></i> Format Kolom Excel yang Dikenali
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-amber-700">
            <span class="bg-amber-100 px-2 py-1 rounded-lg">✅ Nama Lulusan</span>
            <span class="bg-amber-100 px-2 py-1 rounded-lg">✅ NIM</span>
            <span class="bg-amber-100 px-2 py-1 rounded-lg">✅ Tahun Masuk</span>
            <span class="bg-amber-100 px-2 py-1 rounded-lg">✅ Tanggal Lulus</span>
            <span class="bg-amber-100 px-2 py-1 rounded-lg">✅ Fakultas</span>
            <span class="bg-amber-100 px-2 py-1 rounded-lg">✅ Program Studi</span>
          </div>
        </div>

        <!-- Upload Area -->
        <div id="upload-area"
             class="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-8 text-center transition-colors cursor-pointer group"
             onclick="document.getElementById('excel-file-input').click()"
             ondragover="event.preventDefault(); this.classList.add('border-blue-400','bg-blue-50')"
             ondragleave="this.classList.remove('border-blue-400','bg-blue-50')"
             ondrop="handleFileDrop(event)">
          <i data-lucide="upload-cloud" class="w-10 h-10 text-gray-300 group-hover:text-blue-400 mx-auto mb-3 transition-colors"></i>
          <p class="text-sm font-semibold text-gray-600 group-hover:text-blue-600">Klik atau drag & drop file Excel di sini</p>
          <p class="text-xs text-gray-400 mt-1">Format: .xlsx, .xls, .csv — Maks. 10MB</p>
          <input id="excel-file-input" type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="handleFileSelect(this)">
        </div>

        <!-- Preview Area -->
        <div id="import-preview" class="hidden space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-800" id="preview-title">Preview Data</p>
              <p class="text-xs text-gray-400 mt-0.5" id="preview-subtitle"></p>
            </div>
            <div class="flex gap-2">
              <button onclick="resetImport()"
                class="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                Ganti File
              </button>
              <button onclick="confirmImport()" id="confirm-import-btn"
                class="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i> Import ke Database
              </button>
            </div>
          </div>

          <!-- Warning duplikat -->
          <div id="duplicate-warning" class="hidden bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p class="text-xs text-amber-700 font-semibold" id="duplicate-warning-text"></p>
          </div>

          <!-- Tabel Preview -->
          <div class="rounded-xl border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto max-h-64">
              <table class="w-full text-xs">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left font-semibold text-gray-500">#</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-500">Nama Lulusan</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-500">NIM</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-500">Program Studi</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-500">Tahun Masuk</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-500">Fakultas</th>
                    <th class="px-3 py-2 text-left font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody id="import-preview-tbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Progress -->
          <div id="import-progress" class="hidden">
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span id="import-progress-text">Mengimpor...</span>
              <span id="import-progress-pct">0%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div id="import-progress-bar" class="h-full bg-blue-500 rounded-full transition-all duration-300" style="width:0%"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", html);
  if (window.lucide) lucide.createIcons();
}

function closeImportModal() {
  const modal = document.getElementById("import-modal");
  if (modal) {
    modal.style.opacity    = "0";
    modal.style.transition = "opacity 0.2s";
    setTimeout(() => { modal.remove(); importPreviewData = []; }, 220);
  }
}

function handleFileDrop(event) {
  event.preventDefault();
  const area = document.getElementById("upload-area");
  area?.classList.remove("border-blue-400", "bg-blue-50");
  const file = event.dataTransfer.files[0];
  if (file) processExcelFile(file);
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (file) processExcelFile(file);
}

function processExcelFile(file) {
  if (!window.XLSX) {
    if (window.showToast) showToast("❌ Library SheetJS belum dimuat. Refresh dan coba lagi.", "error");
    return;
  }

  const reader  = new FileReader();
  reader.onload = function (e) {
    try {
      const data     = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows  = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rawRows.length === 0) {
        if (window.showToast) showToast("❌ File Excel kosong atau format tidak dikenali.", "error");
        return;
      }

      importPreviewData = rawRows.map((row, idx) => {
        const mapped = { _rowIndex: idx + 2, _valid: true, _errors: [] };

        Object.entries(row).forEach(([key, value]) => {
          const fieldName = COLUMN_MAP[key.toLowerCase().trim()];
          if (fieldName) mapped[fieldName] = String(value).trim();
        });

        if (!mapped.name || mapped.name === "")    { mapped._valid = false; mapped._errors.push("Nama kosong"); }
        if (!mapped.nim  || mapped.nim  === "")    { mapped._valid = false; mapped._errors.push("NIM kosong"); }
        if (!mapped.year || mapped.year === "")    mapped.year    = new Date().getFullYear().toString();
        if (!mapped.program || mapped.program === "") mapped.program = mapped.fakultas || "Tidak Diketahui";

        const isDuplicate = (window.currentAlumniData || []).some(
          a => a.nim === mapped.nim || a.name?.toLowerCase() === (mapped.name || "").toLowerCase()
        );
        if (isDuplicate) mapped._duplicate = true;

        return mapped;
      });

      renderImportPreview();
    } catch (err) {
      console.error("Error parsing Excel:", err);
      if (window.showToast) showToast("❌ Gagal membaca file. Pastikan format benar (.xlsx/.xls/.csv)", "error");
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderImportPreview() {
  const total      = importPreviewData.length;
  const valid      = importPreviewData.filter(r => r._valid && !r._duplicate).length;
  const invalid    = importPreviewData.filter(r => !r._valid).length;
  const duplicates = importPreviewData.filter(r => r._duplicate).length;

  document.getElementById("upload-area")?.classList.add("hidden");
  document.getElementById("import-preview")?.classList.remove("hidden");

  const titleEl    = document.getElementById("preview-title");
  const subtitleEl = document.getElementById("preview-subtitle");
  if (titleEl)    titleEl.textContent    = `Preview: ${total} data ditemukan`;
  if (subtitleEl) subtitleEl.textContent = `✅ ${valid} siap import  |  ❌ ${invalid} error  |  ⚠️ ${duplicates} duplikat`;

  const dupWarn = document.getElementById("duplicate-warning");
  if (dupWarn) {
    if (duplicates > 0) {
      dupWarn.classList.remove("hidden");
      const dupText = document.getElementById("duplicate-warning-text");
      if (dupText) dupText.textContent = `⚠️ ${duplicates} data duplikat (NIM/Nama sudah ada) — akan dilewati saat import.`;
    } else {
      dupWarn.classList.add("hidden");
    }
  }

  const tbody = document.getElementById("import-preview-tbody");
  if (!tbody) return;

  tbody.innerHTML = importPreviewData.map((row, i) => {
    let rowClass = "border-b border-gray-50";
    let badge    = `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ Valid</span>`;
    if (row._duplicate) {
      rowClass = "border-b border-amber-50 bg-amber-50/50";
      badge    = `<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">⚠ Duplikat</span>`;
    } else if (!row._valid) {
      rowClass = "border-b border-red-50 bg-red-50/50";
      badge    = `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">✗ ${row._errors.join(", ")}</span>`;
    }
    return `
      <tr class="${rowClass}">
        <td class="px-3 py-2 text-gray-400">${i + 1}</td>
        <td class="px-3 py-2 font-medium text-gray-800">${row.name    || "-"}</td>
        <td class="px-3 py-2 text-gray-600">${row.nim     || "-"}</td>
        <td class="px-3 py-2 text-gray-600">${row.program || "-"}</td>
        <td class="px-3 py-2 text-gray-600">${row.year    || "-"}</td>
        <td class="px-3 py-2 text-gray-500">${row.fakultas|| "-"}</td>
        <td class="px-3 py-2">${badge}</td>
      </tr>`;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function resetImport() {
  importPreviewData = [];
  document.getElementById("upload-area")?.classList.remove("hidden");
  document.getElementById("import-preview")?.classList.add("hidden");
  const input = document.getElementById("excel-file-input");
  if (input) input.value = "";
}

async function confirmImport() {
  const toImport = importPreviewData.filter(r => r._valid && !r._duplicate);
  if (toImport.length === 0) {
    if (window.showToast) showToast("Tidak ada data valid yang bisa diimport.", "error");
    return;
  }

  const btn      = document.getElementById("confirm-import-btn");
  const progress = document.getElementById("import-progress");
  if (btn)      { btn.disabled = true; btn.innerHTML = "⏳ Mengimpor..."; }
  if (progress)   progress.classList.remove("hidden");

  let success = 0;
  for (let i = 0; i < toImport.length; i++) {
    const row = toImport[i];
    try {
      const newId = await createAlumni({
        name:    row.name,
        nim:     row.nim,
        program: row.program || "Tidak Diketahui",
        year:    parseInt(row.year) || new Date().getFullYear(),
      });

      if (window.currentAlumniData) {
        window.currentAlumniData.push({
          id: newId, name: row.name, nim: row.nim,
          program: row.program || "Tidak Diketahui",
          year: parseInt(row.year) || new Date().getFullYear(),
          status: "Pending", confidence: 0, enrichment: {}
        });
      }
      success++;
    } catch (e) {
      console.error("Gagal import row:", row.name, e);
    }

    const pct = Math.round(((i + 1) / toImport.length) * 100);
    const bar  = document.getElementById("import-progress-bar");
    const pctEl = document.getElementById("import-progress-pct");
    const txtEl = document.getElementById("import-progress-text");
    if (bar)   bar.style.width      = pct + "%";
    if (pctEl) pctEl.textContent    = pct + "%";
    if (txtEl) txtEl.textContent    = `Mengimpor ${i + 1} dari ${toImport.length}...`;

    await new Promise(r => setTimeout(r, 150));
  }

  closeImportModal();

  if (window.updateFilterYearsOptions) window.updateFilterYearsOptions();
  if (window.renderAlumniTable) window.renderAlumniTable();
  if (window.updateDashboard && window.currentAlumniData) window.updateDashboard(window.currentAlumniData);

  if (window.addActivity) addActivity(
    `Import Excel selesai: ${success} alumni berhasil ditambahkan`,
    "upload", "text-blue-600", "bg-blue-50"
  );
  if (window.showToast) showToast(`✅ ${success} alumni berhasil diimport!`, "success");
}

// ===== EXPOSE KE WINDOW =====
window.openImportModal  = openImportModal;
window.closeImportModal = closeImportModal;
window.handleFileDrop   = handleFileDrop;
window.handleFileSelect = handleFileSelect;
window.resetImport      = resetImport;
window.confirmImport    = confirmImport;