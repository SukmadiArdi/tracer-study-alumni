// ===== 1. MENGHITUNG STATISTIK DASHBOARD =====
export function calculateStats(alumniData) {
  let total = 0;
  let identified = 0;
  let pending = 0;
  let notFound = 0;

  alumniData.forEach(alumni => {
    total++;
    if (alumni.status === "Identified") {
      identified++;
    } else if (alumni.status === "Pending") {
      pending++;
    } else if (alumni.status === "Not Found") {
      notFound++;
    }
  });

  return {
    total,
    identified,
    pending,
    notFound
  };
}

// ===== 2. UPDATE KARTU STATISTIK DI UI =====
export function updateDashboardCards(stats) {
  const totalEl = document.getElementById("stat-total");
  const identifiedEl = document.getElementById("stat-identified");
  const pendingEl = document.getElementById("stat-pending");
  const notFoundEl = document.getElementById("stat-notfound");
  const verifBadge = document.getElementById("verif-badge"); // Badge di sidebar

  if (totalEl) totalEl.textContent = stats.total;
  if (identifiedEl) identifiedEl.textContent = stats.identified;
  if (pendingEl) pendingEl.textContent = stats.pending;
  if (notFoundEl) notFoundEl.textContent = stats.notFound;
  
  // Update jumlah notifikasi untuk Manual Verification di Sidebar
  if (verifBadge) {
      verifBadge.textContent = stats.pending;
      if(stats.pending === 0) {
          verifBadge.classList.add("hidden");
      } else {
          verifBadge.classList.remove("hidden");
      }
  }
}

// ===== 3. UPDATE PROGRESS RING (SVG ANIMATION) =====
export function updateProgressRing(stats) {
  const percent = stats.total === 0
    ? 0
    : Math.round((stats.identified / stats.total) * 100);

  const circle = document.getElementById("progress-circle");
  const label = document.getElementById("progress-percent");

  if (!circle || !label) return;

  // Rumus keliling lingkaran SVG (r=64) adalah 2 * PI * r ≈ 402
  const circumference = 2 * Math.PI * 64;
  
  // Hitung seberapa banyak garis yang harus dipotong (offset)
  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
  
  label.textContent = percent + "%";
}

// ===== 4. FUNGSI UTAMA UPDATE DASHBOARD =====
export function updateDashboard(alumniData) {
  const stats = calculateStats(alumniData);
  updateDashboardCards(stats);
  updateProgressRing(stats);
}