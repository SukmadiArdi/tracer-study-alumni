import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Referensi ke koleksi 'alumni' di Firestore
const ALUMNI_COLLECTION = "alumni";
const alumniRef = collection(db, ALUMNI_COLLECTION);

// ===== 1. MENGAMBIL SEMUA DATA ALUMNI (READ) =====
export async function getAlumni() {
  try {
    const snapshot = await getDocs(alumniRef);
    const alumniList = [];
    
    snapshot.forEach((docSnap) => {
      alumniList.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    
    return alumniList;
  } catch (error) {
    console.error("Error mengambil data alumni: ", error);
    return []; // Kembalikan array kosong jika gagal agar UI tidak error
  }
}

// ===== 2. MENAMBAH DATA ALUMNI BARU (CREATE) =====
export async function createAlumni(data) {
  try {
    const docRef = await addDoc(alumniRef, {
      name: data.name,
      nim: data.nim,
      program: data.program,
      year: parseInt(data.year), // Pastikan tahun disave sebagai angka
      status: "Pending", // Status awal saat pertama kali ditambahkan
      confidence: 0
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
    await updateDoc(alumniDocRef, {
      status: status,
      confidence: confidence
    });
  } catch (error) {
    console.error("Error mengupdate status alumni: ", error);
    throw error;
  }
}