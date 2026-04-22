// dashboard.js

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
  set("stat-enriched",   enriched);

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
  set("stat-enriched-2",   enriched);

  const barEnriched   = document.getElementById("bar-enriched");
  if (barEnriched)   barEnriched.style.width   = `${pct(enriched)}%`;

  // Render activity juga supaya tetap tampil
  renderActivities();
}