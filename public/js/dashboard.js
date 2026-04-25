// dashboard.js
import { supabase } from "./supabase.js";


// ===== RECENT ACTIVITY =====
let activities = JSON.parse(localStorage.getItem("alumniActivities")) || [
  {
    msg:   "Sistem berhasil dimuat",
    time:  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    icon:  "check",
    color: "text-emerald-600",
    bg:    "bg-emerald-50"
  }
];

export function addActivity(msg, icon = "info", color = "text-blue-600", bg = "bg-blue-50") {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  activities.unshift({ msg, time, icon, color, bg });
  if (activities.length > 5) activities.pop();
  localStorage.setItem("alumniActivities", JSON.stringify(activities));
  renderActivities();
}

export function renderActivities() {
  const container = document.getElementById("recent-activity-list");
  if (!container) return;
  container.innerHTML = activities.map(a => `
    <div class="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <div class="w-7 h-7 rounded-full ${a.bg} flex items-center justify-center flex-shrink-0 mt-0.5">
        <i data-lucide="${a.icon}" class="w-3.5 h-3.5 ${a.color}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-700 leading-snug">${a.msg}</p>
        <p class="text-xs text-gray-400 mt-0.5">${a.time}</p>
      </div>
    </div>
  `).join("");
  if (window.lucide) lucide.createIcons();
}


// ===== UPDATE DASHBOARD STATS & PROGRESS BAR =====
export function updateDashboard(alumniListOrStats = []) {
  let total, identified, pending, notFound, enriched;

  // Terima format baru (object stats dari getAlumniStats())
  if (!Array.isArray(alumniListOrStats)) {
    ({ total = 0, identified = 0, pending = 0, notFound = 0, enriched = 0 } = alumniListOrStats);
  } else {
    // Format lama (array) — tetap didukung untuk kompatibilitas
    const list = alumniListOrStats;
    total      = list.length;
    identified = list.filter(a => a.status === "Identified").length;
    pending    = list.filter(a => a.status === "Pending").length;
    notFound   = list.filter(a => a.status === "Not Found").length;
    enriched   = list.filter(a =>
      a.enrichment && Object.values(a.enrichment).some(v => v && v.toString().trim() !== "")
    ).length;
  }

  // === Stat cards ===
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val.toLocaleString();
  };
  set("stat-total",      total);
  set("stat-identified", identified);
  set("stat-pending",    pending);
  set("stat-not-found",  notFound);
  // === Progress bars ===
  const pct = (n) => total > 0 ? ((n / total) * 100).toFixed(1) : 0;

  const barIdentified = document.getElementById("bar-identified");
  const barPending    = document.getElementById("bar-pending");
  const barNotFound   = document.getElementById("bar-not-found");

  if (barIdentified) barIdentified.style.width = `${pct(identified)}%`;
  if (barPending)    barPending.style.width    = `${pct(pending)}%`;
  if (barNotFound)   barNotFound.style.width   = `${pct(notFound)}%`;

  // === Angka di samping progress bar ===
  set("stat-identified-2", identified);
  set("stat-pending-2",    pending);
  set("stat-not-found-2",  notFound);

  // Render activity juga supaya tetap tampil
  renderActivities();
  
  // Update accuracy dashboard as well
  fetchAccuracyMetrics();
}

// ===== FETCH ACCURACY METRICS =====
export async function fetchAccuracyMetrics() {
  try {
    const { data, error } = await supabase.rpc("calculate_accuracy_metrics");
    if (error) {
      console.error("Error fetching accuracy metrics:", error);
      return;
    }
    
    if (data) {
      // Data format: { total_data_acuan, total_verified, coverage, accuracy, completeness, final_score, sample_correct }
      
      // Update Card 1
      const totalVerifiedEl = document.getElementById("acc-total-verified");
      if (totalVerifiedEl) {
        totalVerifiedEl.textContent = `${(data.sample_correct ?? 0).toLocaleString()}`;
      }
      
      const accScorePercentEl = document.getElementById("acc-score-percent");
      if (accScorePercentEl) accScorePercentEl.textContent = `${data.accuracy}%`;
      
      const progressBarEl = document.getElementById("acc-progress-bar");
      if (progressBarEl) progressBarEl.style.width = `${data.accuracy}%`;
      
      // Update Card 2
      const finalScoreEl = document.getElementById("acc-final-score");
      if (finalScoreEl) finalScoreEl.textContent = Math.round(data.final_score);
      
      const finalScoreTextEl = document.getElementById("acc-final-score-text");
      if (finalScoreTextEl) finalScoreTextEl.textContent = data.final_score.toFixed(2);
      
      const coverageEl = document.getElementById("acc-coverage");
      // Tampilkan jumlah data ditemukan / acuan, bukan persentase score
      if (coverageEl) coverageEl.textContent = `${data.coverage}% (${data.total_verified.toLocaleString()} / ${(data.total_data_acuan).toLocaleString()})`;
      
      const accuracyEl = document.getElementById("acc-accuracy");
      if (accuracyEl) accuracyEl.textContent = `${data.accuracy}% (${(data.sample_correct ?? 0).toLocaleString()} / ${data.total_data_acuan.toLocaleString()} benar)`;
      
      const completenessEl = document.getElementById("acc-completeness");
      if (completenessEl) completenessEl.textContent = `${data.completeness}%`;
      
      // Update circular bar dasharray
      const circularBarEl = document.getElementById("acc-circular-bar");
      if (circularBarEl) {
        // Circumference is ~100 based on SVG path (r=15.9155) -> 2 * PI * r ~= 100
        // dasharray="progress, 100"
        circularBarEl.setAttribute("stroke-dasharray", `${data.final_score}, 100`);
      }
    }
  } catch (err) {
    console.error("Unexpected error fetching accuracy metrics:", err);
  }
}

// ===== EXPORT EVALUATION RESULTS (SAMPLING TRACER ALUMNI) =====
export async function downloadEvaluationResults() {
  const btn = document.getElementById("btn-download-eval");
  if (btn) {
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="animate-spin w-4 h-4 inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> MENGUNDUH...`;
    
    try {
      if (!window.XLSX) {
        throw new Error("Library XLSX tidak ditemukan");
      }

      let allData = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("alumni")
          .select("*")
          .range(offset, offset + limit - 1)
          .order("id", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          allData = allData.concat(data);
          offset += limit;
          if (data.length < limit) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      const headers = [
        "No", "Nama Lulusan", "NIM", "Tahun Masuk", "Tanggal Lulus", "Fakultas", 
        "Program Studi", "Email", "No Hp", "Kategori", "Posisi", "Tempat bekerja", 
        "Alamat bekerja", "Sosmed Kantor", "Linkedin", "IG", "Fb", "Tiktok", "Score (%)", "Status"
      ];

      const wsData = [headers];

      allData.forEach((item, index) => {
        // Fallback untuk atribut yang di dalam kolom jsonb "enrichment" 
        // Jika ada di table schema lama, kita gunakan yg lama, jika tidak ada, ambil dari enrichment
        const enr = item.enrichment || {};
        const email = item.email_alumni || enr.email || "";
        const noHp = item.no_hp || enr.noHp || "";
        const kategori = item.jenis_instansi || enr.statusKerja || "";
        const posisi = item.pekerjaan || enr.posisi || "";
        const tempatKerja = item.instansi || enr.tempatKerja || "";
        const alamatKerja = item.alamat || enr.alamatKerja || "";
        const sosmedKantor = item.instansi_sosmed || enr.linkedinPerusahaan || enr.instagramPerusahaan || "";
        const linkedin = item.linkedin_url || enr.linkedin || "";
        const ig = item.instagram_url || enr.instagram || "";
        const fb = item.facebook_url || enr.facebook || "";
        const tiktok = item.tiktok_url || enr.tiktok || "";

        wsData.push([
          index + 1,
          item.nama || item.name || "",
          item.nim || "",
          item.tahun_masuk || item.year || "",
          item.tanggal_lulus || "",
          item.fakultas || "",
          item.prodi || item.program || "",
          email,
          noHp,
          kategori,
          posisi,
          tempatKerja,
          alamatKerja,
          sosmedKantor,
          linkedin,
          ig,
          fb,
          tiktok,
          item.confidence_score || item.confidence || 0,
          item.tracking_status || item.status || ""
        ]);
      });

      const worksheet = window.XLSX.utils.aoa_to_sheet(wsData);
      
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sampling Alumni");

      const fileName = `Sampling_Tracer_Alumni_${new Date().toISOString().slice(0,10)}.xlsx`;
      window.XLSX.writeFile(workbook, fileName);
      
      if (window.showToast) window.showToast("Hasil evaluasi berhasil diunduh!", "success");
      
    } catch (err) {
      console.error("Gagal mengunduh hasil evaluasi:", err);
      if (window.showToast) window.showToast("Gagal mengunduh hasil evaluasi.", "error");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

// Attach event listener
document.getElementById("btn-download-eval")?.addEventListener("click", downloadEvaluationResults);