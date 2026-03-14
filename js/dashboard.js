// Variable lokal untuk menyimpan log histori aksi
let activities = [
    { msg: "Sistem berhasil dimuat", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: "check", color: "text-emerald-600", bg: "bg-emerald-50" }
];

export function addActivity(msg, icon="info", color="text-blue-600", bg="bg-blue-50") {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    // Masukkan log ke paling atas array
    activities.unshift({ msg, time, icon, color, bg });
    // Batasi log maksimal 5 item agar UI rapi
    if(activities.length > 5) activities.pop();
    renderActivities();
}

export function renderActivities() {
    const container = document.getElementById("recent-activity-list");
    if(!container) return;
    container.innerHTML = activities.map(a => `
        <div class="flex items-center gap-3 text-sm anim-slide-right">
            <div class="w-8 h-8 rounded-full ${a.bg} flex items-center justify-center ${a.color}">
                <i data-lucide="${a.icon}" style="width:14px;height:14px;"></i>
            </div>
            <div class="flex-1">
                <span class="text-navy-700 font-medium">${a.msg}</span>
            </div>
            <span class="text-navy-300 text-xs">${a.time}</span>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

export function calculateStats(alumniData) {
  let total = 0; let identified = 0; let pending = 0; let notFound = 0;
  alumniData.forEach(alumni => {
    total++;
    if (alumni.status === "Identified") identified++;
    else if (alumni.status === "Pending") pending++;
    else if (alumni.status === "Not Found") notFound++;
  });
  return { total, identified, pending, notFound };
}

export function updateDashboardCards(stats) {
  const tEl = document.getElementById("stat-total");
  const iEl = document.getElementById("stat-identified");
  const pEl = document.getElementById("stat-pending");
  const nEl = document.getElementById("stat-notfound");
  const verifBadge = document.getElementById("verif-badge");

  if (tEl) tEl.textContent = stats.total;
  if (iEl) iEl.textContent = stats.identified;
  if (pEl) pEl.textContent = stats.pending;
  if (nEl) nEl.textContent = stats.notFound;
  
  const t = stats.total || 1; 
  const bI = document.getElementById("bar-identified"); if(bI) bI.style.width = `${(stats.identified/t)*100}%`;
  const bP = document.getElementById("bar-pending"); if(bP) bP.style.width = `${(stats.pending/t)*100}%`;
  const bN = document.getElementById("bar-notfound"); if(bN) bN.style.width = `${(stats.notFound/t)*100}%`;

  if (verifBadge) {
      verifBadge.textContent = stats.pending;
      stats.pending === 0 ? verifBadge.classList.add("hidden") : verifBadge.classList.remove("hidden");
  }
}

export function updateProgressRing(stats) {
  const percent = stats.total === 0 ? 0 : Math.round((stats.identified / stats.total) * 100);
  const circle = document.getElementById("progress-circle");
  const label = document.getElementById("progress-percent");

  if (!circle || !label) return;
  const circumference = 2 * Math.PI * 64;
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
  label.textContent = percent + "%";
  
  const lI = document.getElementById("leg-identified"); if(lI) lI.textContent = stats.identified;
  const lP = document.getElementById("leg-pending"); if(lP) lP.textContent = stats.pending;
  const lN = document.getElementById("leg-notfound"); if(lN) lN.textContent = stats.notFound;
}

export function updateChart(alumniData) {
    const container = document.getElementById("chart-container");
    if(!container) return;

    // Kelompokkan data jumlah alumni berdasarkan tahun
    const yearCounts = {};
    alumniData.forEach(a => {
        const y = a.year || "N/A";
        yearCounts[y] = (yearCounts[y] || 0) + 1;
    });

    const years = Object.keys(yearCounts).sort();
    if(years.length === 0) {
        container.innerHTML = '<div class="text-xs text-navy-400 w-full text-center pb-10">Data kosong</div>';
        return;
    }

    // Cari nilai terbanyak untuk men-skalakan tinggi batang grafik (Max 100%)
    const max = Math.max(...Object.values(yearCounts));
    const colors = ['bg-navy-200', 'bg-navy-300', 'bg-navy-400', 'bg-navy-500', 'bg-navy-600', 'bg-navy-700'];
    let html = '';

    years.forEach((y, idx) => {
        const count = yearCounts[y];
        // Minimal height batang adalah 10% agar tetap terlihat
        const heightPct = Math.max((count / max) * 100, 10); 
        const color = colors[Math.min(idx, colors.length - 1)];

        html += `
        <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full ${color} rounded-t-lg relative group transition-all duration-500" style="height:${heightPct}%">
                <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-navy-700 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                    ${count} Alumni
                </div>
            </div>
            <span class="text-[10px] text-navy-400">${y}</span>
        </div>`;
    });

    container.innerHTML = html;
}

export function updateDashboard(alumniData) {
  const stats = calculateStats(alumniData);
  updateDashboardCards(stats);
  updateProgressRing(stats);
  updateChart(alumniData);
  renderActivities();
}