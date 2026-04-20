// ===== KONFIGURASI GLOBAL =====
const DAFTAR_SUMBER = ["LinkedIn", "Google Scholar", "GitHub", "PDDikti", "SINTA"];
const BATAS_SKOR_TINGGI = 80;
const BATAS_SKOR_SEDANG = 50;

// ===== 1. GENERATE VARIASI NAMA =====
export function generateVariasi(namaLengkap) {
  const parts = namaLengkap.split(" ");
  const variations = [namaLengkap];
  if (parts.length > 1) {
    variations.push(parts[0] + " " + parts[1][0] + "."); // Contoh: "Achmad A."
  }
  return variations;
}

// ===== 2. BUAT PROFIL TARGET =====
export function buatProfilTarget(nama, prodi, tahun) {
  return {
    variasi_nama: generateVariasi(nama),
    kata_kunci_afiliasi: ["Universitas Muhammadiyah Malang", "UMM", "Universitas Nusantara"],
    kata_kunci_konteks: [prodi, "Informatika", "Malang", tahun.toString()]
  };
}

// ===== 3. SIMULASI TARIK DATA DARI SUMBER PUBLIK =====
export function lakukanPencarian(sumberAktif) {
  const kandidatDitemukan = [];
  
  DAFTAR_SUMBER.forEach(sumber => {
    // Simulasi: Secara acak menemukan data di sumber tertentu
    if (sumberAktif.includes(sumber) && Math.random() > 0.4) {
       kandidatDitemukan.push({
           sumber: sumber,
           nama_kandidat: "Kandidat Simulasi", // Dalam sistem asli, ini adalah hasil scraping
           ada_di_github: sumber === "GitHub",
           ada_di_linkedin: sumber === "LinkedIn",
           teks_profil: "Bekerja di bidang terkait di Malang.",
           riwayat_pendidikan: "Lulusan dari kampus di Malang."
       });
    }
  });
  
  return kandidatDitemukan;
}

// ===== 4. KELOMPOKKAN STATUS =====
export function kelompokkanStatus(kandidatTerbaik) {
  if (kandidatTerbaik.skor >= BATAS_SKOR_TINGGI) {
    return { status: "Identified", confidence: kandidatTerbaik.skor, butuh_review: false };
  } else if (kandidatTerbaik.skor >= BATAS_SKOR_SEDANG) {
    return { status: "Pending", confidence: kandidatTerbaik.skor, butuh_review: true };
  } else {
    return { status: "Not Found", confidence: kandidatTerbaik.skor, butuh_review: false };
  }
}

// ===== 5. HITUNG SKOR KANDIDAT (VALIDASI SILANG) =====
export function hitungSkorKandidat(target, daftarKandidat) {
  let kandidatTerbaik = { skor: 0, sumber: [] };
  
  // Jika tidak ada data ditemukan sama sekali dari scraping/API
  if (daftarKandidat.length === 0) return kelompokkanStatus(kandidatTerbaik);

  let skorSimulasi = 0;
  let sumberDitemukan = [];
  let adaDiLinkedIn = false;
  let adaDiGithub = false;

  daftarKandidat.forEach(kandidat => {
      sumberDitemukan.push(kandidat.sumber);
      if (kandidat.ada_di_linkedin) adaDiLinkedIn = true;
      if (kandidat.ada_di_github) adaDiGithub = true;
  });

  // Simulasi penambahan skor berdasarkan aturan bisnis
  if (daftarKandidat.length > 0) skorSimulasi += 40; // Bobot Nama
  if (daftarKandidat.length > 0) skorSimulasi += 30; // Bobot Afiliasi Kampus
  if (daftarKandidat.length > 0) skorSimulasi += 15; // Bobot Konteks Keahlian/Lokasi
  
  // Cek Cross-Validation (Ditemukan di >1 platform profesional)
  if (adaDiLinkedIn && adaDiGithub) {
      skorSimulasi += 15;
  }

  // --- LOGIKA KHUSUS SIMULASI UI ---
  // Kita kurangi skor secara acak agar hasil tracking bervariasi 
  // (ada yang jadi Identified, Pending, atau Not Found) untuk keperluan testing UI.
  // Hapus 3 baris di bawah ini jika algoritma sudah dihubungkan ke data real backend Python!
  skorSimulasi -= Math.floor(Math.random() * 60); 
  if (skorSimulasi < 0) skorSimulasi = Math.floor(Math.random() * 30);
  
  // Batasi skor maksimal 100
  if (skorSimulasi > 100) skorSimulasi = 100;

  kandidatTerbaik = {
      skor: skorSimulasi,
      sumber: sumberDitemukan
  };

  return kelompokkanStatus(kandidatTerbaik);
}

// ===== 6. FUNGSI UTAMA TRACKING =====
export function runTracking(alumni) {
  const profilTarget = buatProfilTarget(alumni.name, alumni.program, alumni.year);
  const kandidatMentah = lakukanPencarian(DAFTAR_SUMBER); 
  const hasilEvaluasi = hitungSkorKandidat(profilTarget, kandidatMentah);
  
  return hasilEvaluasi;
}

// ===== 7. [BARU] FUNGSI KHUSUS SINKRONISASI PDDIKTI =====

// Jeda aman berbasis Promise
const jedaAman = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Pengacak waktu agar seperti interaksi manusia (dalam milidetik)
const waktuAcak = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Fungsi hitung skor PDDikti (Disesuaikan dengan Format Asli PDDikti)
function hitungSkorPDDikti(internal, external) {
    let skor = 0;
    
    // 1. Cek Nama (40 Poin) - Harus sama persis (abaikan huruf besar/kecil)
    if (external.nama && internal.name.toLowerCase() === external.nama.toLowerCase()) {
        skor += 40;
    }
    
    // 2. Cek Prodi (20 Poin) - Pakai .includes() untuk mengatasi "Sarjana - Psikologi"
    if (external.programStudi && external.programStudi.toLowerCase().includes(internal.program.toLowerCase())) {
        skor += 20;
    }
    
    // 3. Cek Tahun Masuk (20 Poin) - Pakai .includes() pada tanggal masuk PDDikti
    if (external.tanggalMasuk && external.tanggalMasuk.includes(internal.year.toString())) {
        skor += 20;
    }
    
    // 4. Cek Status Kelulusan (20 Poin) - Pakai .includes() untuk mencari kata "Lulus"
    if (external.statusTerakhir && external.statusTerakhir.toLowerCase().includes("lulus")) {
        skor += 20;
    }
    
    return skor;
}

// Fungsi utama batch crawling PDDikti (SUPER AMAN)
export async function jalankanSinkronisasiPDDiktiMassal(daftarAlumni, callbackProgress, callbackUpdateDB) {
    const targetAlumni = daftarAlumni.filter(a => a.status !== "Identified");
    let terproses = 0;

    for (let i = 0; i < targetAlumni.length; i++) {
        let alumni = targetAlumni[i];
        
        callbackProgress(alumni.name, terproses, targetAlumni.length, "Mencari data ke server...");

        try {
            const response = await fetch(`/api/pddikti/${alumni.nim}`);
            const result = await response.json();

            if (result.status === "sukses" && result.data) {
                const skor = hitungSkorPDDikti(alumni, result.data);
                const statusBaru = skor >= 70 ? "Identified" : "Pending";

                await callbackUpdateDB(alumni.id, statusBaru, skor);
                
                terproses++;
                callbackProgress(alumni.name, terproses, targetAlumni.length, `Selesai. Skor: ${skor}`);
            }
        } catch (error) {
            console.error(`Gagal memproses NIM ${alumni.nim}:`, error);
            callbackProgress(alumni.name, terproses, targetAlumni.length, "Gagal/Timeout dari server.");
        }

        // --- LAPISAN KEAMANAN (SAFETY LAYERS) ---
        
        if (i < targetAlumni.length - 1) {
            // 1. SISTEM BATCH: Jika sudah memproses 10 data, istirahat panjang (1 Menit)
            if ((i + 1) % 10 === 0) {
                callbackProgress("Sistem", terproses, targetAlumni.length, "Istirahat 3 menit agar server aman...");
                await jedaAman(180000); // Istirahat 3 menit
            } 
            // 2. JEDA ACAK: Jeda antara 7 hingga 15 detik untuk setiap pencarian normal
            else {
                let delayAcak = waktuAcak(15000, 30000); // 15-30 detik
                callbackProgress("Sistem", terproses, targetAlumni.length, `Jeda aman ${delayAcak/1000} detik...`);
                await jedaAman(delayAcak); 
            }
        }
    }
    
    return terproses; 
}

// ===== 8. [BARU] SINKRONISASI PDDIKTI PERORANG =====
export async function verifikasiSatuPDDikti(alumni) {
    try {
        // Tembak API PDDikti lokal untuk 1 NIM
        const response = await fetch(`/api/pddikti/${alumni.nim}`);
        const result = await response.json();

        // Jika berhasil mendapat data dari server
        if (result.status === "sukses" && result.data) {
            // Gunakan fungsi hitungSkorPDDikti yang sudah ada di file ini
            const skor = hitungSkorPDDikti(alumni, result.data);
            const statusBaru = skor >= 70 ? "Identified" : "Pending";
            
            return { status: statusBaru, confidence: skor, data: result.data };
        } else {
            return { status: "Not Found", confidence: 0, data: null };
        }
    } catch (error) {
        console.error(`Gagal memproses NIM ${alumni.nim}:`, error);
        throw new Error("Server Backend Tidak Merespon");
    }
}