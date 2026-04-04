// Mengambil log lama dari localStorage (atau buat baru jika kosong)
let activities = JSON.parse(localStorage.getItem("alumniActivities")) || [
  {
    msg: "Sistem berhasil dimuat",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    icon: "check", color: "text-emerald-600", bg: "bg-emerald-50"
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
    <div class="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div class="flex-shrink-0 w-7 h-7 rounded-full ${a.bg} flex items-center justify-center mt-0.5">
        <i data-lucide="${a.icon}" class="w-3.5 h-3.5 ${a.color}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-700 leading-snug">${a.msg}</p>
        <p class="text-xs text-gray-400 mt-0.5">${a.time}</p>
      </div>
    </div>`).join("");
  if (window.lucide) lucide.createIcons();
}

export function updateDashboard(alumniData) {
  const total      = alumniData.length;
  const identified = alumniData.filter(a => a.status === "Identified").length;
  const pending    = alumniData.filter(a => a.status === "Pending").length;
  const notFound   = alumniData.filter(a => a.status === "Not Found").length;
  const enriched   = alumniData.filter(a => a.enrichment && Object.keys(a.enrichment).length > 0 && a.enrichment.tempatKerja).length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("stat-total",      total);
  set("stat-identified", identified);
  set("stat-pending",    pending);
  set("stat-not-found",  notFound);
  set("stat-enriched",   enriched);

  // Progress bars
  const setWidth = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = pct + "%"; };
  if (total > 0) {
    setWidth("bar-identified", Math.round((identified / total) * 100));
    setWidth("bar-pending",    Math.round((pending    / total) * 100));
    setWidth("bar-not-found",  Math.round((notFound   / total) * 100));
  }

  renderActivities();
}
