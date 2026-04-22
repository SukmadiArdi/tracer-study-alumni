// File: auth.js
import { supabase } from "./supabase.js";

supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user;
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
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errEl.textContent = "Email atau password salah. Silakan coba lagi.";
        errEl.classList.remove("hidden");
    }
});

// Jadikan global agar bisa dipanggil dari tombol HTML onclick="handleLogout()"
window.handleLogout = async function () {
    await supabase.auth.signOut();
};