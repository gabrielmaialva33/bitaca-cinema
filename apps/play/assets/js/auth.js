/**
 * Authentication System for Bitaca Play
 * Firebase Auth Integration
 */

import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export class AuthManager {
    constructor() {
        this.auth = getAuth(window.firebaseApp);
        this.currentUser = null;
        this.authStateCallbacks = [];

        // Setup auth state listener
        this.setupAuthStateListener();
    }

    setupAuthStateListener() {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            console.log('Auth state changed:', user ? user.email : 'Not logged in');

            // Trigger all callbacks
            this.authStateCallbacks.forEach(callback => callback(user));
        });
    }

    /**
     * Register callback for auth state changes
     */
    onAuthStateChanged(callback) {
        this.authStateCallbacks.push(callback);
    }

    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            console.log('Signed in:', userCredential.user.email);
            return {success: true, user: userCredential.user};
        } catch (error) {
            console.error('Sign in error:', error);
            return {success: false, error: this.getErrorMessage(error.code)};
        }
    }

    /**
     * Create new user account
     */
    async signUp(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            console.log('Account created:', userCredential.user.email);
            return {success: true, user: userCredential.user};
        } catch (error) {
            console.error('Sign up error:', error);
            return {success: false, error: this.getErrorMessage(error.code)};
        }
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(this.auth, provider);
            console.log('Signed in with Google:', userCredential.user.email);
            return {success: true, user: userCredential.user};
        } catch (error) {
            console.error('Google sign in error:', error);
            return {success: false, error: this.getErrorMessage(error.code)};
        }
    }

    /**
     * Sign out current user
     */
    async signOutUser() {
        try {
            await signOut(this.auth);
            console.log('Signed out successfully');
            window.location.href = '/login.html';
            return {success: true};
        } catch (error) {
            console.error('Sign out error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get user-friendly error messages
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuário desabilitado',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/email-already-in-use': 'Email já está em uso',
            'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        };

        return errorMessages[errorCode] || 'Erro desconhecido. Tente novamente.';
    }

    /**
     * Require authentication
     * Redirects to login if not authenticated
     */
    async requireAuth() {
        // Wait for auth to initialize
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                unsubscribe();
                if (!user) {
                    window.location.href = '/login.html';
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }
}

export default AuthManager;
