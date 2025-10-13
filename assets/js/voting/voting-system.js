// ===============================================
// VOTING SYSTEM - MAIN INTEGRATION
// Orchestrates auth, quiz, and voting components
// ===============================================

import authManager from './auth-manager.js';
import quizManager from './quiz-manager.js';
import voteManager from './vote-manager.js';
import {trackEvent} from '../firebase-config.js';

/**
 * @typedef {Object} VotingSystemState
 * @property {boolean} isAuthenticated - User authentication status
 * @property {boolean} hasPassedQuiz - Quiz completion status
 * @property {Object|null} currentUser - Current user profile
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Current error message
 */

/**
 * @typedef {Object} VotingSystemEvents
 * @property {Function} onAuthStateChange - Auth state change callback
 * @property {Function} onQuizStatusChange - Quiz status change callback
 * @property {Function} onVoteSubmitted - Vote submitted callback
 * @property {Function} onError - Error callback
 * @property {Function} onLoadingChange - Loading state change callback
 */

class VotingSystem {
    constructor() {
        this.authManager = authManager;
        this.quizManager = quizManager;
        this.voteManager = voteManager;

        this.state = {
            isAuthenticated: false,
            hasPassedQuiz: false,
            currentUser: null,
            isLoading: false,
            error: null
        };

        this.eventCallbacks = {
            onAuthStateChange: [],
            onQuizStatusChange: [],
            onVoteSubmitted: [],
            onError: [],
            onLoadingChange: []
        };

        this.initialized = false;
    }

    /**
     * Initialize voting system
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.log('Voting system already initialized');
            return;
        }

        try {
            this._setLoading(true);

            // Set up auth state observer
            this.authManager.onAuthStateChange(async (user) => {
                await this._handleAuthStateChange(user);
            });

            // Wait for initial auth state
            const user = await this.authManager.waitForAuth();
            await this._handleAuthStateChange(user);

            this.initialized = true;
            console.log('Voting system initialized successfully');

            // Track initialization
            trackEvent('voting_system_initialized');
        } catch (error) {
            console.error('Error initializing voting system:', error);
            this._setError('Erro ao inicializar sistema de votação');
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Handle authentication state changes
     * @private
     */
    async _handleAuthStateChange(user) {
        try {
            this.state.currentUser = user;
            this.state.isAuthenticated = !!user;

            if (user) {
                // Check quiz status
                const hasPassed = await this.quizManager.hasPassedQuiz(user.uid);
                this.state.hasPassedQuiz = hasPassed;

                this._triggerCallbacks('onQuizStatusChange', hasPassed);

                console.log('User authenticated:', user.email, 'Quiz passed:', hasPassed);
            } else {
                this.state.hasPassedQuiz = false;
                console.log('User logged out');
            }

            this._triggerCallbacks('onAuthStateChange', user);
        } catch (error) {
            console.error('Error handling auth state change:', error);
            this._setError('Erro ao processar autenticação');
        }
    }

    /**
     * Sign in with Google
     * @returns {Promise<Object>} User profile
     */
    async signInWithGoogle() {
        try {
            this._setLoading(true);
            this._clearError();

            const user = await this.authManager.signInWithGoogle();

            // Track login
            trackEvent('voting_login', {method: 'google'});

            return user;
        } catch (error) {
            this._setError(error.message);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User profile
     */
    async signInWithEmail(email, password) {
        try {
            this._setLoading(true);
            this._clearError();

            const user = await this.authManager.signInWithEmail(email, password);

            // Track login
            trackEvent('voting_login', {method: 'email'});

            return user;
        } catch (error) {
            this._setError(error.message);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Create new account
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User profile
     */
    async createAccount(email, password) {
        try {
            this._setLoading(true);
            this._clearError();

            const user = await this.authManager.createAccount(email, password);

            // Track account creation
            trackEvent('voting_account_created');

            return user;
        } catch (error) {
            this._setError(error.message);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Sign out current user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            this._setLoading(true);
            this._clearError();

            await this.authManager.logout();

            // Clean up vote listeners
            this.voteManager.cleanupListeners();

            // Track logout
            trackEvent('voting_logout');
        } catch (error) {
            this._setError(error.message);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Generate new quiz
     * @returns {Array} Quiz questions
     */
    generateQuiz() {
        try {
            this._clearError();

            if (!this.state.isAuthenticated) {
                throw new Error('Você precisa estar autenticado para fazer o quiz');
            }

            const questions = this.quizManager.generateQuiz();

            // Track quiz start
            trackEvent('voting_quiz_started');

            return questions;
        } catch (error) {
            this._setError(error.message);
            throw error;
        }
    }

    /**
     * Submit quiz answers
     * @param {Array} questions - Quiz questions
     * @param {Array} answers - User answers
     * @returns {Promise<Object>} Quiz result
     */
    async submitQuiz(questions, answers) {
        try {
            this._setLoading(true);
            this._clearError();

            if (!this.state.isAuthenticated) {
                throw new Error('Você precisa estar autenticado');
            }

            // Validate answers
            const result = this.quizManager.validateAnswers(questions, answers);

            // Save result
            const userId = this.authManager.getUserId();
            await this.quizManager.saveQuizResult(userId, result);

            // Update state
            this.state.hasPassedQuiz = result.passed;
            this._triggerCallbacks('onQuizStatusChange', result.passed);

            // Track quiz completion
            trackEvent('voting_quiz_completed', {
                passed: result.passed,
                score: result.score,
                total: result.total
            });

            return result;
        } catch (error) {
            this._setError(error.message);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Submit vote for a film
     * @param {number} filmId - Film ID
     * @param {number} rating - Rating (1-5)
     * @returns {Promise<void>}
     */
    async submitVote(filmId, rating) {
        try {
            this._setLoading(true);
            this._clearError();

            // Validate prerequisites
            if (!this.state.isAuthenticated) {
                throw new Error('Você precisa estar autenticado para votar');
            }

            if (!this.state.hasPassedQuiz) {
                throw new Error('Você precisa completar o quiz antes de votar');
            }

            // Submit vote
            await this.voteManager.submitVote(filmId, rating);

            // Track vote
            trackEvent('voting_vote_submitted', {
                filmId: filmId,
                rating: rating
            });

            this._triggerCallbacks('onVoteSubmitted', {filmId, rating});
        } catch (error) {
            this._setError(error.message);
            throw error;
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Check if user can vote
     * @returns {Object} Eligibility status
     */
    canVote() {
        return {
            canVote: this.state.isAuthenticated && this.state.hasPassedQuiz,
            isAuthenticated: this.state.isAuthenticated,
            hasPassedQuiz: this.state.hasPassedQuiz,
            reason: !this.state.isAuthenticated
                ? 'Faça login para votar'
                : !this.state.hasPassedQuiz
                    ? 'Complete o quiz para votar'
                    : null
        };
    }

    /**
     * Check if user has voted for a film
     * @param {number} filmId - Film ID
     * @returns {Promise<boolean>}
     */
    async hasVotedForFilm(filmId) {
        try {
            if (!this.state.isAuthenticated) {
                return false;
            }

            const userId = this.authManager.getUserId();
            return await this.voteManager.hasUserVoted(userId, filmId);
        } catch (error) {
            console.error('Error checking vote status:', error);
            return false;
        }
    }

    /**
     * Get user's vote for a film
     * @param {number} filmId - Film ID
     * @returns {Promise<Object|null>}
     */
    async getUserVoteForFilm(filmId) {
        try {
            if (!this.state.isAuthenticated) {
                return null;
            }

            const userId = this.authManager.getUserId();
            return await this.voteManager.getUserVote(userId, filmId);
        } catch (error) {
            console.error('Error getting user vote:', error);
            return null;
        }
    }

    /**
     * Get film statistics
     * @param {number} filmId - Film ID
     * @returns {Promise<Object>}
     */
    async getFilmStats(filmId) {
        try {
            return await this.voteManager.getFilmStats(filmId);
        } catch (error) {
            console.error('Error getting film stats:', error);
            throw error;
        }
    }

    /**
     * Get all films statistics
     * @returns {Promise<Map>}
     */
    async getAllFilmStats() {
        try {
            return await this.voteManager.getAllFilmStats();
        } catch (error) {
            console.error('Error getting all film stats:', error);
            throw error;
        }
    }

    /**
     * Get top rated films
     * @param {number} limit - Number of films
     * @returns {Promise<Array>}
     */
    async getTopRatedFilms(limit = 10) {
        try {
            return await this.voteManager.getTopRatedFilms(limit);
        } catch (error) {
            console.error('Error getting top rated films:', error);
            throw error;
        }
    }

    /**
     * Get user's quiz data
     * @returns {Promise<Object|null>}
     */
    async getUserQuizData() {
        try {
            if (!this.state.isAuthenticated) {
                return null;
            }

            const userId = this.authManager.getUserId();
            return await this.quizManager.getUserQuizData(userId);
        } catch (error) {
            console.error('Error getting quiz data:', error);
            return null;
        }
    }

    /**
     * Listen to real-time vote updates for a film
     * @param {number} filmId - Film ID
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    listenToFilmVotes(filmId, callback) {
        return this.voteManager.listenToFilmVotes(filmId, callback);
    }

    /**
     * Register event callback
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.eventCallbacks[event]) {
            console.warn(`Unknown event: ${event}`);
            return () => {};
        }

        this.eventCallbacks[event].push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.eventCallbacks[event].indexOf(callback);
            if (index > -1) {
                this.eventCallbacks[event].splice(index, 1);
            }
        };
    }

    /**
     * Get current system state
     * @returns {VotingSystemState}
     */
    getState() {
        return {...this.state};
    }

    /**
     * Trigger callbacks for an event
     * @private
     */
    _triggerCallbacks(event, data) {
        if (this.eventCallbacks[event]) {
            this.eventCallbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }

    /**
     * Set loading state
     * @private
     */
    _setLoading(isLoading) {
        this.state.isLoading = isLoading;
        this._triggerCallbacks('onLoadingChange', isLoading);
    }

    /**
     * Set error state
     * @private
     */
    _setError(error) {
        this.state.error = error;
        this._triggerCallbacks('onError', error);
    }

    /**
     * Clear error state
     * @private
     */
    _clearError() {
        this.state.error = null;
    }

    /**
     * Clean up and destroy voting system
     */
    destroy() {
        // Clean up vote listeners
        this.voteManager.cleanupListeners();

        // Clear event callbacks
        Object.keys(this.eventCallbacks).forEach(key => {
            this.eventCallbacks[key] = [];
        });

        this.initialized = false;
        console.log('Voting system destroyed');
    }
}

// Create and export singleton instance
const votingSystem = new VotingSystem();

export default votingSystem;
