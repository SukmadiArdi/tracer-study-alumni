// ===== CALCULATE DASHBOARD STATISTICS =====

export function calculateStats(alumniData) {

  let total = 0;
  let identified = 0;
  let pending = 0;
  let notFound = 0;

  alumniData.forEach(alumni => {

    total++;

    if (alumni.status === "Identified") {
      identified++;
    }

    else if (alumni.status === "Pending") {
      pending++;
    }

    else if (alumni.status === "Not Found") {
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



// ===== UPDATE DASHBOARD CARDS =====

export function updateDashboardCards(stats) {

  const totalEl = document.getElementById("stat-total");
  const identifiedEl = document.getElementById("stat-identified");
  const pendingEl = document.getElementById("stat-pending");
  const notFoundEl = document.getElementById("stat-notfound");

  if (totalEl) totalEl.textContent = stats.total;
  if (identifiedEl) identifiedEl.textContent = stats.identified;
  if (pendingEl) pendingEl.textContent = stats.pending;
  if (notFoundEl) notFoundEl.textContent = stats.notFound;

}



// ===== UPDATE PROGRESS RING =====

export function updateProgressRing(stats) {

  const percent = stats.total === 0
    ? 0
    : Math.round((stats.identified / stats.total) * 100);

  const circle = document.querySelector(".progress-ring-circle");

  if (!circle) return;

  const circumference = 2 * Math.PI * 64;

  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;

  const label = document.querySelector("#progress-percent");

  if (label) label.textContent = percent + "%";

}



// ===== UPDATE DASHBOARD =====

export function updateDashboard(alumniData) {

  const stats = calculateStats(alumniData);

  updateDashboardCards(stats);

  updateProgressRing(stats);

}