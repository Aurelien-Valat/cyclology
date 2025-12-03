import { onAuthStateChanged } from './auth.js';
import { loadCols, clearCols, addCol } from './store.js';
import { showApp, showLogin, setupUI } from './ui.js';
import { initAudio } from './audio.js';
import { firebaseConfig } from './config.js';


function initApp() {
    // Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.error('Service Worker registration failed:', err);
            });
        }

        // Initialisation
        initAudio();
        setupUI();

        // Suivi de l'état d'authentification
        onAuthStateChanged(async (user) => {
            if (user) {
                await loadCols(user.uid);
                showApp(user);
            } else {
                clearCols();
                showLogin();
            }
        });

        // === Validation du formulaire "Ajouter un col" ===
        const form = document.getElementById("add-col-form");
        if (form) {
            form.addEventListener("submit", function(e) {
                e.preventDefault();

                // Reset erreurs
                document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
                document.querySelectorAll("input").forEach(el => el.classList.remove("error"));

                let hasError = false;

                const nameInput = document.getElementById("col-name-input");
                const timeInput = document.getElementById("col-time-input");
                const distanceInput = document.getElementById("col-distance-input");
                const elevationInput = document.getElementById("col-elevation-input");
                const dateInput = document.getElementById("col-date-input");

                // Vérif nom obligatoire
                if (!nameInput.value.trim()) {
                    document.getElementById("error-name").textContent = "❌ Le nom du col est requis";
                    nameInput.classList.add("error");
                    hasError = true;
                }

                // Vérif format temps HH:MM:SS
                const timeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/;
                if (timeInput.value && !timeRegex.test(timeInput.value.trim())) {
                    document.getElementById("error-time").textContent = "⏱ Format attendu : HH:MM:SS (ex: 01:23:45)";
                    timeInput.classList.add("error");
                    hasError = true;
                }

                // Vérif distance
                if (distanceInput.value && parseFloat(distanceInput.value) <= 0) {
                    document.getElementById("error-distance").textContent = "🚴 La distance doit être positive";
                    distanceInput.classList.add("error");
                    hasError = true;
                }

                // Vérif dénivelé
                if (elevationInput.value && parseInt(elevationInput.value) <= 0) {
                    document.getElementById("error-elevation").textContent = "⛰️ Le dénivelé doit être positif";
                    elevationInput.classList.add("error");
                    hasError = true;
                }

                // Vérif date
                if (dateInput.value && new Date(dateInput.value) > new Date()) {
                    document.getElementById("error-date").textContent = "📅 La date ne peut pas être dans le futur";
                    dateInput.classList.add("error");
                    hasError = true;
                }

                // 🚨 Si erreurs → on arrête TOTALEMENT
                if (hasError) {
                    console.warn("⛔ Formulaire non validé");
                    return false; // <- très important
                }

                // ✅ Données prêtes à enregistrer
                const col = {
                    name: nameInput.value.trim(),
                    time: timeInput.value.trim(),
                    distance: distanceInput.value ? parseFloat(distanceInput.value) : null,
                    elevation: elevationInput.value ? parseInt(elevationInput.value) : null,
                    date: dateInput.value || null,
                    createdAt: new Date()
                };

                console.log("Col validé :", col);

                addCol(col);
                form.reset();
            });

        }
    }

    // Lancer l'appli une fois le DOM prêt
    document.addEventListener('DOMContentLoaded', initApp);