/**
 * Firebase Storage Service
 * Manages enriched content in Firestore with vector search capabilities
 */

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export class FirebaseStorageService {
    constructor(config = {}) {
        // Initialize Firebase Admin if not already initialized
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: config.projectId || process.env.FIREBASE_PROJECT_ID || 'abitaca-8451c'
            });
        }

        this.db = admin.firestore();
        this.analytics = admin.analytics();

        // Collections
        this.contentCollection = 'anime_content';
        this.userPrefsCollection = 'user_preferences';
        this.searchHistoryCollection = 'search_history';
    }

    /**
     * Store enriched content in Firestore
     * @param {Object} enrichedContent - Enriched content from AI Tagging Service
     * @returns {Promise<string>} - Document ID
     */
    async storeContent(enrichedContent) {
        try {
            const docRef = this.db.collection(this.contentCollection).doc(enrichedContent.id);

            await docRef.set({
                ...enrichedContent,
                // Convert embedding array to FieldValue.vector for Firestore vector search
                embedding: FieldValue.vector(enrichedContent.embedding),
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });

            console.log(`✅ Stored in Firestore: ${enrichedContent.name}`);
            return enrichedContent.id;
        } catch (error) {
            console.error('Error storing content:', error);
            throw error;
        }
    }

    /**
     * Batch store multiple enriched contents
     * @param {Array} enrichedContents - Array of enriched contents
     * @returns {Promise<number>} - Number of successful stores
     */
    async storeBatch(enrichedContents) {
        const batch = this.db.batch();
        let count = 0;

        for (const content of enrichedContents) {
            try {
                const docRef = this.db.collection(this.contentCollection).doc(content.id);
                batch.set(docRef, {
                    ...content,
                    embedding: FieldValue.vector(content.embedding),
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                count++;
            } catch (error) {
                console.error(`Error adding ${content.name} to batch:`, error);
            }
        }

        await batch.commit();
        console.log(`✅ Batch stored ${count} items in Firestore`);
        return count;
    }

    /**
     * Vector search for similar content
     * @param {number[]} queryEmbedding - Query embedding vector
     * @param {number} limit - Number of results
     * @param {Object} filters - Additional filters (driveId, genres, etc)
     * @returns {Promise<Array>} - Similar content
     */
    async vectorSearch(queryEmbedding, limit = 10, filters = {}) {
        try {
            let query = this.db.collection(this.contentCollection);

            // Apply filters
            if (filters.driveId !== undefined) {
                query = query.where('driveId', '==', filters.driveId);
            }
            if (filters.genres && filters.genres.length > 0) {
                query = query.where('smartTags.genres', 'array-contains-any', filters.genres);
            }

            // Find nearest using vector field
            const vectorQuery = query.findNearest(
                'embedding',
                FieldValue.vector(queryEmbedding),
                {
                    limit: limit,
                    distanceMeasure: 'COSINE'
                }
            );

            const snapshot = await vectorQuery.get();
            const results = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    ...data,
                    // Don't return the actual embedding vector (too large)
                    embedding: undefined
                });
            });

            return results;
        } catch (error) {
            console.error('Error in vector search:', error);
            throw error;
        }
    }

    /**
     * Full-text search with smart tags
     * @param {string} query - Search query
     * @param {Object} filters - Filters
     * @returns {Promise<Array>} - Search results
     */
    async textSearch(query, filters = {}) {
        try {
            const searchTerms = query.toLowerCase().trim();
            let firestoreQuery = this.db.collection(this.contentCollection);

            // Apply filters
            if (filters.driveId !== undefined) {
                firestoreQuery = firestoreQuery.where('driveId', '==', filters.driveId);
            }

            // Search in searchText field
            firestoreQuery = firestoreQuery
                .where('searchText', '>=', searchTerms)
                .where('searchText', '<=', searchTerms + '\uf8ff')
                .limit(20);

            const snapshot = await firestoreQuery.get();
            const results = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    ...data,
                    embedding: undefined
                });
            });

            return results;
        } catch (error) {
            console.error('Error in text search:', error);
            throw error;
        }
    }

    /**
     * Get content by ID
     * @param {string} contentId - Content ID
     * @returns {Promise<Object|null>} - Content data
     */
    async getContent(contentId) {
        try {
            const docRef = this.db.collection(this.contentCollection).doc(contentId);
            const doc = await docRef.get();

            if (!doc.exists) {
                return null;
            }

            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                embedding: undefined // Don't return embedding
            };
        } catch (error) {
            console.error('Error getting content:', error);
            throw error;
        }
    }

    /**
     * Get content by drive ID
     * @param {number} driveId - Drive ID (0 for anime, 1 for movies)
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Content list
     */
    async getContentByDrive(driveId, limit = 50) {
        try {
            const snapshot = await this.db
                .collection(this.contentCollection)
                .where('driveId', '==', driveId)
                .limit(limit)
                .get();

            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    ...data,
                    embedding: undefined
                });
            });

            return results;
        } catch (error) {
            console.error('Error getting content by drive:', error);
            throw error;
        }
    }

    /**
     * Store user search history
     * @param {string} userId - User ID
     * @param {string} query - Search query
     * @param {Array} results - Search results
     * @returns {Promise<void>}
     */
    async storeSearchHistory(userId, query, results) {
        try {
            await this.db.collection(this.searchHistoryCollection).add({
                userId: userId,
                query: query,
                resultCount: results.length,
                timestamp: FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error storing search history:', error);
            // Don't throw - this shouldn't break the search
        }
    }

    /**
     * Get user preferences
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - User preferences
     */
    async getUserPreferences(userId) {
        try {
            const docRef = this.db.collection(this.userPrefsCollection).doc(userId);
            const doc = await docRef.get();

            if (!doc.exists) {
                // Return default preferences
                return {
                    favoriteGenres: [],
                    watchHistory: [],
                    preferences: {
                        language: 'pt-BR',
                        autoplay: true,
                        quality: 'auto'
                    }
                };
            }

            return doc.data();
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    /**
     * Update user preferences
     * @param {string} userId - User ID
     * @param {Object} preferences - Preferences to update
     * @returns {Promise<void>}
     */
    async updateUserPreferences(userId, preferences) {
        try {
            const docRef = this.db.collection(this.userPrefsCollection).doc(userId);
            await docRef.set(preferences, { merge: true });
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    /**
     * Add to watch history
     * @param {string} userId - User ID
     * @param {string} contentId - Content ID
     * @param {number} progress - Watch progress (0-100)
     * @returns {Promise<void>}
     */
    async addToWatchHistory(userId, contentId, progress = 0) {
        try {
            const docRef = this.db.collection(this.userPrefsCollection).doc(userId);
            await docRef.set({
                watchHistory: FieldValue.arrayUnion({
                    contentId: contentId,
                    progress: progress,
                    timestamp: new Date().toISOString()
                })
            }, { merge: true });
        } catch (error) {
            console.error('Error adding to watch history:', error);
            throw error;
        }
    }

    /**
     * Get personalized recommendations based on user history
     * @param {string} userId - User ID
     * @param {number} limit - Number of recommendations
     * @returns {Promise<Array>} - Recommended content
     */
    async getPersonalizedRecommendations(userId, limit = 10) {
        try {
            const userPrefs = await this.getUserPreferences(userId);

            if (!userPrefs.favoriteGenres || userPrefs.favoriteGenres.length === 0) {
                // Return popular content if no preferences
                return await this.getContentByDrive(1, limit);
            }

            // Get content matching user's favorite genres
            const snapshot = await this.db
                .collection(this.contentCollection)
                .where('smartTags.genres', 'array-contains-any', userPrefs.favoriteGenres)
                .limit(limit)
                .get();

            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    ...data,
                    embedding: undefined
                });
            });

            return results;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    /**
     * Create vector search index (run once during setup)
     * @returns {Promise<void>}
     */
    async createVectorIndex() {
        console.log('⚠️  Vector indexes must be created via Firebase Console or gcloud CLI');
        console.log('   Command: gcloud firestore indexes composite create \\');
        console.log('     --collection-group=anime_content \\');
        console.log('     --field-config field-path=embedding,vector-config=\'{"dimension":1024,"flat": {}}\' \\');
        console.log('     --project=abitaca-8451c');
    }
}

export default FirebaseStorageService;
