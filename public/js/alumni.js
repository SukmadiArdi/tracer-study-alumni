import { supabase } from "./supabase.js";

const ALUMNI_TABLE = "alumni";

// ===== 1. AMBIL DATA ALUMNI (SERVER-SIDE PAGINATION + FILTER) =====
// Mengembalikan { data, totalCount }
export async function getAlumni({ page = 1, pageSize = 50, search = "", program = "All", year = "All", status = "All" } = {}) {
  try {
    let query = supabase.from(ALUMNI_TABLE).select('*', { count: 'exact' });

    // Terapkan filter
    if (program !== "All") query = query.eq('program', program);
    if (year !== "All") query = query.eq('year', parseInt(year));
    
    if (status === "Identified") {
      // Teridentifikasi khusus mengukur kesuksesan PDDikti (confidence >= 70)
      query = query.gte('confidence', 70);
    } else if (status !== "All") {
      query = query.eq('status', status);
    }

    // Filter pencarian nama atau NIM
    if (search.trim() !== "") {
      query = query.or(`name.ilike.%${search.trim()}%,nim.ilike.%${search.trim()}%`);
    }

    // Sorting dan range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('name', { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], totalCount: count || 0 };
  } catch (error) {
    console.error("Error mengambil data alumni: ", error);
    return { data: [], totalCount: 0 };
  }
}

// ===== 2. AMBIL STATS DASHBOARD (via COUNT query terpisah — instan) =====
export async function getAlumniStats() {
  try {
    // Jalankan semua query count secara paralel
    const [
      { count: total },
      { count: identified }, // Menghitung dari PDDikti confidence (tidak peduli sudah di-enrich atau belum)
      { count: pending },
      { count: notFound },
      { count: enriched },
    ] = await Promise.all([
      supabase.from(ALUMNI_TABLE).select('*', { count: 'exact', head: true }),
      supabase.from(ALUMNI_TABLE).select('*', { count: 'exact', head: true }).gte('confidence', 70),
      supabase.from(ALUMNI_TABLE).select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from(ALUMNI_TABLE).select('*', { count: 'exact', head: true }).eq('status', 'Not Found'),
      supabase.from(ALUMNI_TABLE).select('*', { count: 'exact', head: true }).eq('status', 'Enriched'),
    ]);

    return {
      total: total || 0,
      identified: identified || 0,
      pending: pending || 0,
      notFound: notFound || 0,
      enriched: enriched || 0,
    };
  } catch (error) {
    console.error("Error mengambil stats alumni: ", error);
    return { total: 0, identified: 0, pending: 0, notFound: 0, enriched: 0 };
  }
}

// ===== 3. AMBIL DAFTAR TAHUN UNIK via PostgreSQL RPC (DISTINCT — akurat) =====
export async function getUniqueYears() {
  try {
    const { data, error } = await supabase.rpc('get_unique_years');
    if (error) throw error;
    return (data || []).map(d => d.year).filter(Boolean);
  } catch (error) {
    console.error("Error mengambil tahun unik:", error);
    return [];
  }
}

// ===== 4. AMBIL DAFTAR PROGRAM UNIK via PostgreSQL RPC (DISTINCT — akurat) =====
export async function getUniquePrograms() {
  try {
    const { data, error } = await supabase.rpc('get_unique_programs');
    if (error) throw error;
    return (data || []).map(d => d.program).filter(Boolean);
  } catch (error) {
    console.error("Error mengambil program unik:", error);
    return [];
  }
}

// ===== 5. MENAMBAH DATA ALUMNI BARU (CREATE) =====
export async function createAlumni(alumniData) {
  try {
    const { data: newRow, error } = await supabase.from(ALUMNI_TABLE).insert([{
      name: alumniData.name,
      nim: alumniData.nim,
      program: alumniData.program,
      year: parseInt(alumniData.year),
      fakultas: alumniData.fakultas || null,
      tanggalLulus: alumniData.tanggalLulus || null,
      status: "Pending",
      confidence: 0,
      enrichment: {}
    }]).select('id').single();

    if (error) throw error;
    return newRow.id;
  } catch (error) {
    console.error("Error menambah alumni: ", error);
    throw error;
  }
}

// ===== 6. MENGHAPUS DATA ALUMNI (DELETE) =====
export async function deleteAlumni(id) {
  try {
    const { error } = await supabase.from(ALUMNI_TABLE).delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error("Error menghapus alumni: ", error);
    throw error;
  }
}

// ===== 7. MENGUPDATE STATUS HASIL PELACAKAN =====
export async function updateStatus(id, statusDariTracking, confidence) {
  try {
    const { data: currentData, error: fetchError } = await supabase.from(ALUMNI_TABLE).select('enrichmentScore').eq('id', id).single();
    if (fetchError) throw fetchError;

    const enrichmentScore = currentData.enrichmentScore || 0;
    let finalStatus = statusDariTracking;
    if (confidence < 70 && enrichmentScore >= 50) {
      finalStatus = "Identified";
    }

    const { error: updateError } = await supabase.from(ALUMNI_TABLE).update({
      status: finalStatus,
      confidence: confidence
    }).eq('id', id);

    if (updateError) throw updateError;
    return finalStatus;
  } catch (error) {
    console.error("Error mengupdate status alumni: ", error);
    throw error;
  }
}

// ===== 8. SIMPAN DATA ENRICHMENT =====
export async function saveEnrichmentToDatabase(alumniId, enrichmentData) {
  try {
    const { data: currentData, error: fetchError } = await supabase.from(ALUMNI_TABLE).select('*').eq('id', alumniId).single();
    if (fetchError) throw fetchError;

    let enrichmentScore = 0;
    if (enrichmentData.linkedin) enrichmentScore += 30;
    if (enrichmentData.tempatKerja && enrichmentData.posisi) enrichmentScore += 30;
    else if (enrichmentData.tempatKerja || enrichmentData.posisi) enrichmentScore += 15;
    if (enrichmentData.email || enrichmentData.noHp) enrichmentScore += 20;
    if (enrichmentData.instagram || enrichmentData.facebook || enrichmentData.tiktok) enrichmentScore += 20;
    if (enrichmentScore > 100) enrichmentScore = 100;

    // --- Logika Status ---
    // Jika data profil sudah cukup terisi (score >= 30), langsung Enriched (Terlacak Valid)
    // Jika PDDikti sudah verify (confidence >= 70), Identified
    // Sisanya Pending (kecuali sudah Not Found — tidak diubah)
    const pddiktiScore = currentData.confidence || 0;
    let statusBaru = currentData.status || "Pending";

    if (enrichmentScore >= 30) {
      // Data sudah terisi cukup → Terlacak (Valid)
      statusBaru = "Enriched";
    } else if (pddiktiScore >= 70) {
      statusBaru = "Identified";
    } else if (statusBaru !== "Not Found" && statusBaru !== "Enriched") {
      statusBaru = "Pending";
    }

    const { error: updateError } = await supabase.from(ALUMNI_TABLE).update({
      enrichment: enrichmentData,
      enrichmentUpdatedAt: new Date().toISOString(),
      enrichmentScore: enrichmentScore,
      status: statusBaru
    }).eq('id', alumniId);

    if (updateError) throw updateError;
    return { enrichmentScore, status: statusBaru };
  } catch (error) {
    console.error("Error menyimpan enrichment: ", error);
    throw error;
  }
}

// ===== 9. AMBIL DATA SATU ALUMNI BY ID =====
export async function getAlumniById(alumniId) {
  try {
    const { data, error } = await supabase.from(ALUMNI_TABLE).select('*').eq('id', alumniId).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error mengambil alumni by id: ", error);
    return null;
  }
}
