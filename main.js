import { onAuthStateChanged } from './auth.js';
import { loadCols, clearCols, addCol } from './store.js';
import { showApp, showLogin, setupUI } from './ui.js';
import { firebaseConfig } from './config.js';


function initApp() {
    // Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.error('Service Worker registration failed:', err);
            });
        }

        // Initialisation
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
    }

    // Lancer l'appli une fois le DOM prêt
    document.addEventListener('DOMContentLoaded', initApp);