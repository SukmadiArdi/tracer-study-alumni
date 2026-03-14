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