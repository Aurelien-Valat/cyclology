// IMPORTANT: Replace with your actual Firebase project configuration
// To make Google Sign-In work, you need to:
// 1. Go to https://console.firebase.google.com/ and create a project.
// 2. Add a Web App to your project to get your configuration keys.
// 3. Paste your config keys below.
// 4. In your Firebase project, go to "Authentication" -> "Sign-in method" and enable "Google".
// 5. Under "Authentication" -> "Settings" -> "Authorized domains", add the domain you are using (e.g., localhost for local testing).
export const firebaseConfig = {
  apiKey: "AIzaSyDsX7AdDdQXN9lWkiWYTV_TPj_lLver3FQ",
  authDomain: "cyclology-9cdd3.firebaseapp.com",
  projectId: "cyclology-9cdd3",
  storageBucket: "cyclology-9cdd3.firebasestorage.app",
  messagingSenderId: "749316678560",
  appId: "1:749316678560:android:2bb9d77dba6de54f3f7ac5"
};

// Data for col name autocomplete
export const knownCols = [
    { name: "Col du Tourmalet", lat: 42.9083, lng: 0.1214, distance: 18.6, elevation: 1404 },
    { name: "Col du Galibier", lat: 45.0642, lng: 6.4086, distance: 35.1, elevation: 2121 },
    { name: "Alpe d'Huez", lat: 45.0911, lng: 6.0683, distance: 13.8, elevation: 1125 },
    { name: "Mont Ventoux", lat: 44.1745, lng: 5.2742, distance: 21.8, elevation: 1617 },
    { name: "Col de l'Iseran", lat: 45.4172, lng: 7.0311, distance: 48, elevation: 1955 },
    { name: "Col d'Izoard", lat: 44.8206, lng: 6.735, distance: 19.2, elevation: 1141 },
    { name: "Col de la Madeleine", lat: 45.435, lng: 6.405, distance: 25.3, elevation: 1585 },
];