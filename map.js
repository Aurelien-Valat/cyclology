// --- DOM ELEMENTS FOR MAP ---
const emptyMapMessage = document.getElementById('empty-map-message');

let addColMarker = null;

let colMarkersGroup;

/**
 * Initializes the main map view.
 */
export function initMapDisplay() {
    if (window.mapDisplay) return;
    window.mapDisplay = L.map('map-display').setView([45.8, 6.9], 7); // Centered on Alps
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.mapDisplay);
}

/**
 * Initializes the map used in the 'Add Col' form.
 */
export function initMapAdd() {
    if (window.mapAdd) return;
    window.mapAdd = L.map('map-add').setView([45.8, 6.9], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.mapAdd);

    // When user clicks the map, update the form's lat/lng inputs
    window.mapAdd.on('click', (e) => {
        const { lat, lng } = e.latlng;
        document.getElementById('col-lat-input').value = lat.toFixed(5);
        document.getElementById('col-lng-input').value = lng.toFixed(5);
        updateAddFormMap(e.latlng);
    });
}

/**
 * Clears and redraws all markers on the main map view.
 * @param {Array} cols - The array of col objects to display.
 */
export function renderMapMarkers(cols) {
    if (!window.mapDisplay) return;

    // Crée le groupe s'il n'existe pas
    if (colMarkersGroup) {
        colMarkersGroup.clearLayers();
    } else {
        colMarkersGroup = L.layerGroup().addTo(window.mapDisplay);
    }

    if (!cols || cols.length === 0) {
        emptyMapMessage.style.display = 'block';
        return;
    }

    emptyMapMessage.style.display = 'none';

    const markers = cols.map(col => {
        const marker = L.marker([col.lat, col.lng]);
        marker.bindPopup(`<b>${col.name}</b><br>${col.distance || '?'} km`);
        return marker;
    });

    colMarkersGroup.addLayer(L.featureGroup(markers));

    // Ajuste la vue
    window.mapDisplay.fitBounds(L.featureGroup(markers).getBounds().pad(0.3));
}

/**
 * Updates the marker and view on the 'Add Col' map.
 * @param {L.LatLng | Array<number> | null} latlng - The coordinates for the marker.
 * @param {number} [zoom=12] - The zoom level to set.
 */
export function updateAddFormMap(latlng, zoom = 12) {
    if (!window.mapAdd) return;

    if (latlng) {
        if (addColMarker) {
            addColMarker.setLatLng(latlng);
        } else {
            addColMarker = L.marker(latlng).addTo(window.mapAdd);
        }
        window.mapAdd.setView(latlng, zoom);
    } else {
        // If latlng is null, remove marker and reset view
        if (addColMarker) {
            window.mapAdd.removeLayer(addColMarker);
            addColMarker = null;
        }
        window.mapAdd.setView([45.8, 6.9], 6);
    }
}