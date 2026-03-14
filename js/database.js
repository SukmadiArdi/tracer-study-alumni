// ===== IMPORT DATABASE CONNECTION =====

import { db } from "./firebase.js";


// ===== COLLECTION NAME =====

const alumniCollection = db.collection("alumni");


// ===== GET ALL ALUMNI =====

export async function getAlumni() {

  const snapshot = await alumniCollection.get();

  const alumniList = [];

  snapshot.forEach((doc) => {

    alumniList.push({
      id: doc.id,
      ...doc.data()
    });

  });

  return alumniList;

}



// ===== ADD NEW ALUMNI =====

export async function addAlumni(data) {

  await alumniCollection.add({
    name: data.name,
    nim: data.nim,
    program: data.program,
    year: data.year,
    status: data.status || "Pending",
    confidence: data.confidence || 0
  });

}



// ===== DELETE ALUMNI =====

export async function deleteAlumni(id) {

  await alumniCollection.doc(id).delete();

}



// ===== UPDATE ALUMNI =====

export async function updateAlumni(id, data) {

  await alumniCollection.doc(id).update(data);

}



// ===== UPDATE STATUS =====

export async function updateStatus(id, status, confidence) {

  await alumniCollection.doc(id).update({
    status: status,
    confidence: confidence
  });

}