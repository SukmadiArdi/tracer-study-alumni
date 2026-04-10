import { db } from "./firebase.js";
import {
  collection, addDoc, getDocs,
  deleteDoc, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ALUMNI_COLLECTION = "alumni";
const alumniRef = collection(db, ALUMNI_COLLECTION);

// ===== 1. MENGAMBIL SEMUA DATA ALUMNI (READ) =====
export async function getAlumni() {
  try {
    const snapshot = await getDocs(alumniRef);
    const alumniList = [];
    snapshot.forEach((docSnap) => {
      alumniList.push({ id: docSnap.id, ...docSnap.data() });
    });
    return alumniList;
  } catch (error) {
    console.error("Error mengambil data alumni: ", error);
    return [];
  }
}

// ===== 2. MENAMBAH DATA ALUMNI BARU (CREATE) =====
export async function createAlumni(data) {
  try {
    const docRef = await addDoc(alumniRef, {
      name: data.name,
      nim: data.nim,
      program: data.program,
      year: parseInt(data.year),
      status: "Pending",
      confidence: 0,
      enrichment: {}
    });
    return docRef.id;
  } catch (error) {
    console.error("Error menambah alumni: ", error);
    throw error;
  }
}

// ===== 3. MENGHAPUS DATA ALUMNI (DELETE) =====
export async function deleteAlumni(id) {
  try {
    const alumniDocRef = doc(db, ALUMNI_COLLECTION, id);
    await deleteDoc(alumniDocRef);
  } catch (error) {
    console.error("Error menghapus alumni: ", error);
    throw error;
  }
}

// ===== 4. MENGUPDATE STATUS HASIL PELACAKAN (DIPERBARUI) =====
export async function updateStatus(id, statusDariTracking, confidence) {
  try {
    const alumniDocRef = doc(db, ALUMNI_COLLECTION, id);
    
    // Ambil data lama untuk mengecek skor Enrichment
    const snap = await getDoc(alumniDocRef);
    const currentData = snap.exists() ? snap.data() : {};
    const enrichmentScore = currentData.enrichmentScore || 0;

    // LOGIKA STATUS GABUNGAN (Saling Menghargai)
    let finalStatus = statusDariTracking; 
    
    // Jika PDDikti bilang "Pending" (karena skor < 70), 
    // TAPI Profil sudah lengkap (>= 50), pertahankan statusnya "Identified"
    if (confidence < 70 && enrichmentScore >= 50) {
      finalStatus = "Identified";
    }

    await updateDoc(alumniDocRef, { 
      status: finalStatus, 
      confidence: confidence 
    });

    return finalStatus; // Kembalikan status final ke main.js
  } catch (error) {
    console.error("Error mengupdate status alumni: ", error);
    throw error;
  }
}

// ===== 5. [DIUPDATE] SIMPAN DATA ENRICHMENT =====
export async function saveEnrichmentToFirestore(alumniId, enrichmentData) {
  try {
    const alumniDocRef = doc(db, ALUMNI_COLLECTION, alumniId);
    const snap = await getDoc(alumniDocRef);
    const currentData = snap.data();

    // 1. Hitung skor dengan pembobotan (Total 100)
    let enrichmentScore = 0;
    if (enrichmentData.linkedin) enrichmentScore += 30;
    if (enrichmentData.tempatKerja && enrichmentData.posisi) enrichmentScore += 30;
    if (enrichmentData.email || enrichmentData.noHp) enrichmentScore += 20;
    if (enrichmentData.instagram || enrichmentData.facebook || enrichmentData.tiktok) enrichmentScore += 20;

    // 2. LOGIKA STATUS GABUNGAN
    // Tetap gunakan skor PDDikti (confidence) yang sudah ada
    const pddiktiScore = currentData.confidence || 0;
    
    // Status jadi 'Identified' jika PDDikti OK ATAU Profil OK
    let statusBaru = currentData.status; 
    if (pddiktiScore >= 70 || enrichmentScore >= 50) {
      statusBaru = "Identified";
    } else {
      statusBaru = "Pending";
    }

    await updateDoc(alumniDocRef, {
      enrichment: enrichmentData,
      enrichmentUpdatedAt: new Date().toISOString(),
      enrichmentScore: enrichmentScore,
      status: statusBaru 
    });
    
    return { enrichmentScore, status: statusBaru }; 
  } catch (error) {
    console.error("Error menyimpan enrichment: ", error);
    throw error;
  }
}

// ===== 6. [BARU] AMBIL DATA SATU ALUMNI BY ID =====
export async function getAlumniById(alumniId) {
  try {
    const alumniDocRef = doc(db, ALUMNI_COLLECTION, alumniId);
    const snap = await getDoc(alumniDocRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  } catch (error) {
    console.error("Error mengambil alumni by id: ", error);
    return null;
  }
}
