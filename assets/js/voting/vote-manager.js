// ===============================================
// VOTE MANAGER
// Firestore integration for voting system
// ===============================================

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    getDocs,
    runTransaction,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {app} from '../firebase-config.js';
import authManager from './auth-manager.js';

/**
 * @typedef {Object} Vote
 * @property {string} userId - User ID who voted
 * @property {number} filmId - Film ID
 * @property {number} rating - Rating (1-5 stars)
 * @property {Date} timestamp - Vote timestamp
 */

/**
 * @typedef {Object} FilmStats
 * @property {number} voteCount - Total number of votes
 * @property {number} averageRating - Average rating
 * @property {number} totalStars - Total stars given
 */

class VoteManager {
    constructor() {
        this.db = getFirestore(app);
        this.voteListeners = new Map(); // Store active listeners
        this.MIN_RATING = 1;
        this.MAX_RATING = 5;
    }

    /**
     * Submit a vote for a film
     * @param {number} filmId - Film ID
     * @param {number} rating - Rating (1-5 stars)
     * @returns {Promise<void>}
     * @throws {Error} Vote submission error
     */
    async submitVote(filmId, rating) {
        try {
            // Validate authentication
            if (!authManager.isAuthenticated()) {
                throw new Error('Usuário não autenticado');
            }

            const userId = authManager.getUserId();

            // Validate inputs
            this._validateVoteInputs(filmId, rating);

            // Check if user already voted
            const hasVoted = await this.hasUserVoted(userId, filmId);
            if (hasVoted) {
                throw new Error('Você já votou neste filme');
            }

            // Use transaction to ensure atomicity
            await runTransaction(this.db, async (transaction) => {
                const filmRef = doc(this.db, 'films', filmId.toString());
                const voteId = `${userId}_${filmId}`;
                const voteRef = doc(this.db, 'votes', voteId);

                // Get current film stats
                const filmDoc = await transaction.get(filmRef);
                const currentStats = filmDoc.exists() ? filmDoc.data() : {
                    voteCount: 0,
                    totalStars: 0,
                    averageRating: 0
                };

                // Calculate new stats
                const newVoteCount = currentStats.voteCount + 1;
                const newTotalStars = currentStats.totalStars + rating;
                const newAverageRating = newTotalStars / newVoteCount;

                // Create vote document
                transaction.set(voteRef, {
                    userId: userId,
                    filmId: filmId,
                    rating: rating,
                    timestamp: serverTimestamp()
                });

                // Update film statistics
                transaction.set(filmRef, {
                    voteCount: newVoteCount,
                    totalStars: newTotalStars,
                    averageRating: parseFloat(newAverageRating.toFixed(2)),
                    lastUpdate: serverTimestamp()
                }, {merge: true});
            });

            console.log(`Vote submitted: Film ${filmId}, Rating ${rating}`);
        } catch (error) {
            console.error('Error submitting vote:', error);

            if (error.message.includes('já votou')) {
                throw error;
            }

            throw new Error('Erro ao enviar voto. Tente novamente.');
        }
    }

    /**
     * Check if user has voted for a film
     * @param {string} userId - User ID
     * @param {number} filmId - Film ID
     * @returns {Promise<boolean>} True if user has voted
     */
    async hasUserVoted(userId, filmId) {
        try {
            if (!userId || !filmId) {
                throw new Error('User ID and Film ID required');
            }

            const voteId = `${userId}_${filmId}`;
            const voteRef = doc(this.db, 'votes', voteId);
            const voteDoc = await getDoc(voteRef);

            return voteDoc.exists();
        } catch (error) {
            console.error('Error checking vote status:', error);
            throw new Error('Erro ao verificar status do voto');
        }
    }

    /**
     * Get user's vote for a film
     * @param {string} userId - User ID
     * @param {number} filmId - Film ID
     * @returns {Promise<Vote|null>} Vote data or null
     */
    async getUserVote(userId, filmId) {
        try {
            if (!userId || !filmId) {
                throw new Error('User ID and Film ID required');
            }

            const voteId = `${userId}_${filmId}`;
            const voteRef = doc(this.db, 'votes', voteId);
            const voteDoc = await getDoc(voteRef);

            if (!voteDoc.exists()) {
                return null;
            }

            return voteDoc.data();
        } catch (error) {
            console.error('Error getting user vote:', error);
            throw new Error('Erro ao buscar voto do usuário');
        }
    }

    /**
     * Get all votes for a user
     * @param {string} userId - User ID
     * @returns {Promise<Vote[]>} Array of user votes
     */
    async getUserVotes(userId) {
        try {
            if (!userId) {
                throw new Error('User ID required');
            }

            const votesRef = collection(this.db, 'votes');
            const q = query(votesRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            const votes = [];
            querySnapshot.forEach((doc) => {
                votes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return votes;
        } catch (error) {
            console.error('Error getting user votes:', error);
            throw new Error('Erro ao buscar votos do usuário');
        }
    }

    /**
     * Get film statistics
     * @param {number} filmId - Film ID
     * @returns {Promise<FilmStats>} Film statistics
     */
    async getFilmStats(filmId) {
        try {
            if (!filmId) {
                throw new Error('Film ID required');
            }

            const filmRef = doc(this.db, 'films', filmId.toString());
            const filmDoc = await getDoc(filmRef);

            if (!filmDoc.exists()) {
                return {
                    voteCount: 0,
                    averageRating: 0,
                    totalStars: 0
                };
            }

            return filmDoc.data();
        } catch (error) {
            console.error('Error getting film stats:', error);
            throw new Error('Erro ao buscar estatísticas do filme');
        }
    }

    /**
     * Get all films statistics
     * @returns {Promise<Map<number, FilmStats>>} Map of film ID to stats
     */
    async getAllFilmStats() {
        try {
            const filmsRef = collection(this.db, 'films');
            const querySnapshot = await getDocs(filmsRef);

            const statsMap = new Map();
            querySnapshot.forEach((doc) => {
                const filmId = parseInt(doc.id);
                statsMap.set(filmId, doc.data());
            });

            return statsMap;
        } catch (error) {
            console.error('Error getting all film stats:', error);
            throw new Error('Erro ao buscar estatísticas dos filmes');
        }
    }

    /**
     * Listen to real-time vote updates for a film
     * @param {number} filmId - Film ID
     * @param {Function} callback - Callback function receiving FilmStats
     * @returns {Function} Unsubscribe function
     */
    listenToFilmVotes(filmId, callback) {
        try {
            if (!filmId) {
                throw new Error('Film ID required');
            }

            const filmRef = doc(this.db, 'films', filmId.toString());

            const unsubscribe = onSnapshot(filmRef, (doc) => {
                const stats = doc.exists() ? doc.data() : {
                    voteCount: 0,
                    averageRating: 0,
                    totalStars: 0
                };

                callback(stats);
            }, (error) => {
                console.error('Error listening to film votes:', error);
            });

            // Store listener reference
            this.voteListeners.set(`film_${filmId}`, unsubscribe);

            return unsubscribe;
        } catch (error) {
            console.error('Error setting up vote listener:', error);
            throw new Error('Erro ao configurar atualização em tempo real');
        }
    }

    /**
     * Get top rated films
     * @param {number} limit - Number of films to return
     * @returns {Promise<Array>} Top rated films
     */
    async getTopRatedFilms(limit = 10) {
        try {
            const filmsRef = collection(this.db, 'films');
            const querySnapshot = await getDocs(filmsRef);

            const films = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.voteCount > 0) {
                    films.push({
                        filmId: parseInt(doc.id),
                        ...data
                    });
                }
            });

            // Sort by average rating (descending) and vote count (descending)
            films.sort((a, b) => {
                if (b.averageRating === a.averageRating) {
                    return b.voteCount - a.voteCount;
                }
                return b.averageRating - a.averageRating;
            });

            return films.slice(0, limit);
        } catch (error) {
            console.error('Error getting top rated films:', error);
            throw new Error('Erro ao buscar filmes mais votados');
        }
    }

    /**
     * Get voting statistics summary
     * @returns {Promise<Object>} Voting statistics
     */
    async getVotingStats() {
        try {
            const filmsRef = collection(this.db, 'films');
            const querySnapshot = await getDocs(filmsRef);

            let totalVotes = 0;
            let totalFilmsVoted = 0;
            let totalStars = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.voteCount > 0) {
                    totalVotes += data.voteCount;
                    totalStars += data.totalStars;
                    totalFilmsVoted++;
                }
            });

            const overallAverage = totalVotes > 0 ? totalStars / totalVotes : 0;

            return {
                totalVotes,
                totalFilmsVoted,
                overallAverage: parseFloat(overallAverage.toFixed(2))
            };
        } catch (error) {
            console.error('Error getting voting stats:', error);
            throw new Error('Erro ao buscar estatísticas de votação');
        }
    }

    /**
     * Clean up all active listeners
     */
    cleanupListeners() {
        this.voteListeners.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.voteListeners.clear();
        console.log('All vote listeners cleaned up');
    }

    /**
     * Validate vote inputs
     * @private
     */
    _validateVoteInputs(filmId, rating) {
        if (!filmId || typeof filmId !== 'number') {
            throw new Error('ID do filme inválido');
        }

        if (!rating || typeof rating !== 'number') {
            throw new Error('Nota inválida');
        }

        if (rating < this.MIN_RATING || rating > this.MAX_RATING) {
            throw new Error(`Nota deve estar entre ${this.MIN_RATING} e ${this.MAX_RATING}`);
        }
    }

    /**
     * Get rating distribution for a film
     * @param {number} filmId - Film ID
     * @returns {Promise<Object>} Rating distribution (1-5 stars count)
     */
    async getRatingDistribution(filmId) {
        try {
            if (!filmId) {
                throw new Error('Film ID required');
            }

            const votesRef = collection(this.db, 'votes');
            const q = query(votesRef, where('filmId', '==', filmId));
            const querySnapshot = await getDocs(q);

            const distribution = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };

            querySnapshot.forEach((doc) => {
                const vote = doc.data();
                distribution[vote.rating]++;
            });

            return distribution;
        } catch (error) {
            console.error('Error getting rating distribution:', error);
            throw new Error('Erro ao buscar distribuição de notas');
        }
    }
}

// Create and export singleton instance
const voteManager = new VoteManager();

export default voteManager;
