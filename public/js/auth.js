// File: auth.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("login-page").classList.add("hidden");
        document.getElementById("main-app").classList.remove("hidden");
        const emailEl = document.getElementById("current-user-email");
        if (emailEl) emailEl.textContent = user.email;
        if (window.initializeAppData) {
            window.initializeAppData();
        }
    } else {
        document.getElementById("login-page").classList.remove("hidden");
        document.getElementById("main-app").classList.add("hidden");
    }
    if (window.lucide) lucide.createIcons();
});

document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errEl = document.getElementById("login-error");
    
    errEl.classList.add("hidden");
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch {
        errEl.textContent = "Email atau password salah. Silakan coba lagi.";
        errEl.classList.remove("hidden");
    }
});

// Jadikan global agar bisa dipanggil dari tombol HTML onclick="handleLogout()"
window.handleLogout = async function () {
    await signOut(auth);
};