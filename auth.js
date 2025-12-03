import { auth } from './firebase.js';

/**
 * Handles Google Sign-In process.
 */
export function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Google Sign-In Error", error);
    });
}

/**
 * Handles user sign-out.
 */
export function signOut() {
    auth.signOut();
}

/**
 * Sets up an observer on the authentication state.
 * @param {function} callback - The function to call when the auth state changes. It receives the user object.
 */
export function onAuthStateChanged(callback) {
    auth.onAuthStateChanged(callback);
}

/**
 * Supprime le compte de l'utilisateur courant.
 */
export async function deleteUserAccount() {
    const user = auth.currentUser;
    if (user) {
        await user.delete();
    }
}