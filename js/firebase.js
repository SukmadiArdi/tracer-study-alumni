// Import fungsi-fungsi inti dari Firebase SDK versi 10
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Konfigurasi Firebase Anda (Sesuai dengan project tracer-study-alumni-3c24a)
const firebaseConfig = {
  apiKey: "AIzaSyDbObyn9f58StGXlo11l3WvjbZA5MaW61U",
  authDomain: "tracer-study-alumni-3c24a.firebaseapp.com",
  projectId: "tracer-study-alumni-3c24a",
  storageBucket: "tracer-study-alumni-3c24a.firebasestorage.app",
  messagingSenderId: "680441746672",
  appId: "1:680441746672:web:12f1409506cc3ab8bd1e35",
  measurementId: "G-K3N9DNJJQ6"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Cloud Firestore dan simpan referensinya di variabel 'db'
const db = getFirestore(app);

// Ekspor 'db' agar bisa digunakan oleh file JavaScript lainnya (seperti alumni.js)
export { db };