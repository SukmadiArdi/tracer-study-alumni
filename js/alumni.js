import { db } from "../firebase.js";
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

// ===== 4. MENGUPDATE STATUS HASIL PELACAKAN (UPDATE) =====
export async function updateStatus(id, status, confidence) {
  try {
    const alumniDocRef = doc(db, ALUMNI_COLLECTION, id);
    await updateDoc(alumniDocRef, { status, confidence });
  } catch (error) {
    console.error("Error mengupdate status alumni: ", error);
    throw error;
  }
}

// ===== 5. [BARU] SIMPAN DATA ENRICHMENT =====
export async function saveEnrichmentToFirestore(alumniId, enrichmentData) {
  try {
    const alumniDocRef = doc(db, ALUMNI_COLLECTION, alumniId);

    // Hitung confidence score berdasarkan kelengkapan field
    const fields = [
      enrichmentData.linkedin, enrichmentData.instagram,
      enrichmentData.facebook, enrichmentData.tiktok,
      enrichmentData.email, enrichmentData.noHp,
      enrichmentData.tempatKerja, enrichmentData.posisi,
      enrichmentData.alamatKerja, enrichmentData.statusKerja
    ];
    const filledCount = fields.filter(f => f && f.trim() !== "").length;
    const confidence  = Math.round((filledCount / fields.length) * 100);
    const status      = confidence >= 50 ? "Identified" : confidence > 0 ? "Pending" : "Not Found";

    await updateDoc(alumniDocRef, {
      enrichment: enrichmentData,
      enrichmentUpdatedAt: new Date().toISOString(),
      status,
      confidence
    });
    return { status, confidence };
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
