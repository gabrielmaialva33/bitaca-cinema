// ===============================================
// AUTHENTICATION MANAGER
// Firebase Authentication for Voting System
// ===============================================

import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {app} from '../firebase-config.js';

/**
 * @typedef {Object} UserProfile
 * @property {string} uid - User unique identifier
 * @property {string|null} email - User email
 * @property {string|null} displayName - User display name
 * @property {string|null} photoURL - User photo URL
 */

class AuthManager {
    constructor() {
        this.auth = getAuth(app);
        this.googleProvider = new GoogleAuthProvider();
        this.currentUser = null;
        this.authStateCallbacks = [];

        // Initialize auth persistence
        this._initializePersistence();

        // Set up auth state observer
        this._setupAuthObserver();
    }

    /**
     * Initialize session persistence
     * @private
     */
    async _initializePersistence() {
        try {
            await setPersistence(this.auth, browserLocalPersistence);
            console.log('Auth persistence initialized');
        } catch (error) {
            console.error('Error setting persistence:', error);
        }
    }

    /**
     * Set up authentication state observer
     * @private
     */
    _setupAuthObserver() {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            console.log('Auth state changed:', user ? user.email : 'Not authenticated');

            // Notify all registered callbacks
            this.authStateCallbacks.forEach(callback => {
                try {
                    callback(user);
                } catch (error) {
                    console.error('Error in auth state callback:', error);
                }
            });
        });
    }

    /**
     * Register a callback for auth state changes
     * @param {Function} callback - Callback function that receives user object
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);

        // Immediately call with current state
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }

        // Return unsubscribe function
        return () => {
            const index = this.authStateCallbacks.indexOf(callback);
            if (index > -1) {
                this.authStateCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Sign in with Google
     * @returns {Promise<UserProfile>} User profile
     * @throws {Error} Authentication error
     */
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.googleProvider);
            const user = result.user;

            console.log('Google sign-in successful:', user.email);

            return this._getUserProfile(user);
        } catch (error) {
            console.error('Google sign-in error:', error);

            // Handle specific error cases
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Login cancelado pelo usuário');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Pop-up bloqueado. Por favor, permita pop-ups para este site.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                throw new Error('Solicitação de login cancelada');
            }

            throw new Error('Erro ao fazer login com Google. Tente novamente.');
        }
    }

    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<UserProfile>} User profile
     * @throws {Error} Authentication error
     */
    async signInWithEmail(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email e senha são obrigatórios');
            }

            const result = await signInWithEmailAndPassword(this.auth, email, password);
            const user = result.user;

            console.log('Email sign-in successful:', user.email);

            return this._getUserProfile(user);
        } catch (error) {
            console.error('Email sign-in error:', error);

            // Handle specific error cases
            if (error.code === 'auth/user-not-found') {
                throw new Error('Usuário não encontrado');
            } else if (error.code === 'auth/wrong-password') {
                throw new Error('Senha incorreta');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Email inválido');
            } else if (error.code === 'auth/user-disabled') {
                throw new Error('Conta desabilitada');
            } else if (error.code === 'auth/invalid-credential') {
                throw new Error('Credenciais inválidas');
            }

            throw new Error('Erro ao fazer login. Verifique suas credenciais.');
        }
    }

    /**
     * Create new account with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<UserProfile>} User profile
     * @throws {Error} Authentication error
     */
    async createAccount(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email e senha são obrigatórios');
            }

            if (password.length < 6) {
                throw new Error('A senha deve ter pelo menos 6 caracteres');
            }

            const result = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = result.user;

            console.log('Account created successfully:', user.email);

            return this._getUserProfile(user);
        } catch (error) {
            console.error('Account creation error:', error);

            // Handle specific error cases
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('Este email já está cadastrado');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Email inválido');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Senha muito fraca. Use pelo menos 6 caracteres.');
            }

            throw new Error('Erro ao criar conta. Tente novamente.');
        }
    }

    /**
     * Sign out current user
     * @returns {Promise<void>}
     * @throws {Error} Sign out error
     */
    async logout() {
        try {
            await signOut(this.auth);
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            throw new Error('Erro ao fazer logout. Tente novamente.');
        }
    }

    /**
     * Get current user profile
     * @returns {UserProfile|null} User profile or null if not authenticated
     */
    getCurrentUser() {
        if (!this.auth.currentUser) {
            return null;
        }
        return this._getUserProfile(this.auth.currentUser);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        return this.auth.currentUser !== null;
    }

    /**
     * Get user ID
     * @returns {string|null} User ID or null if not authenticated
     */
    getUserId() {
        return this.auth.currentUser ? this.auth.currentUser.uid : null;
    }

    /**
     * Get user email
     * @returns {string|null} User email or null if not authenticated
     */
    getUserEmail() {
        return this.auth.currentUser ? this.auth.currentUser.email : null;
    }

    /**
     * Extract user profile from Firebase User object
     * @private
     * @param {Object} user - Firebase User object
     * @returns {UserProfile} User profile
     */
    _getUserProfile(user) {
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };
    }

    /**
     * Wait for auth initialization
     * @returns {Promise<UserProfile|null>} Current user or null
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                unsubscribe();
                resolve(user ? this._getUserProfile(user) : null);
            });
        });
    }
}

// Create and export singleton instance
const authManager = new AuthManager();

export default authManager;
