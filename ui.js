import { signInWithGoogle, signOut } from './auth.js';
import { getCols, addCol, updateCol, deleteCol, subscribe } from './store.js';
import { initMapDisplay, initMapAdd, renderMapMarkers, updateAddFormMap } from './map.js';
import { playAddSound } from './audio.js';
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
    userAuthDiv.innerHTML = `
        <img id="user-photo" src="${user.photoURL}" alt="User photo">
        <button id="logout-btn" title="Déconnexion"><i class="ph-bold ph-sign-out"></i></button>
    `;
    document.getElementById('logout-btn').addEventListener('click', signOut);
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
    const formData = new FormData(addColForm);
    const id = colIdInput.value;
    const colData = {
        name: addColForm.querySelector('#col-name-input').value.trim(),
        time: addColForm.querySelector('#col-time-input').value.trim() || null,
        distance: parseFloat(addColForm.querySelector('#col-distance-input').value) || null,
        elevation: parseInt(addColForm.querySelector('#col-elevation-input').value) || null,
        date: addColForm.querySelector('#col-date-input').value || null,
        lat: parseFloat(addColForm.querySelector('#col-lat-input').value),
        lng: parseFloat(addColForm.querySelector('#col-lng-input').value)
    };

    if (!colData.name || isNaN(colData.lat) || isNaN(colData.lng)) {
        alert("Veuillez entrer au moins un nom et des coordonnées valides.");
        return;
    }
    
    try {
        if (id) {
            await updateCol(id, colData);
        } else {
            await addCol(colData);
        }
        playAddSound();
        switchView('list-view');
        resetAddForm();
    } catch (error) {
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
