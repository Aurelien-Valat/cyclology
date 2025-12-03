import { signInWithGoogle, signOut, deleteUserAccount } from './auth.js';
import { initMapDisplay, initMapAdd, renderMapMarkers, updateAddFormMap } from './map.js';
import { getCols, addCol, updateCol, deleteCol, subscribe, deleteUserData } from './store.js';
import { knownCols } from './config.js';

// --- DOM ELEMENTS ---
const loginView = document.getElementById('login-view');
const appContent = document.getElementById('app-content');
const googleSignInBtn = document.getElementById('google-signin-btn');
const userAuthDiv = document.getElementById('user-auth');
const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('nav button');
const colsList = document.getElementById('cols-list');
const emptyListMessage = document.getElementById('empty-list-message');
const addColForm = document.getElementById('add-col-form');
const colNameInput = document.getElementById('col-name-input');
const colSuggestions = document.getElementById('col-suggestions');
const colIdInput = document.getElementById('col-id-input');
const colDateInput = document.getElementById('col-date-input');
const locationTabs = document.querySelectorAll('.location-tabs .tab-btn');

// --- RENDER FUNCTIONS ---
function renderList(cols) {
    colsList.innerHTML = '';
    if (cols.length === 0) {
        emptyListMessage.style.display = 'block';
        colsList.style.display = 'none';
    } else {
        emptyListMessage.style.display = 'none';
        colsList.style.display = 'block';
        const sortedCols = [...cols].sort((a, b) => (b.date || "0") > (a.date || "0") ? 1 : -1);
        sortedCols.forEach(createColListItem);
    }
}

function createColListItem(col) {
    const li = document.createElement('li');
    li.dataset.id = col.id;
    const date = col.date ? new Date(col.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric'}) : '';
    const avgGradient = (col.elevation && col.distance) ? ((col.elevation / (col.distance * 1000)) * 100).toFixed(1) : null;
    
    li.innerHTML = `
        <div class="col-main-info">
            <div>
                <div class="col-name">${col.name}</div>
                ${col.date ? `<div class="col-date">${date}</div>` : ''}
            </div>
        </div>
        <div class="col-stats">
            ${col.time ? `<span><i class="ph-bold ph-timer"></i> ${col.time}</span>` : ''}
            ${col.distance ? `<span><i class="ph-bold ph-road-horizon"></i> ${col.distance} km</span>` : ''}
            ${col.elevation ? `<span><i class="ph-bold ph-mountains"></i> ${col.elevation} m</span>` : ''}
        </div>
        <div class="col-details">
             <div class="col-details-stats">
                 ${avgGradient ? `<span><i class="ph-bold ph-percent"></i> ${avgGradient}% moyen</span>` : ''}
             </div>
             <div class="col-actions">
                <button class="edit-col" data-id="${col.id}">Modifier</button>
                <button class="delete-col" data-id="${col.id}">Supprimer</button>
            </div>
        </div>`;
    colsList.appendChild(li);
}


// --- VIEW & STATE MANAGEMENT ---
export function showLogin() {
    userAuthDiv.innerHTML = '';
    loginView.style.display = 'flex';
    appContent.style.display = 'none';
}

export function showApp(user) {
    // On remplace le bouton logout simple par une structure avec menu déroulant
    userAuthDiv.innerHTML = `
        <div class="user-menu-container" id="user-menu-trigger">
            <img id="user-photo" src="${user.photoURL}" alt="User photo" title="Ouvrir le menu">
            <button id="logout-btn" title="Déconnexion"><i class="ph-bold ph-sign-out"></i></button>

            <div id="user-dropdown" class="user-dropdown">
                <button id="delete-account-btn" class="danger">Supprimer le compte</button>
            </div>
        </div>
    `;

    const trigger = document.getElementById('user-menu-trigger');
    const dropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteBtn = document.getElementById('delete-account-btn');

    // 1. Ouvrir/Fermer le menu au clic sur la photo
    trigger.addEventListener('click', (e) => {
        // Empêche le clic sur les boutons de fermer immédiatement le menu (propagation)
        if(e.target.tagName === 'BUTTON') return;
        dropdown.classList.toggle('active');
        e.stopPropagation(); // Empêche le clic de remonter au document
    });

    // 2. Fermer le menu si on clique ailleurs sur la page
    document.addEventListener('click', () => {
        dropdown.classList.remove('active');
    });

    // 3. Action Déconnexion
    logoutBtn.addEventListener('click', signOut);

    // 4. Action Fermer le compte
    deleteBtn.addEventListener('click', async () => {
        if (confirm("⚠️ Attention !\n\nVous êtes sur le point de supprimer définitivement votre compte et tous vos cols enregistrés.\n\nCette action est irréversible. Voulez-vous continuer ?")) {
            try {
                // Étape 1 : Supprimer les données (cols)
                await deleteUserData(user.uid);
                // Étape 2 : Supprimer le compte Auth
                await deleteUserAccount();
                alert("Votre compte a été supprimé.");
                // La redirection vers le login se fera automatiquement via onAuthStateChanged
            } catch (error) {
                console.error("Erreur suppression:", error);
                if (error.code === 'auth/requires-recent-login') {
                    alert("Sécurité : Veuillez vous déconnecter et vous reconnecter avant de pouvoir supprimer votre compte.");
                } else {
                    alert("Une erreur est survenue lors de la suppression. Veuillez réessayer.");
                }
            }
        }
    });

    loginView.style.display = 'none';
    appContent.style.display = 'flex';
    switchView('list-view');
}

function switchView(viewId) {
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    navButtons.forEach(button => button.classList.remove('active'));
    document.getElementById(`nav-${viewId.split('-')[0]}`).classList.add('active');

    // Initialize maps on demand and render
    if (viewId === 'map-view') {
        initMapDisplay();
        setTimeout(() => L.Map.prototype.invalidateSize.call(window.mapDisplay), 0);
        renderMapMarkers(getCols());
    }
    if (viewId === 'add-view') {
        initMapAdd();
        setTimeout(() => {
            L.Map.prototype.invalidateSize.call(window.mapAdd);
            if (!colIdInput.value) { // Set today's date only for new cols
                 colDateInput.valueAsDate = new Date();
            }
        }, 0);
    }
}

// --- FORM HANDLING ---
function resetAddForm() {
    addColForm.reset();
    colIdInput.value = '';
    updateAddFormMap(null); // Clears marker and resets view
    colSuggestions.innerHTML = '';
    colSuggestions.style.display = 'none';
}

function fillFormForEdit(id) {
    const col = getCols().find(c => c.id === id);
    if (!col) return;
    
    resetAddForm();
    colIdInput.value = col.id;
    // Use querySelector for form elements to avoid global scope pollution
    addColForm.querySelector('#col-name-input').value = col.name;
    addColForm.querySelector('#col-time-input').value = col.time || '';
    addColForm.querySelector('#col-distance-input').value = col.distance || '';
    addColForm.querySelector('#col-elevation-input').value = col.elevation || '';
    addColForm.querySelector('#col-date-input').value = col.date || '';
    addColForm.querySelector('#col-lat-input').value = col.lat;
    addColForm.querySelector('#col-lng-input').value = col.lng;

    if (col.lat && col.lng) {
        initMapAdd();
        setTimeout(() => updateAddFormMap([col.lat, col.lng], 12), 50);
    }
    switchView('add-view');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // 1. Récupération des éléments pour la validation visuelle
    // (On utilise getElementById car c'est ce que votre HTML attend pour afficher les erreurs)
    const nameInput = document.getElementById("col-name-input");
    const timeInput = document.getElementById("col-time-input");
    const distanceInput = document.getElementById("col-distance-input");
    const elevationInput = document.getElementById("col-elevation-input");
    const dateInput = document.getElementById("col-date-input");
    const latInput = document.getElementById("col-lat-input");
    const lngInput = document.getElementById("col-lng-input");

    // 2. Reset des erreurs visuelles
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
    document.querySelectorAll("input").forEach(el => el.classList.remove("error"));

    let hasError = false;

    // --- LOGIQUE DE VALIDATION (Importée de main.js) ---

    // Vérif nom obligatoire
    if (!nameInput.value.trim()) {
        document.getElementById("error-name").textContent = "❌ Le nom du col est requis";
        nameInput.classList.add("error");
        hasError = true;
    }

    // Vérif format temps HH:MM:SS
    const timeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/;
    if (timeInput.value && !timeRegex.test(timeInput.value.trim())) {
        document.getElementById("error-time").textContent = "⏱ Format attendu : HH:MM:SS";
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

    // Vérification Coordonnées (Important pour la carte)
    if (!latInput.value || !lngInput.value) {
        // On peut afficher une alerte ou un message générique si pas de champ d'erreur spécifique dans le HTML
        alert("Veuillez sélectionner une position sur la carte ou entrer des coordonnées.");
        hasError = true;
    }

    if (hasError) {
        return; // On arrête tout ici si la validation échoue
    }

    // 3. Préparation des données (si tout est valide)
    const id = colIdInput.value;
    const colData = {
        name: nameInput.value.trim(),
        time: timeInput.value.trim() || null,
        distance: parseFloat(distanceInput.value) || null,
        elevation: parseInt(elevationInput.value) || null,
        date: dateInput.value || null,
        lat: parseFloat(latInput.value),
        lng: parseFloat(lngInput.value),
        // On garde createdAt ou updatedAt selon le cas, géré par Firestore souvent,
        // mais pour l'affichage local immédiat :
        createdAt: new Date()
    };

    // 4. Envoi à Firebase
    try {
        if (id) {
            await updateCol(id, colData);
            alert("Le col a bien été modifié !");
        } else {
            await addCol(colData);
            alert("🎉 Félicitations. Vous avez franchi un nouveau col !");
        }
        switchView('list-view');
        resetAddForm();
    } catch (error) {
        console.error(error);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

// --- AUTOCOMPLETE ---
function setupAutocomplete() {
    colNameInput.addEventListener('input', () => {
        const query = colNameInput.value.toLowerCase();
        if (query.length < 2) {
            colSuggestions.style.display = 'none';
            return;
        }
        const filtered = knownCols.filter(c => c.name.toLowerCase().includes(query));
        colSuggestions.innerHTML = '';
        if (filtered.length > 0) {
            filtered.forEach(col => {
                const div = document.createElement('div');
                div.textContent = col.name;
                div.addEventListener('click', () => selectAutocomplete(col));
                colSuggestions.appendChild(div);
            });
            colSuggestions.style.display = 'block';
        } else {
            colSuggestions.style.display = 'none';
        }
    });
}

function selectAutocomplete(col) {
    addColForm.querySelector('#col-name-input').value = col.name;
    addColForm.querySelector('#col-lat-input').value = col.lat;
    addColForm.querySelector('#col-lng-input').value = col.lng;
    addColForm.querySelector('#col-distance-input').value = col.distance || '';
    addColForm.querySelector('#col-elevation-input').value = col.elevation || '';
    colSuggestions.style.display = 'none';
    updateAddFormMap([col.lat, col.lng], 12);
}


// --- EVENT LISTENERS ---
export function setupUI() {
    // Subscribe to data changes to re-render relevant parts
    subscribe(cols => {
        renderList(cols);
        renderMapMarkers(cols);
    });

    googleSignInBtn.addEventListener('click', signInWithGoogle);

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewId = button.id.split('-')[1] + '-view';
            switchView(viewId);
        });
    });

    colsList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('delete-col')) {
            deleteCol(target.dataset.id);
        } else if (target.classList.contains('edit-col')) {
            fillFormForEdit(target.dataset.id);
        } else if (target.closest('li')) {
            target.closest('li').classList.toggle('expanded');
        }
    });

    addColForm.addEventListener('submit', handleFormSubmit);

    // Bloquer les dates futures ===
    const dateInput = document.getElementById('col-date-input');
    const today = new Date();
    // On formate la date au format YYYY-MM-DD requis par l'input HTML
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.max = `${yyyy}-${mm}-${dd}`;

    setupAutocomplete();

    // Close autocomplete on outside click
    document.addEventListener('click', (e) => {
        if (!colSuggestions.contains(e.target) && e.target !== colNameInput) {
            colSuggestions.style.display = 'none';
        }
    });

    // Location tabs in add form
    locationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            locationTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
        });
    });
}
