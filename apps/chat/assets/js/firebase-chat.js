/**
 * Firebase Chat Integration
 * Handles authentication and Firestore persistence
 */

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export class FirebaseChat {
    constructor() {
        this.auth = getAuth(window.firebaseApp);
        this.db = getFirestore(window.firebaseApp);
        this.currentUser = null;
        this.authStateCallbacks = [];
        this.conversationsUnsubscribe = null;

        // Setup auth listener
        this.setupAuthListener();
    }

    /**
     * Setup authentication state listener
     */
    setupAuthListener() {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            console.log('Auth state:', user ? user.email : 'Not logged in');

            // Trigger callbacks
            this.authStateCallbacks.forEach(callback => callback(user));

            // Redirect if not logged in
            if (!user && !window.location.pathname.includes('login')) {
                window.location.href = '../play/login.html';
            }
        });
    }

    /**
     * Register auth state change callback
     */
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);

        // Call immediately if user is already loaded
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }

    /**
     * Sign in with email/password
     */
    async signIn(email, password) {
        try {
            const result = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await signOut(this.auth);
            window.location.href = '../play/login.html';
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Wait for authentication
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    /**
     * Save conversation to Firestore
     */
    async saveConversation(conversationId, data) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        const userId = this.currentUser.uid;
        const conversationRef = doc(this.db, 'users', userId, 'conversations', conversationId);

        try {
            await setDoc(conversationRef, {
                ...data,
                userId: userId,
                updatedAt: serverTimestamp()
            }, { merge: true });

            return { success: true };
        } catch (error) {
            console.error('Error saving conversation:', error);
            throw error;
        }
    }

    /**
     * Get conversation from Firestore
     */
    async getConversation(conversationId) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        const userId = this.currentUser.uid;
        const conversationRef = doc(this.db, 'users', userId, 'conversations', conversationId);

        try {
            const docSnap = await getDoc(conversationRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting conversation:', error);
            throw error;
        }
    }

    /**
     * Get all conversations for user
     */
    async getConversations(limitCount = 50) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        const userId = this.currentUser.uid;
        const conversationsRef = collection(this.db, 'users', userId, 'conversations');
        const q = query(conversationsRef, orderBy('updatedAt', 'desc'), limit(limitCount));

        try {
            const querySnapshot = await getDocs(q);
            const conversations = [];

            querySnapshot.forEach((doc) => {
                conversations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return conversations;
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    }

    /**
     * Listen to conversations in real-time
     */
    listenToConversations(callback, limitCount = 50) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        const userId = this.currentUser.uid;
        const conversationsRef = collection(this.db, 'users', userId, 'conversations');
        const q = query(conversationsRef, orderBy('updatedAt', 'desc'), limit(limitCount));

        this.conversationsUnsubscribe = onSnapshot(q, (querySnapshot) => {
            const conversations = [];
            querySnapshot.forEach((doc) => {
                conversations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(conversations);
        });
    }

    /**
     * Stop listening to conversations
     */
    stopListening() {
        if (this.conversationsUnsubscribe) {
            this.conversationsUnsubscribe();
            this.conversationsUnsubscribe = null;
        }
    }

    /**
     * Delete conversation
     */
    async deleteConversation(conversationId) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        const userId = this.currentUser.uid;
        const conversationRef = doc(this.db, 'users', userId, 'conversations', conversationId);

        try {
            await setDoc(conversationRef, {
                deleted: true,
                deletedAt: serverTimestamp()
            }, { merge: true });

            return { success: true };
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    /**
     * Get or create current session
     */
    async getCurrentSession() {
        const sessionId = sessionStorage.getItem('current_session_id');

        if (sessionId) {
            const conversation = await this.getConversation(sessionId);
            if (conversation && !conversation.deleted) {
                return conversation;
            }
        }

        // Create new session
        const newSessionId = this.generateId();
        sessionStorage.setItem('current_session_id', newSessionId);

        return {
            id: newSessionId,
            title: 'Nova Conversa',
            messages: [],
            model: 'meta/llama-3.3-70b-instruct',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Set current session
     */
    setCurrentSession(sessionId) {
        sessionStorage.setItem('current_session_id', sessionId);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Generate conversation title from first message
     */
    generateTitle(firstMessage) {
        const maxLength = 50;
        const text = firstMessage.content;

        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength) + '...';
    }
}

export default FirebaseChat;
