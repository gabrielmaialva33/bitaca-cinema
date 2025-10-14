/**
 * RL Recommendation Engine
 * Uses Reinforcement Learning to improve recommendations based on user behavior
 * Processes analytics data to learn user preferences
 */

export class RLRecommendationEngine {
    constructor(firebaseStorage, mongoStorage) {
        this.firebase = firebaseStorage;
        this.mongo = mongoStorage;

        // RL Parameters
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.explorationRate = 0.2; // 20% exploration, 80% exploitation

        // Action rewards
        this.rewardMap = {
            'click': 1,
            'play': 3,
            'watch_25': 5,      // Watched 25%
            'watch_50': 10,     // Watched 50%
            'watch_75': 15,     // Watched 75%
            'complete': 20,     // Watched 100%
            'skip': -5,
            'search': 2,
            'share': 8,
            'favorite': 15
        };

        // User preference model (Q-table simplified)
        this.userModels = new Map();
    }

    /**
     * Process analytics session and update user model
     * @param {Object} sessionData - Analytics session data
     * @returns {Promise<Object>} Updated user model
     */
    async processSession(sessionData) {
        const userId = sessionData.userId;
        console.log(`🎯 Processing RL session for user: ${userId}`);

        // Get or create user model
        let userModel = this.userModels.get(userId) || await this.loadUserModel(userId);

        // Process RL state from session
        const { actions, rewards, states } = sessionData.rlState;

        // Update Q-values based on actions and rewards
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const reward = rewards[i] || 0;
            const state = states[i];

            userModel = this.updateQValue(userModel, state, action, reward);
        }

        // Derive preferences from actions
        const preferences = this.derivePreferences(actions, rewards);

        // Update user model with new preferences
        userModel.preferences = this.mergePreferences(userModel.preferences || {}, preferences);
        userModel.lastUpdated = new Date();
        userModel.sessionCount = (userModel.sessionCount || 0) + 1;

        // Save updated model
        await this.saveUserModel(userId, userModel);

        this.userModels.set(userId, userModel);

        console.log('✅ User model updated:', {
            sessionCount: userModel.sessionCount,
            topPreferences: Object.keys(preferences).slice(0, 5)
        });

        return userModel;
    }

    /**
     * Update Q-value using Bellman equation
     * @param {Object} userModel - User model
     * @param {Object} state - Current state
     * @param {Object} action - Action taken
     * @param {number} reward - Reward received
     * @returns {Object} Updated user model
     */
    updateQValue(userModel, state, action, reward) {
        if (!userModel.qTable) {
            userModel.qTable = {};
        }

        const stateKey = this.getStateKey(state);
        const actionKey = action.action;

        if (!userModel.qTable[stateKey]) {
            userModel.qTable[stateKey] = {};
        }

        // Current Q-value
        const currentQ = userModel.qTable[stateKey][actionKey] || 0;

        // Estimate of optimal future value (simplified)
        const maxFutureQ = Math.max(...Object.values(userModel.qTable[stateKey] || { default: 0 }), 0);

        // Bellman equation: Q(s,a) = Q(s,a) + α [r + γ * max Q(s',a') - Q(s,a)]
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxFutureQ - currentQ);

        userModel.qTable[stateKey][actionKey] = newQ;

        return userModel;
    }

    /**
     * Get state key for Q-table
     * @param {Object} state - State object
     * @returns {string} State key
     */
    getStateKey(state) {
        // Simplify state to key dimensions
        const timeCategory = state.timeOnPage < 30000 ? 'short' : state.timeOnPage < 120000 ? 'medium' : 'long';
        const engagementLevel = state.clickCount < 5 ? 'low' : state.clickCount < 15 ? 'medium' : 'high';

        return `${timeCategory}_${engagementLevel}_${state.deviceType}`;
    }

    /**
     * Derive preferences from actions and rewards
     * @param {Array} actions - Actions taken
     * @param {Array} rewards - Rewards received
     * @returns {Object} Derived preferences
     */
    derivePreferences(actions, rewards) {
        const preferences = {};

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const reward = rewards[i] || 0;

            // Extract preference signals from actions
            if (action.action === 'play' && action.data.contentTitle) {
                const title = action.data.contentTitle;
                preferences[title] = (preferences[title] || 0) + reward;
            }

            if (action.action === 'click' && action.data.element) {
                const category = this.extractCategory(action.data.element);
                if (category) {
                    preferences[`category_${category}`] = (preferences[`category_${category}`] || 0) + 1;
                }
            }

            // Genre preferences
            if (action.data.genres) {
                action.data.genres.forEach(genre => {
                    preferences[`genre_${genre}`] = (preferences[`genre_${genre}`] || 0) + reward;
                });
            }
        }

        return preferences;
    }

    /**
     * Extract category from clicked element
     * @param {Object} element - DOM element data
     * @returns {string|null} Category
     */
    extractCategory(element) {
        const text = element.text?.toLowerCase() || '';
        const classes = element.classes?.toLowerCase() || '';

        if (text.includes('anime') || classes.includes('anime')) return 'anime';
        if (text.includes('filme') || classes.includes('movie')) return 'movie';
        if (text.includes('série') || classes.includes('series')) return 'series';

        return null;
    }

    /**
     * Merge old and new preferences
     * @param {Object} oldPrefs - Old preferences
     * @param {Object} newPrefs - New preferences
     * @returns {Object} Merged preferences
     */
    mergePreferences(oldPrefs, newPrefs) {
        const merged = { ...oldPrefs };

        for (const [key, value] of Object.entries(newPrefs)) {
            // Decay old preference and add new
            const decayFactor = 0.95;
            merged[key] = (merged[key] || 0) * decayFactor + value;
        }

        return merged;
    }

    /**
     * Get recommendations for user using RL policy
     * @param {string} userId - User ID
     * @param {Array} availableContent - Available content to recommend
     * @param {number} limit - Max recommendations
     * @returns {Promise<Array>} Recommended content
     */
    async getRecommendations(userId, availableContent, limit = 10) {
        console.log(`🎯 Getting RL-based recommendations for user: ${userId}`);

        // Load user model
        let userModel = this.userModels.get(userId) || await this.loadUserModel(userId);

        if (!userModel.preferences || Object.keys(userModel.preferences).length === 0) {
            // No preferences yet, return popular content
            console.log('⚠️  No user model found, returning popular content');
            return availableContent.slice(0, limit);
        }

        // Score each content item
        const scoredContent = availableContent.map(content => ({
            ...content,
            rlScore: this.scoreContent(content, userModel)
        }));

        // Epsilon-greedy strategy: explore vs exploit
        const shouldExplore = Math.random() < this.explorationRate;

        if (shouldExplore) {
            // Exploration: return random items
            console.log('🔍 Exploring: returning random content');
            return this.shuffleArray(scoredContent).slice(0, limit);
        } else {
            // Exploitation: return highest scored items
            console.log('🎯 Exploiting: returning best scored content');
            return scoredContent
                .sort((a, b) => b.rlScore - a.rlScore)
                .slice(0, limit);
        }
    }

    /**
     * Score content based on user model
     * @param {Object} content - Content item
     * @param {Object} userModel - User model
     * @returns {number} Score
     */
    scoreContent(content, userModel) {
        let score = 0;
        const preferences = userModel.preferences;

        // Score based on title match
        if (content.title && preferences[content.title]) {
            score += preferences[content.title] * 2;
        }

        // Score based on genres
        if (content.smartTags?.genres) {
            content.smartTags.genres.forEach(genre => {
                if (preferences[`genre_${genre}`]) {
                    score += preferences[`genre_${genre}`];
                }
            });
        }

        // Score based on category
        if (content.type && preferences[`category_${content.type}`]) {
            score += preferences[`category_${content.type}`] * 1.5;
        }

        // Boost popular content slightly
        if (content.popularity) {
            score += Math.log(content.popularity + 1) * 0.1;
        }

        // Boost high-rated content
        if (content.vote_average) {
            score += content.vote_average * 0.5;
        }

        return score;
    }

    /**
     * Shuffle array (Fisher-Yates algorithm)
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Load user model from storage
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User model
     */
    async loadUserModel(userId) {
        try {
            // Try MongoDB first (historical data)
            if (this.mongo) {
                await this.mongo.connect();
                const model = await this.mongo.db.collection('user_rl_models').findOne({ userId });
                if (model) return model;
            }

            // Fallback to Firebase
            if (this.firebase) {
                const model = await this.firebase.db
                    .collection('user_rl_models')
                    .doc(userId)
                    .get();

                if (model.exists()) {
                    return model.data();
                }
            }

            // Return empty model
            return {
                userId: userId,
                qTable: {},
                preferences: {},
                sessionCount: 0,
                createdAt: new Date()
            };
        } catch (error) {
            console.error('Error loading user model:', error);
            return {
                userId: userId,
                qTable: {},
                preferences: {},
                sessionCount: 0,
                createdAt: new Date()
            };
        }
    }

    /**
     * Save user model to storage
     * @param {string} userId - User ID
     * @param {Object} userModel - User model
     * @returns {Promise<void>}
     */
    async saveUserModel(userId, userModel) {
        try {
            // Save to both storages
            const promises = [];

            if (this.firebase) {
                promises.push(
                    this.firebase.db
                        .collection('user_rl_models')
                        .doc(userId)
                        .set(userModel, { merge: true })
                );
            }

            if (this.mongo) {
                await this.mongo.connect();
                promises.push(
                    this.mongo.db.collection('user_rl_models').updateOne(
                        { userId: userId },
                        { $set: userModel },
                        { upsert: true }
                    )
                );
            }

            await Promise.all(promises);
            console.log('💾 User model saved');
        } catch (error) {
            console.error('Error saving user model:', error);
        }
    }

    /**
     * Get user insights
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User insights
     */
    async getUserInsights(userId) {
        const userModel = this.userModels.get(userId) || await this.loadUserModel(userId);

        if (!userModel.preferences) {
            return { message: 'No data available yet' };
        }

        // Top preferences
        const topPreferences = Object.entries(userModel.preferences)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([key, value]) => ({ preference: key, score: value }));

        // Most explored states
        const topStates = Object.entries(userModel.qTable || {})
            .map(([state, actions]) => ({
                state,
                bestAction: Object.entries(actions).sort(([, a], [, b]) => b - a)[0]
            }))
            .slice(0, 5);

        return {
            userId: userId,
            sessionCount: userModel.sessionCount,
            topPreferences: topPreferences,
            topStates: topStates,
            lastUpdated: userModel.lastUpdated
        };
    }

    /**
     * Adjust learning parameters based on performance
     * @param {number} performanceScore - Performance metric (0-1)
     */
    adjustLearningRate(performanceScore) {
        if (performanceScore < 0.5) {
            // Increase learning rate if performance is poor
            this.learningRate = Math.min(this.learningRate * 1.1, 0.5);
        } else {
            // Decrease learning rate if performance is good
            this.learningRate = Math.max(this.learningRate * 0.95, 0.01);
        }

        console.log(`📊 Learning rate adjusted to: ${this.learningRate.toFixed(3)}`);
    }
}

export default RLRecommendationEngine;
