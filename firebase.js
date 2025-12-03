import { firebaseConfig } from './config.js';

let app;
try {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    app = firebase.app();
} catch (e) {
    console.error("Firebase initialization error. Please add your Firebase config.", e);
    // Display an error message if the config is missing, preventing the app from crashing.
    document.body.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h2>Configuration Firebase manquante</h2>
        <p>Veuillez ajouter votre configuration Firebase dans <code>config.js</code> pour que l'application fonctionne.</p>
    </div>`;
    // Stop script execution if Firebase fails to initialize
    throw new Error("Firebase initialization failed");
}

export const auth = firebase.auth();
export const db = firebase.firestore();