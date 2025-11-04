/**
 * MongoDB Vector Service
 * Advanced vector search and recommendations using MongoDB Atlas
 */

import { MongoClient } from 'mongodb';

export class MongoDBVectorService {
    constructor(config = {}) {
        this.uri = config.mongoUri || process.env.MONGODB_URI;
        this.dbName = config.dbName || 'bitaca_play';
        this.collectionName = config.collectionName || 'anime_content';
        this.client = null;
        this.db = null;
        this.collection = null;
    }

    /**
     * Connect to MongoDB Atlas
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.client) {
            return; // Already connected
        }

        try {
            this.client = new MongoClient(this.uri, {
                maxPoolSize: 10,
                minPoolSize: 2,
                serverSelectionTimeoutMS: 5000
            });

            await this.client.connect();
            this.db = this.client.db(this.dbName);
            this.collection = this.db.collection(this.collectionName);

            console.log('✅ Connected to MongoDB Atlas');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            console.log('Disconnected from MongoDB');
        }
    }

    /**
     * Create vector search index (run once during setup)
     * @returns {Promise<void>}
     */
    async createVectorSearchIndex() {
        try {
            await this.connect();

            const indexDefinition = {
                name: 'vector_search_index',
                type: 'vectorSearch',
                definition: {
                    fields: [
                        {
                            type: 'vector',
                            numDimensions: 1024,
                            path: 'embedding',
                            similarity: 'cosine'
                        },
                        {
                            type: 'filter',
                            path: 'driveId'
                        },
                        {
                            type: 'filter',
                            path: 'smartTags.genres'
                        }
                    ]
                }
            };

            await this.collection.createSearchIndex(indexDefinition);
            console.log('✅ Vector search index created');

            // Wait for index to become queryable
            console.log('⏳ Waiting for index to become queryable...');
            let isQueryable = false;
            while (!isQueryable) {
                const indexes = await this.collection.listSearchIndexes().toArray();
                const index = indexes.find(idx => idx.name === 'vector_search_index');
                if (index && index.queryable) {
                    isQueryable = true;
                    console.log('✅ Index is ready for queries');
                } else {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        } catch (error) {
            console.error('Error creating vector search index:', error);
            throw error;
        }
    }

    /**
     * Store enriched content in MongoDB
     * @param {Object} enrichedContent - Enriched content from AI Tagging Service
     * @returns {Promise<string>} - Inserted document ID
     */
    async storeContent(enrichedContent) {
        try {
            await this.connect();

            const result = await this.collection.insertOne({
                ...enrichedContent,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log(`✅ Stored in MongoDB: ${enrichedContent.name}`);
            return result.insertedId.toString();
        } catch (error) {
            // If document already exists, update it
            if (error.code === 11000) {
                await this.collection.updateOne(
                    { id: enrichedContent.id },
                    { $set: { ...enrichedContent, updatedAt: new Date() } }
                );
                return enrichedContent.id;
            }
            console.error('Error storing content:', error);
            throw error;
        }
    }

    /**
     * Batch insert enriched contents
     * @param {Array} enrichedContents - Array of enriched contents
     * @returns {Promise<number>} - Number of inserted documents
     */
    async storeBatch(enrichedContents) {
        try {
            await this.connect();

            const result = await this.collection.insertMany(enrichedContents, {
                ordered: false // Continue on duplicate key errors
            });

            console.log(`✅ Batch stored ${result.insertedCount} items in MongoDB`);
            return result.insertedCount;
        } catch (error) {
            if (error.code === 11000) {
                // Some duplicates, that's ok
                const insertedCount = Object.keys(error.result.insertedIds).length;
                console.log(`✅ Batch stored ${insertedCount} items (some duplicates skipped)`);
                return insertedCount;
            }
            console.error('Error in batch store:', error);
            throw error;
        }
    }

    /**
     * Vector search using MongoDB Atlas vector search
     * @param {number[]} queryEmbedding - Query embedding vector
     * @param {number} limit - Number of results
     * @param {Object} filters - Filters (driveId, genres, etc)
     * @returns {Promise<Array>} - Similar content with scores
     */
    async vectorSearch(queryEmbedding, limit = 10, filters = {}) {
        try {
            await this.connect();

            const pipeline = [
                {
                    $vectorSearch: {
                        index: 'vector_search_index',
                        path: 'embedding',
                        queryVector: queryEmbedding,
                        numCandidates: limit * 10,
                        limit: limit
                    }
                },
                {
                    $addFields: {
                        score: { $meta: 'vectorSearchScore' }
                    }
                }
            ];

            // Add filters
            if (filters.driveId !== undefined || (filters.genres && filters.genres.length > 0)) {
                const matchStage = { $match: {} };

                if (filters.driveId !== undefined) {
                    matchStage.$match.driveId = filters.driveId;
                }
                if (filters.genres && filters.genres.length > 0) {
                    matchStage.$match['smartTags.genres'] = { $in: filters.genres };
                }

                pipeline.splice(1, 0, matchStage);
            }

            // Project to exclude embedding from results
            pipeline.push({
                $project: {
                    embedding: 0
                }
            });

            const results = await this.collection.aggregate(pipeline).toArray();
            return results;
        } catch (error) {
            console.error('Error in vector search:', error);
            throw error;
        }
    }

    /**
     * Hybrid search: combine vector search with text search
     * @param {string} textQuery - Text search query
     * @param {number[]} queryEmbedding - Query embedding
     * @param {number} limit - Number of results
     * @param {Object} filters - Filters
     * @returns {Promise<Array>} - Hybrid search results
     */
    async hybridSearch(textQuery, queryEmbedding, limit = 10, filters = {}) {
        try {
            await this.connect();

            // Get vector search results
            const vectorResults = await this.vectorSearch(queryEmbedding, limit, filters);

            // Get text search results
            const textResults = await this.collection.aggregate([
                {
                    $match: {
                        searchText: { $regex: textQuery.toLowerCase(), $options: 'i' }
                    }
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        embedding: 0
                    }
                }
            ]).toArray();

            // Merge and deduplicate results
            const mergedResults = [...vectorResults];
            const seenIds = new Set(vectorResults.map(r => r.id));

            for (const result of textResults) {
                if (!seenIds.has(result.id)) {
                    mergedResults.push({ ...result, score: 0.5 }); // Lower score for text-only matches
                    seenIds.add(result.id);
                }
            }

            // Sort by score
            mergedResults.sort((a, b) => (b.score || 0) - (a.score || 0));

            return mergedResults.slice(0, limit);
        } catch (error) {
            console.error('Error in hybrid search:', error);
            throw error;
        }
    }

    /**
     * Get personalized recommendations based on user's watch history and preferences
     * @param {string} userId - User ID
     * @param {Array} watchHistory - User's watch history (array of content IDs)
     * @param {Array} favoriteGenres - User's favorite genres
     * @param {number} limit - Number of recommendations
     * @returns {Promise<Array>} - Recommended content
     */
    async getPersonalizedRecommendations(userId, watchHistory = [], favoriteGenres = [], limit = 10) {
        try {
            await this.connect();

            // If user has watch history, find similar content
            if (watchHistory.length > 0) {
                // Get embeddings of watched content
                const watchedContent = await this.collection.find({
                    id: { $in: watchHistory }
                }).toArray();

                if (watchedContent.length > 0) {
                    // Calculate average embedding
                    const avgEmbedding = this.calculateAverageEmbedding(
                        watchedContent.map(c => c.embedding)
                    );

                    // Find similar content, excluding already watched
                    return await this.collection.aggregate([
                        {
                            $vectorSearch: {
                                index: 'vector_search_index',
                                path: 'embedding',
                                queryVector: avgEmbedding,
                                numCandidates: limit * 10,
                                limit: limit * 2
                            }
                        },
                        {
                            $match: {
                                id: { $nin: watchHistory }
                            }
                        },
                        {
                            $addFields: {
                                score: { $meta: 'vectorSearchScore' }
                            }
                        },
                        {
                            $limit: limit
                        },
                        {
                            $project: {
                                embedding: 0
                            }
                        }
                    ]).toArray();
                }
            }

            // If no watch history, recommend based on favorite genres
            if (favoriteGenres.length > 0) {
                return await this.collection.aggregate([
                    {
                        $match: {
                            'smartTags.genres': { $in: favoriteGenres }
                        }
                    },
                    {
                        $sample: { size: limit }
                    },
                    {
                        $project: {
                            embedding: 0
                        }
                    }
                ]).toArray();
            }

            // Default: return popular/recent content
            return await this.collection.find()
                .sort({ modifiedTime: -1 })
                .limit(limit)
                .project({ embedding: 0 })
                .toArray();
        } catch (error) {
            console.error('Error getting personalized recommendations:', error);
            throw error;
        }
    }

    /**
     * Get analytics: most popular genres
     * @returns {Promise<Array>} - Genre statistics
     */
    async getPopularGenres() {
        try {
            await this.connect();

            return await this.collection.aggregate([
                { $unwind: '$smartTags.genres' },
                {
                    $group: {
                        _id: '$smartTags.genres',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]).toArray();
        } catch (error) {
            console.error('Error getting popular genres:', error);
            throw error;
        }
    }

    /**
     * Get content by genre
     * @param {string} genre - Genre name
     * @param {number} limit - Max results
     * @returns {Promise<Array>} - Content list
     */
    async getByGenre(genre, limit = 20) {
        try {
            await this.connect();

            return await this.collection.find({
                'smartTags.genres': genre
            })
                .limit(limit)
                .project({ embedding: 0 })
                .toArray();
        } catch (error) {
            console.error('Error getting content by genre:', error);
            throw error;
        }
    }

    /**
     * Calculate average embedding from multiple embeddings
     * @param {Array<number[]>} embeddings - Array of embedding vectors
     * @returns {number[]} - Average embedding
     */
    calculateAverageEmbedding(embeddings) {
        if (embeddings.length === 0) {
            throw new Error('Cannot calculate average of empty embeddings array');
        }

        const dimensions = embeddings[0].length;
        const avgEmbedding = new Array(dimensions).fill(0);

        for (const embedding of embeddings) {
            for (let i = 0; i < dimensions; i++) {
                avgEmbedding[i] += embedding[i];
            }
        }

        for (let i = 0; i < dimensions; i++) {
            avgEmbedding[i] /= embeddings.length;
        }

        return avgEmbedding;
    }

    /**
     * Get statistics about the collection
     * @returns {Promise<Object>} - Collection statistics
     */
    async getStats() {
        try {
            await this.connect();

            const [totalCount, driveStats, genreStats] = await Promise.all([
                this.collection.countDocuments(),
                this.collection.aggregate([
                    {
                        $group: {
                            _id: '$driveId',
                            count: { $sum: 1 }
                        }
                    }
                ]).toArray(),
                this.getPopularGenres()
            ]);

            return {
                totalContent: totalCount,
                byDrive: driveStats,
                topGenres: genreStats.slice(0, 10)
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }
}

export default MongoDBVectorService;
