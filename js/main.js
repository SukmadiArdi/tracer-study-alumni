import { getAlumni, createAlumni, deleteAlumni, updateStatus } from "./alumni.js";
import { runTracking } from "./tracking.js";
import { updateDashboard } from "./dashboard.js";

let currentAlumniData = [];

// Data dummy untuk membuat halaman verifikasi terlihat persis seperti desain Canva
const mockJobs = [
    { title: "Software Developer at Gojek", loc: "Surabaya, Indonesia" },
    { title: "Marketing Analyst at Tokopedia", loc: "Jakarta, Indonesia" },
    { title: "Data Scientist at Bukalapak", loc: "Bandung, Indonesia" },
    { title: "Hardware Engineer at Samsung", loc: "Seoul, South Korea" },
    { title: "Consultant at Deloitte", loc: "Singapore" }
];

// ===== 1. INISIALISASI & LOAD DATA =====
async function loadData() {
    currentAlumniData = await getAlumni();
    renderAlumniTable();
    renderVerification();
    updateDashboard(currentAlumniData);
    if (window.lucide) lucide.createIcons();
}

// ===== 2. RENDER TABEL ALUMNI (DENGAN FITUR EDIT & INLINE DELETE) =====
window.renderAlumniTable = function() {
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
            <td class="px-5 py-3.5 text-right action-cell">
                <div class="flex items-center justify-end gap-1">
                    <button class="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400 hover:text-navy-600 transition" title="Edit"><i data-lucide="edit-2" style="width:15px;height:15px;"></i></button>
                    <button onclick="window.askDeleteUI('${a.id}', this)" class="p-1.5 rounded-lg hover:bg-red-50 text-navy-400 hover:text-red-500 transition" title="Delete"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (window.lucide) lucide.createIcons();
}

// Fitur Hapus Inline ala Canva
window.askDeleteUI = function(id, btnElement) {
    const actionCell = btnElement.closest('.action-cell');
    actionCell.innerHTML = `
        <div class="flex items-center justify-end gap-1">
            <span class="text-xs text-red-600 mr-1">Delete?</span>
            <button onclick="window.confirmDelete('${id}')" class="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-medium px-2">Yes</button>
            <button onclick="window.renderAlumniTable()" class="p-1.5 rounded-lg bg-navy-50 text-navy-600 hover:bg-navy-100 transition text-xs font-medium px-2">No</button>
        </div>
    `;
}

window.confirmDelete = async function(id) {
    await deleteAlumni(id);
    showToast('Alumni record deleted', 'trash-2');
    loadData();
}

// ===== 3. RENDER DAFTAR VERIFIKASI MANUAL (DENGAN DATA MATCHING UI) =====
function renderVerification() {
    const container = document.getElementById("verification-list");
    if (!container) return;
    container.innerHTML = "";

    const pendingAlumni = currentAlumniData.filter(a => a.status === "Pending");

    // Update badge di header halaman verifikasi
    const badgeElements = document.querySelectorAll(".bg-amber-100.text-amber-700");
    badgeElements.forEach(el => el.textContent = `${pendingAlumni.length} Pending Reviews`);

    pendingAlumni.forEach((v, i) => {
        const confColor = v.confidence >= 50 ? 'text-amber-600' : 'text-red-500';
        const confBg = v.confidence >= 50 ? 'bg-amber-500' : 'bg-red-400';
        const initials = v.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        
        // Ambil data pekerjaan acak agar UI terlihat seperti Canva
        const job = mockJobs[i % mockJobs.length];

        const div = document.createElement("div");
        div.className = "bg-white rounded-2xl border border-navy-100 p-5 anim-fade-up";
        div.style.animationDelay = (i * 0.06) + "s";
        div.id = `vcard-${v.id}`;
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
                    <div class="text-xs text-navy-500 mt-0.5">${job.title}</div>
                    <div class="text-xs text-navy-400 flex items-center gap-1 mt-0.5"><i data-lucide="map-pin" style="width:11px;height:11px;"></i>${job.loc}</div>
                    <div class="flex items-center gap-2 mt-2">
                        <div class="w-20 h-1.5 bg-navy-200 rounded-full overflow-hidden"><div class="h-full ${confBg} rounded-full" style="width:${v.confidence}%"></div></div>
                        <span class="text-xs font-semibold ${confColor}">${v.confidence}% match</span>
                    </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                    <button onclick="window.verifyAction('${v.id}','confirm')" class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl transition font-medium">
                        <i data-lucide="check" style="width:14px;height:14px;"></i> Confirm
                    </button>
                    <button onclick="window.verifyAction('${v.id}','reject')" class="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-xl transition font-medium">
                        <i data-lucide="x" style="width:14px;height:14px;"></i> Reject
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    if (window.lucide) lucide.createIcons();
}

window.verifyAction = async function(id, action) {
    const card = document.getElementById(`vcard-${id}`);
    if (card) {
        card.style.transition = 'all .3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
    }
    
    setTimeout(async () => {
        const newStatus = action === 'confirm' ? 'Identified' : 'Not Found';
        const newConfidence = action === 'confirm' ? 100 : 0;
        await updateStatus(id, newStatus, newConfidence);
        
        const msg = action === 'confirm' ? 'Alumni match confirmed' : 'Match rejected';
        const icon = action === 'confirm' ? 'check-circle' : 'x-circle';
        showToast(msg, icon);
        loadData();
    }, 300);
}

// ===== 4. MODAL TRACKING & ADD ALUMNI MENGGUNAKAN FUNGSI CANVA =====
window.openModal = function(id) {
    const m = document.getElementById('modal-' + id);
    if(m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
    }
}

window.closeModal = function(id) {
    const m = document.getElementById('modal-' + id);
    if(m) {
        m.classList.add('hidden');
        m.classList.remove('flex');
    }
}

// ===== 5. SISTEM NAVIGASI BAWAAN CANVA =====
window.showPage = function(page) {
    document.querySelectorAll('[id^="page-"]:not(#page-login)').forEach(el => el.classList.add('hidden'));
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.remove('hidden');

    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    const navBtn = document.querySelector(`[data-nav="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    const titles = { 
        dashboard: ['Dashboard','Overview of alumni tracking progress'], 
        alumni: ['Alumni Management','Browse, search, and manage alumni records'], 
        verification: ['Manual Verification','Review and confirm unverified alumni profiles'] 
    };
    const t = titles[page] || titles.dashboard;
    document.getElementById('page-title').textContent = t[0];
    document.getElementById('page-subtitle').textContent = t[1];
}

// ===== 6. LOGIN / LOGOUT =====
document.getElementById('btn-login').addEventListener('click', function() {
    const user = document.getElementById("login-user").value;
    const pass = document.getElementById("login-pass").value;
    
    // Ganti email sesuai HTML Anda
    if (user === "admin@university.ac.id" && pass === "admin123") {
        document.getElementById('page-login').classList.add('hidden');
        document.getElementById('app-shell').classList.remove('hidden');
        document.getElementById('app-shell').style.display = 'block';
        window.showPage('dashboard');
        loadData();
    } else {
        alert("Gunakan: admin@university.ac.id / admin123");
    }
});

window.logout = function() {
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('app-shell').style.display = '';
    document.getElementById('page-login').classList.remove('hidden');
    document.getElementById("login-user").value = "";
    document.getElementById("login-pass").value = "";
}

// ===== 7. TOAST NOTIFICATION ALA CANVA =====
function showToast(message, icon) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'flex items-center gap-2 bg-navy-800 text-white px-4 py-3 rounded-xl text-sm shadow-lg anim-slide-right';
    toast.innerHTML = `<i data-lucide="${icon || 'info'}" style="width:16px;height:16px;"></i> ${message}`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => { 
        toast.style.transition = 'all .3s ease'; 
        toast.style.opacity = '0'; 
        toast.style.transform = 'translateX(20px)'; 
        setTimeout(() => toast.remove(), 300); 
    }, 2500);
}

// ===== EVENT LISTENERS UNTUK FORM & MODAL KHUSUS =====
document.addEventListener("DOMContentLoaded", () => {
    // Tombol "Start Tracking" dari dalam Modal Track
    const btnStartTrack = document.querySelector('#modal-track button.bg-emerald-600');
    if (btnStartTrack) {
        btnStartTrack.addEventListener('click', async () => {
            window.closeModal('track');
            showToast("Memulai pelacakan OSINT ke semua Pending...", "radar");
            
            // Lacak semua yang masih Pending
            const pendingAlumni = currentAlumniData.filter(a => a.status === "Pending" || a.status === "Not Found");
            for (let alumni of pendingAlumni) {
                const hasil = runTracking(alumni);
                await updateStatus(alumni.id, hasil.status, hasil.confidence);
            }
            
            showToast("Pelacakan selesai dikerjakan", "check-circle");
            loadData();
        });
    }

    // Submit form tambah alumni
    const formAdd = document.getElementById("form-add-alumni");
    if(formAdd) {
        formAdd.addEventListener("submit", async (e) => {
            e.preventDefault();
            const newData = {
                name: document.getElementById("add-name").value,
                nim: document.getElementById("add-nim").value,
                program: document.getElementById("add-program").value,
                year: document.getElementById("add-year").value
            };
            showToast("Menyimpan ke database...", "loader");
            await createAlumni(newData);
            e.target.reset();
            window.closeModal('add');
            showToast("Alumni berhasil ditambahkan!", "check");
            loadData();
        });
    }

    // Menutup modal bila mengklik area gelap (overlay)
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', (e) => { 
            if(e.target === m) { 
                m.classList.add('hidden'); 
                m.classList.remove('flex'); 
            } 
        });
    });
});