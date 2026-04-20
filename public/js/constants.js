// File: constants.js

// DAFTAR PROGRAM STUDI
const PROGRAM_LIST = [
    "Akuntansi", "Magister - Sosiologi Pedesaan", "Magister - Manajemen",
    "Pendidikan Agama Islam (Tarbiyah)", "Ahwal Al-Syakhsyiyyah (Syari'ah)",
    "Ilmu Ekonomi dan Studi Pembangunan", "Manajemen", "Ilmu Hukum",
    "Ilmu Kesejahteraan Sosial", "Ilmu Komunikasi", "Ilmu Pemerintahan",
    "Pendidikan Matematika", "Pendidikan Bahasa dan Sastra Indonesia",
    "Pendidikan Bahasa Inggris", "Pendidikan Biologi",
    "Sosial Ekonomi Pertanian", "Budidaya Pertanian", "Produksi Ternak",
    "Teknologi Industri Peternakan", "Psikologi", "Teknik Mesin", "Teknik Sipil",
    "Teknologi Pengolahan Hasil Pertanian", "Perikanan", "Teknik Elektro",
    "Teknik Industri", "D-3 Teknik Elektro", "Budidaya Perairan",
    "D-3 Keuangan dan Perbankan", "Magister - Ilmu Agama Islam",
    "Teknologi Hasil Pertanian", "Sosiologi", "Budidaya Hutan",
    "Pendidikan Pancasila dan Kewarganegaraan (PPKn)", "Magister - Agribisnis",
    "Pendidikan Dokter", "Magister - Ilmu Hukum",
    "Magister - Kebijakan dan Pengembangan Pendidikan", "Agronomi",
    "Sosial Ekonomi Pertanian (Agribisnis)", "Magister - Sosiologi",
    "Pendidikan Bahasa, Sastra Indonesia dan Bahasa Daerah", "Profesi Dokter",
    "Pendidikan Bahasa, Sastra Indonesia dan Daerah", "Ekonomi Pembangunan",
    "Magister - Psikologi", "Ilmu Hubungan Internasional", "Teknik Informatika",
    "Magister - Pendidikan Profesi Psikologi",
    "PJJ Pendidikan Guru Sekolah Dasar", "Farmasi", "Ilmu Keperawatan",
    "D-3 Keperawatan", "Agroteknologi", "Agroteknologi / Agronomi",
    "Ilmu dan Teknologi Pangan", "Pendidikan Guru Sekolah Dasar",
    "Doktor - Ilmu Sosial dan Ilmu Politik", "Magister - Psikologi Profesi",
    "Pendidikan Profesi Ners", "Kehutanan", "Peternakan",
    "D-3 Teknik Elektronika", "Agribisnis",
    "Magister - Pendidikan Matematika",
    "Magister - Pendidikan Bahasa dan Sastra Indonesia",
    "Doktor - Pendidikan Agama Islam",
    "Magister - Pendidikan Bahasa Inggris", "Ekonomi Syari'ah", "Fisioterapi",
    "Kedokteran", "Keperawatan", "Profesi Ners", "Profesi Apoteker",
    "Profesi Insinyur", "Pendidikan Bahasa Arab",
    "Magister - Pendidikan Bahasa Indonesia", "Pendidikan Agama Islam",
    "Ahwal Al-Syakhshiyah", "Ekonomi Syariah", "Hubungan Internasional",
    "Kesejahteraan Sosial", "Informatika", "Pendidikan Bahasa Indonesia",
    "Pendidikan Pancasila dan Kewarganegaraan", "D-3 Teknologi Elektronika",
    "D-3 Perbankan dan Keuangan", "Doktor - Sosiologi", "Doktor - Ilmu Pertanian",
    "Magister - Hukum", "Hukum Keluarga Islam (Ahwal Syakhshiyyah)", "Hukum",
    "Teknologi Pangan", "Akuakultur", "Magister - Pendidikan Agama Islam",
    "Pendidikan Profesi Apoteker", "Magister - Pendidikan Biologi",
    "Magister - Pedagogi", "Pendidikan Profesi Dokter",
    "Pendidikan Profesi Guru", "Pendidikan Profesi Fisioterapis",
    "Magister - Akuntansi", "D-4 Agribisnis Unggas", "D-4 Bisnis Properti",
    "Ilmu Pertanian", "Pendidikan"
];

// Isi otomatis semua dropdown saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
    const filterProgram = document.getElementById("filter-program");
    const inputProgram = document.getElementById("input-program");
    const inputYear = document.getElementById("input-year");

    if (filterProgram) {
        filterProgram.innerHTML = '<option value="All">Semua Prodi</option>' + 
            PROGRAM_LIST.map(p => `<option value="${p}">${p}</option>`).join("");
    }

    if (inputProgram) {
        inputProgram.innerHTML = '<option value="">-- Pilih Prodi --</option>' + 
            PROGRAM_LIST.map(p => `<option value="${p}">${p}</option>`).join("");
    }

    if (inputYear) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear; y >= 1986; y--) {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            inputYear.appendChild(opt);
        }
    }
});