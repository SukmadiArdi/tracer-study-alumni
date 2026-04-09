// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDbObyn9f58StGXlo11l3WvjbZA5MaW61U",
  authDomain:        "tracer-study-alumni-3c24a.firebaseapp.com",
  projectId:         "tracer-study-alumni-3c24a",
  storageBucket:     "tracer-study-alumni-3c24a.firebasestorage.app",
  messagingSenderId: "680441746672",
  appId:             "1:680441746672:web:12f1409506cc3ab8bd1e35",
  measurementId:     "G-K3N9DNJJQ6"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };