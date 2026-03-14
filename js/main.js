import { getAlumni, createAlumni, deleteAlumni, updateStatus } from "./alumni.js";
import { runTracking } from "./tracking.js";
import { updateDashboard } from "./dashboard.js";

let currentAlumniData = [];
let pendingTrackId = null; // Menyimpan ID alumni yang sedang mau di-track lewat modal

// ===== 1. INISIALISASI & LOAD DATA =====
async function loadData() {
    currentAlumniData = await getAlumni();
    renderAlumniTable();
    renderVerification();
    updateDashboard(currentAlumniData);
    if (window.lucide) lucide.createIcons();
}

// ===== 2. RENDER TABEL ALUMNI =====
function renderAlumniTable() {
    const tbody = document.getElementById("alumni-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    currentAlumniData.forEach((a) => {
        const statusColors = { 
            'Identified': 'bg-emerald-50 text-emerald-700', 
            'Pending': 'bg-amber-50 text-amber-700', 
            'Not Found': 'bg-red-50 text-red-600' 
        };
        const confColor = a.confidence >= 80 ? 'text-emerald-600' : a.confidence >= 50 ? 'text-amber-600' : 'text-red-500';
        const confBg = a.confidence >= 80 ? 'bg-emerald-500' : a.confidence >= 50 ? 'bg-amber-500' : 'bg-red-400';
        const initials = a.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

        const tr = document.createElement("tr");
        tr.className = "table-row-hover";
        tr.innerHTML = `
            <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 text-xs font-semibold shrink-0">${initials}</div>
                    <span class="font-medium text-navy-700">${a.name}</span>
                </div>
            </td>
            <td class="px-5 py-3.5 text-navy-500 font-mono text-xs">${a.nim}</td>
            <td class="px-5 py-3.5 text-navy-500">${a.program}</td>
            <td class="px-5 py-3.5 text-navy-500">${a.year}</td>
            <td class="px-5 py-3.5"><span class="text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[a.status] || 'bg-gray-50 text-gray-600'}">${a.status}</span></td>
            <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                    <div class="w-16 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                        <div class="h-full ${confBg} rounded-full" style="width:${a.confidence}%"></div>
                    </div>
                    <span class="text-xs font-semibold ${confColor}">${a.confidence}%</span>
                </div>
            </td>
            <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                    <button onclick="window.openTrackModal('${a.id}')" class="p-1.5 rounded-lg hover:bg-blue-50 text-navy-400 hover:text-blue-600 transition" title="Track"><i data-lucide="radar" style="width:15px;height:15px;"></i></button>
                    <button onclick="window.handleDelete('${a.id}')" class="p-1.5 rounded-lg hover:bg-red-50 text-navy-400 hover:text-red-500 transition" title="Delete"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ===== 3. RENDER DAFTAR VERIFIKASI MANUAL =====
function renderVerification() {
    const container = document.getElementById("verification-list");
    const verifPageBadge = document.getElementById("verif-page-badge");
    if (!container) return;
    container.innerHTML = "";

    const pendingAlumni = currentAlumniData.filter(a => a.status === "Pending");
    if(verifPageBadge) verifPageBadge.textContent = `${pendingAlumni.length} Pending Reviews`;

    if (pendingAlumni.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-navy-400 text-sm bg-white rounded-2xl border border-navy-100">Semua kandidat sudah terverifikasi. Tidak ada antrean.</div>`;
        return;
    }

    pendingAlumni.forEach((v, i) => {
        const confColor = v.confidence >= 50 ? 'text-amber-600' : 'text-red-500';
        const confBg = v.confidence >= 50 ? 'bg-amber-500' : 'bg-red-400';
        const initials = v.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

        const div = document.createElement("div");
        div.className = "bg-white rounded-2xl border border-navy-100 p-5 anim-fade-up";
        div.style.animationDelay = (i * 0.06) + "s";
        div.innerHTML = `
            <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                <div class="flex-1 flex items-start gap-4">
                    <div class="w-11 h-11 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600 text-sm font-bold shrink-0">${initials}</div>
                    <div>
                        <div class="font-semibold text-navy-700">${v.name}</div>
                        <div class="text-xs text-navy-400 mt-0.5">${v.nim} &middot; ${v.program} &middot; Class of ${v.year}</div>
                    </div>
                </div>
                <div class="hidden lg:flex items-center text-navy-300 px-2">
                    <i data-lucide="arrow-right" style="width:20px;height:20px;"></i>
                </div>
                <div class="flex-1 bg-navy-50/50 rounded-xl p-3 border border-dashed border-navy-200">
                    <div class="text-[10px] text-navy-400 uppercase tracking-wider font-semibold mb-1.5">Profile Match Candidate</div>
                    <div class="font-medium text-navy-700 text-sm">${v.name}</div>
                    <div class="text-xs text-navy-500 mt-0.5">Ditemukan via OSINT Data Mining</div>
                    <div class="flex items-center gap-2 mt-2">
                        <div class="w-20 h-1.5 bg-navy-200 rounded-full overflow-hidden"><div class="h-full ${confBg} rounded-full" style="width:${v.confidence}%"></div></div>
                        <span class="text-xs font-semibold ${confColor}">${v.confidence}% match</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button onclick="window.verifyAction('${v.id}', 'confirm')" class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl transition font-medium"><i data-lucide="check" style="width:14px;height:14px;"></i> Confirm</button>
                    <button onclick="window.verifyAction('${v.id}', 'reject')" class="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-xl transition font-medium"><i data-lucide="x" style="width:14px;height:14px;"></i> Reject</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// ===== 4. AKSI TOMBOL (TRACK, DELETE, VERIFY) =====
window.openTrackModal = function(id) {
    pendingTrackId = id;
    document.getElementById("modal-track").classList.remove("hidden");
    document.getElementById("modal-track").classList.add("flex");
}

document.getElementById("btn-start-track").addEventListener("click", async () => {
    document.getElementById("modal-track").classList.add("hidden");
    document.getElementById("modal-track").classList.remove("flex");

    if(!pendingTrackId) return;

    showToast("Memulai pelacakan OSINT...", "radar");
    const alumniTarget = currentAlumniData.find(a => a.id === pendingTrackId);
    
    const hasilPelacakan = runTracking(alumniTarget);
    await updateStatus(pendingTrackId, hasilPelacakan.status, hasilPelacakan.confidence);
    
    showToast(`Pelacakan selesai: ${hasilPelacakan.status}`, "check-circle");
    loadData();
    pendingTrackId = null;
});

// Tutup track modal
document.getElementById("btn-close-track").addEventListener("click", () => {
    document.getElementById("modal-track").classList.add("hidden");
    document.getElementById("modal-track").classList.remove("flex");
});
document.getElementById("btn-cancel-track").addEventListener("click", () => {
    document.getElementById("modal-track").classList.add("hidden");
    document.getElementById("modal-track").classList.remove("flex");
});

window.handleDelete = async function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data alumni ini?")) {
        await deleteAlumni(id);
        showToast("Alumni berhasil dihapus", "trash-2");
        loadData();
    }
}

window.verifyAction = async function(id, action) {
    const newStatus = action === 'confirm' ? 'Identified' : 'Not Found';
    const newConfidence = action === 'confirm' ? 100 : 0;
    await updateStatus(id, newStatus, newConfidence);
    showToast(`Verifikasi manual: ${newStatus}`, action === 'confirm' ? 'check-circle' : 'x-circle');
    loadData();
}

// ===== 5. UI NOTIFIKASI (TOAST) =====
function showToast(message, icon) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "flex items-center gap-2 bg-navy-800 text-white px-4 py-3 rounded-xl text-sm shadow-lg anim-slide-right";
    toast.innerHTML = `<i data-lucide="${icon || 'info'}" style="width:16px;height:16px;"></i> ${message}`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => {
        toast.style.transition = "all .3s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== 6. EVENT LISTENERS UI =====
document.addEventListener("DOMContentLoaded", () => {
    // Navigasi Sidebar
    const pages = ["dashboard", "alumni", "verification"];
    pages.forEach(page => {
        const btn = document.getElementById(`nav-${page}`);
        if (btn) {
            btn.addEventListener("click", () => {
                pages.forEach(p => document.getElementById(`page-${p}`).classList.add("hidden"));
                document.getElementById(`page-${page}`).classList.remove("hidden");
                
                document.querySelectorAll(".sidebar-link").forEach(el => el.classList.remove("active"));
                btn.classList.add("active");
                
                const titles = { dashboard: ['Dashboard','Overview of alumni tracking progress'], alumni: ['Alumni Management','Browse, search, and manage alumni records'], verification: ['Manual Verification','Review and confirm unverified alumni profiles'] };
                document.getElementById("page-title").textContent = titles[page][0];
                document.getElementById("page-subtitle").textContent = titles[page][1];
            });
        }
    });

    // Login & Logout
    const loginForm = document.getElementById("login-form");
    const loginHandler = () => {
        const user = document.getElementById("login-user").value;
        const pass = document.getElementById("login-pass").value;
        
        if (user === "admin@university.ac.id" && pass === "admin123") {
            document.getElementById("page-login").classList.add("hidden");
            document.getElementById("app-shell").classList.remove("hidden");
            loadData();
        } else {
            alert("Gunakan: admin@university.ac.id / admin123");
        }
    };
    loginForm.addEventListener("submit", (e) => { e.preventDefault(); loginHandler(); });
    document.getElementById("btn-login").addEventListener("click", loginHandler);

    document.getElementById("btn-logout").addEventListener("click", () => {
        document.getElementById("app-shell").classList.add("hidden");
        document.getElementById("page-login").classList.remove("hidden");
    });

    // Modal Tambah Alumni
    const modalAdd = document.getElementById("modal-add");
    document.getElementById("btn-open-add").addEventListener("click", () => { modalAdd.classList.remove("hidden"); modalAdd.classList.add("flex"); });
    document.getElementById("btn-close-add").addEventListener("click", () => { modalAdd.classList.add("hidden"); modalAdd.classList.remove("flex"); });
    document.getElementById("btn-cancel-add").addEventListener("click", () => { modalAdd.classList.add("hidden"); modalAdd.classList.remove("flex"); });

    document.getElementById("form-add-alumni").addEventListener("submit", async (e) => {
        e.preventDefault();
        const newData = {
            name: document.getElementById("add-name").value,
            nim: document.getElementById("add-nim").value,
            program: document.getElementById("add-program").value,
            year: document.getElementById("add-year").value
        };
        showToast("Menyimpan data alumni...", "loader");
        await createAlumni(newData);
        e.target.reset();
        modalAdd.classList.add("hidden"); modalAdd.classList.remove("flex");
        showToast("Alumni berhasil ditambahkan!", "check");
        loadData();
    });

    if (window.lucide) lucide.createIcons();
});