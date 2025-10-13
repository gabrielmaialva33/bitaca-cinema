// ===============================================
// VOTING SYSTEM INTEGRATION EXAMPLE
// Complete example showing how to integrate the voting system
// ===============================================

import votingSystem from './voting-system.js';

/**
 * Example integration class showing common usage patterns
 */
class VotingIntegration {
    constructor() {
        this.currentQuiz = null;
        this.userAnswers = [];
    }

    /**
     * Initialize the voting system
     */
    async init() {
        try {
            console.log('Initializing voting system...');

            // Initialize voting system
            await votingSystem.initialize();

            // Set up event listeners
            this.setupEventListeners();

            console.log('Voting system ready!');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Erro ao inicializar sistema de votação');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen to authentication state changes
        votingSystem.on('onAuthStateChange', (user) => {
            if (user) {
                console.log('User logged in:', user.email);
                this.showUserProfile(user);
                this.checkQuizEligibility();
            } else {
                console.log('User logged out');
                this.showLoginUI();
            }
        });

        // Listen to quiz status changes
        votingSystem.on('onQuizStatusChange', (passed) => {
            if (passed) {
                console.log('User has passed quiz');
                this.showVotingUI();
            } else {
                console.log('User needs to complete quiz');
                this.showQuizPrompt();
            }
        });

        // Listen to vote submissions
        votingSystem.on('onVoteSubmitted', ({filmId, rating}) => {
            console.log(`Vote submitted for film ${filmId}: ${rating} stars`);
            this.showVoteConfirmation(filmId, rating);
            this.refreshFilmStats(filmId);
        });

        // Listen to errors
        votingSystem.on('onError', (error) => {
            console.error('Voting system error:', error);
            this.showError(error);
        });

        // Listen to loading state
        votingSystem.on('onLoadingChange', (isLoading) => {
            this.toggleLoadingIndicator(isLoading);
        });
    }

    /**
     * Handle Google Sign-In
     */
    async handleGoogleSignIn() {
        try {
            const user = await votingSystem.signInWithGoogle();
            console.log('Google sign-in successful:', user);
            return user;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    }

    /**
     * Handle Email/Password Sign-In
     */
    async handleEmailSignIn(email, password) {
        try {
            const user = await votingSystem.signInWithEmail(email, password);
            console.log('Email sign-in successful:', user);
            return user;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    }

    /**
     * Handle Account Creation
     */
    async handleAccountCreation(email, password) {
        try {
            const user = await votingSystem.createAccount(email, password);
            console.log('Account created:', user);
            return user;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    }

    /**
     * Handle Logout
     */
    async handleLogout() {
        try {
            await votingSystem.logout();
            console.log('User logged out');
            this.showLoginUI();
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Check quiz eligibility and status
     */
    async checkQuizEligibility() {
        const eligibility = votingSystem.canVote();

        if (eligibility.canVote) {
            this.showVotingUI();
        } else if (!eligibility.hasPassedQuiz) {
            // Get quiz history
            const quizData = await votingSystem.getUserQuizData();
            if (quizData) {
                console.log('Quiz attempts:', quizData.quizAttempts);
                console.log('Best score:', quizData.bestScore);
            }
            this.showQuizPrompt();
        }
    }

    /**
     * Start quiz
     */
    startQuiz() {
        try {
            // Generate quiz questions
            this.currentQuiz = votingSystem.generateQuiz();
            this.userAnswers = [];

            console.log('Quiz started:', this.currentQuiz);
            this.renderQuiz(this.currentQuiz);
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Submit quiz answers
     */
    async submitQuiz() {
        try {
            if (!this.currentQuiz || this.userAnswers.length !== this.currentQuiz.length) {
                throw new Error('Por favor, responda todas as questões');
            }

            const result = await votingSystem.submitQuiz(this.currentQuiz, this.userAnswers);

            console.log('Quiz result:', result);

            if (result.passed) {
                this.showQuizSuccess(result);
            } else {
                this.showQuizFailure(result);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Submit vote for a film
     */
    async submitVote(filmId, rating) {
        try {
            // Check eligibility
            const eligibility = votingSystem.canVote();
            if (!eligibility.canVote) {
                throw new Error(eligibility.reason);
            }

            // Check if already voted
            const hasVoted = await votingSystem.hasVotedForFilm(filmId);
            if (hasVoted) {
                const existingVote = await votingSystem.getUserVoteForFilm(filmId);
                this.showAlreadyVoted(filmId, existingVote.rating);
                return;
            }

            // Submit vote
            await votingSystem.submitVote(filmId, rating);
            console.log(`Vote submitted: Film ${filmId}, Rating ${rating}`);
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Load and display film statistics
     */
    async loadFilmStats(filmId) {
        try {
            const stats = await votingSystem.getFilmStats(filmId);
            console.log(`Film ${filmId} stats:`, stats);

            this.displayFilmStats(filmId, stats);

            // Set up real-time updates
            const unsubscribe = votingSystem.listenToFilmVotes(filmId, (newStats) => {
                console.log(`Film ${filmId} stats updated:`, newStats);
                this.displayFilmStats(filmId, newStats);
            });

            // Store unsubscribe function for cleanup
            return unsubscribe;
        } catch (error) {
            console.error('Error loading film stats:', error);
        }
    }

    /**
     * Load all films with voting statistics
     */
    async loadAllFilmsWithStats() {
        try {
            // Get all film stats from Firebase
            const statsMap = await votingSystem.getAllFilmStats();

            // Get film data
            const films = window.filmesData || [];

            // Merge film data with stats
            const filmsWithStats = films.map(film => {
                const stats = statsMap.get(film.id) || {
                    voteCount: 0,
                    averageRating: 0
                };

                return {
                    ...film,
                    votes: stats.voteCount,
                    rating: stats.averageRating
                };
            });

            // Sort by rating
            filmsWithStats.sort((a, b) => {
                if (b.rating === a.rating) {
                    return b.votes - a.votes;
                }
                return b.rating - a.rating;
            });

            console.log('Films with stats:', filmsWithStats);
            this.displayFilmsList(filmsWithStats);

            return filmsWithStats;
        } catch (error) {
            console.error('Error loading films with stats:', error);
        }
    }

    /**
     * Load top rated films
     */
    async loadTopRatedFilms(limit = 10) {
        try {
            const topFilms = await votingSystem.getTopRatedFilms(limit);
            console.log('Top rated films:', topFilms);

            // Get full film data
            const films = window.filmesData || [];
            const topFilmsWithData = topFilms.map(stat => {
                const film = films.find(f => f.id === stat.filmId);
                return {
                    ...film,
                    votes: stat.voteCount,
                    rating: stat.averageRating
                };
            });

            this.displayTopFilms(topFilmsWithData);
            return topFilmsWithData;
        } catch (error) {
            console.error('Error loading top films:', error);
        }
    }

    // ===============================================
    // UI METHODS (Implement these based on your UI)
    // ===============================================

    showLoginUI() {
        console.log('[UI] Show login UI');
        // Implement your login UI display logic
    }

    showUserProfile(user) {
        console.log('[UI] Show user profile:', user);
        // Implement your user profile display logic
    }

    showQuizPrompt() {
        console.log('[UI] Show quiz prompt');
        // Implement your quiz prompt UI
    }

    renderQuiz(questions) {
        console.log('[UI] Render quiz:', questions);
        // Implement your quiz rendering logic
        // Example structure:
        questions.forEach((q, index) => {
            console.log(`Question ${index + 1}: ${q.question}`);
            q.options.forEach((option, optIndex) => {
                console.log(`  ${optIndex + 1}. ${option}`);
            });
        });
    }

    showQuizSuccess(result) {
        console.log('[UI] Quiz passed!', result);
        console.log(`Score: ${result.score}/${result.total}`);
        // Implement success UI
    }

    showQuizFailure(result) {
        console.log('[UI] Quiz failed.', result);
        console.log(`Score: ${result.score}/${result.total}`);
        console.log('Try again!');
        // Implement failure UI with retry option
    }

    showVotingUI() {
        console.log('[UI] Show voting UI');
        // Implement your voting UI display logic
    }

    displayFilmStats(filmId, stats) {
        console.log(`[UI] Display stats for film ${filmId}:`, stats);
        console.log(`  Votes: ${stats.voteCount}`);
        console.log(`  Average Rating: ${stats.averageRating} ⭐`);
        // Implement your stats display logic
    }

    displayFilmsList(films) {
        console.log('[UI] Display films list:', films.length, 'films');
        // Implement your films list display logic
    }

    displayTopFilms(films) {
        console.log('[UI] Display top films:', films);
        // Implement your top films display logic
    }

    showVoteConfirmation(filmId, rating) {
        console.log(`[UI] Vote confirmed! Film ${filmId}: ${rating} stars`);
        // Implement confirmation UI
    }

    showAlreadyVoted(filmId, rating) {
        console.log(`[UI] You already voted ${rating} stars for film ${filmId}`);
        // Implement already voted UI
    }

    showError(message) {
        console.error('[UI] Error:', message);
        // Implement error display logic
    }

    toggleLoadingIndicator(isLoading) {
        console.log('[UI] Loading:', isLoading);
        // Implement loading indicator logic
    }

    refreshFilmStats(filmId) {
        console.log('[UI] Refresh stats for film', filmId);
        this.loadFilmStats(filmId);
    }
}

// ===============================================
// USAGE EXAMPLE
// ===============================================

// Create integration instance
const integration = new VotingIntegration();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await integration.init();
});

// Example: Google Sign-In button
// document.getElementById('google-signin-btn').addEventListener('click', () => {
//     integration.handleGoogleSignIn();
// });

// Example: Start Quiz button
// document.getElementById('start-quiz-btn').addEventListener('click', () => {
//     integration.startQuiz();
// });

// Example: Submit vote
// document.getElementById('vote-btn').addEventListener('click', () => {
//     const filmId = 1; // Get from UI
//     const rating = 5; // Get from star rating UI
//     integration.submitVote(filmId, rating);
// });

// Example: Load films with stats on page load
// integration.loadAllFilmsWithStats();

// Example: Load top 5 films
// integration.loadTopRatedFilms(5);

export default VotingIntegration;
