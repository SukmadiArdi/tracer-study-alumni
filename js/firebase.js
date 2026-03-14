// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbObyn9f58StGXlo11l3WvjbZA5MaW61U",
  authDomain: "tracer-study-alumni-3c24a.firebaseapp.com",
  projectId: "tracer-study-alumni-3c24a",
  storageBucket: "tracer-study-alumni-3c24a.firebasestorage.app",
  messagingSenderId: "680441746672",
  appId: "1:680441746672:web:12f1409506cc3ab8bd1e35",
  measurementId: "G-K3N9DNJJQ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);