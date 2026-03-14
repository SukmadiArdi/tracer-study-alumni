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
  
  // Mengupdate bar warna di dalam card dashboard
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
  
  // Update Legend text di bawah ring
  const lI = document.getElementById("leg-identified"); if(lI) lI.textContent = stats.identified;
  const lP = document.getElementById("leg-pending"); if(lP) lP.textContent = stats.pending;
  const lN = document.getElementById("leg-notfound"); if(lN) lN.textContent = stats.notFound;
}

export function updateDashboard(alumniData) {
  const stats = calculateStats(alumniData);
  updateDashboardCards(stats);
  updateProgressRing(stats);
}