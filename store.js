import { db } from './firebase.js';

let cols = [];
let colsCollection = null;
const observers = []; // Array of callback functions

/**
 * Subscribe a function to be called whenever the cols data changes.
 * @param {function} callback - The function to call with the updated cols array.
 */
export function subscribe(callback) {
    observers.push(callback);
    callback(cols); // Immediately notify with current data
}

/**
 * Notify all subscribed observers about a change in the cols data.
 */
function notify() {
    observers.forEach(callback => callback(cols));
}

/**
 * Clears the local cols data.
 */
export function clearCols() {
    cols = [];
    colsCollection = null;
    notify();
}

/**
 * Loads all cols for a given user from Firestore.
 * @param {string} userId - The UID of the current user.
 */
export async function loadCols(userId) {
    if (!userId) return;
    colsCollection = db.collection('users').doc(userId).collection('cols');
    try {
        const snapshot = await colsCollection.get();
        cols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        notify();
    } catch (error) {
        console.error("Error loading cols from Firestore: ", error);
    }
}

/**
 * Adds a new col document to Firestore.
 * @param {object} colData - The data for the new col.
 */
export async function addCol(colData) {
    if (!colsCollection) return;
    try {
        await colsCollection.add(colData);
        await loadCols(colsCollection.parent.id); // Reload data to get new item with ID
    } catch (error) {
        console.error("Error adding col: ", error);
        throw error; // Re-throw to be caught by UI
    }
}

/**
 * Updates an existing col document in Firestore.
 * @param {string} id - The ID of the col to update.
 * @param {object} colData - The new data for the col.
 */
export async function updateCol(id, colData) {
    if (!colsCollection) return;
    try {
        await colsCollection.doc(id).set(colData);
        await loadCols(colsCollection.parent.id); // Reload for consistency
    } catch (error) {
        console.error("Error updating col: ", error);
        throw error;
    }
}

/**
 * Deletes a col document from Firestore.
 * @param {string} id - The ID of the col to delete.
 */
export async function deleteCol(id) {
    const colToDelete = cols.find(c => c.id === id);
    if (colToDelete && confirm(`Êtes-vous sûr de vouloir supprimer "${colToDelete.name}" ?`)) {
        try {
            await colsCollection.doc(id).delete();
            await loadCols(colsCollection.parent.id); // Reload data
        } catch (error) {
            console.error("Error deleting col: ", error);
            alert("Une erreur est survenue lors de la suppression.");
        }
    }
}

/**
 * Get the current list of cols.
 * @returns {Array} The array of col objects.
 */
export const getCols = () => cols;

/**
 * Supprime toutes les données (cols) d'un utilisateur.
 * @param {string} userId - L'UID de l'utilisateur.
 */
export async function deleteUserData(userId) {
    if (!userId) return;
    const userColsRef = db.collection('users').doc(userId).collection('cols');

    // On récupère tout et on supprime par lot (batch)
    const snapshot = await userColsRef.get();
    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    clearCols(); // Vide l'état local
}