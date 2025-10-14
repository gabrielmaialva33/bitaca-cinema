/**
 * Content Matcher Service
 * Matches TMDB metadata with AnimeZey actual content
 * Creates a hybrid catalog with rich metadata + streaming URLs
 */

export class ContentMatcherService {
    constructor(tmdbService, animezeyAPI) {
        this.tmdb = tmdbService;
        this.animezey = animezeyAPI;
        this.matchCache = new Map(); // Cache matches to avoid re-searching
    }

    /**
     * Find matches for TMDB content in AnimeZey
     * @param {Array} tmdbItems - Items from TMDB
     * @param {number} driveId - AnimeZey drive (0=anime, 1=movies)
     * @returns {Promise<Array>} Matched content
     */
    async findMatches(tmdbItems, driveId = 1) {
        console.log(`🔍 Finding matches for ${tmdbItems.length} TMDB items in AnimeZey Drive ${driveId}...`);

        const matches = [];

        for (const tmdbItem of tmdbItems) {
            // Check cache first
            const cacheKey = `${tmdbItem.tmdb_id}_${driveId}`;
            if (this.matchCache.has(cacheKey)) {
                matches.push(this.matchCache.get(cacheKey));
                continue;
            }

            try {
                const match = await this.findSingleMatch(tmdbItem, driveId);
                if (match) {
                    this.matchCache.set(cacheKey, match);
                    matches.push(match);
                }
            } catch (error) {
                console.error(`Error matching ${tmdbItem.title}:`, error);
            }

            // Rate limiting - wait 500ms between searches
            await this.sleep(500);
        }

        console.log(`✅ Found ${matches.length}/${tmdbItems.length} matches`);
        return matches;
    }

    /**
     * Find a single match for TMDB item
     * @param {Object} tmdbItem - TMDB item
     * @param {number} driveId - Drive ID
     * @returns {Promise<Object|null>} Match or null
     */
    async findSingleMatch(tmdbItem, driveId) {
        const searchVariations = tmdbItem.searchVariations || [];

        console.log(`  Trying to match: ${tmdbItem.title}`);
        console.log(`  Search variations: ${searchVariations.slice(0, 3).join(', ')}...`);

        let bestMatch = null;
        let bestScore = 0;

        // Try each search variation
        for (const variation of searchVariations) {
            try {
                const results = await this.animezey.search(variation, driveId);

                if (!results || results.length === 0) continue;

                // Calculate match scores for all results
                for (const result of results.slice(0, 5)) {
                    const score = this.calculateMatchScore(tmdbItem, result);

                    if (score > bestScore && score > 0.5) { // Minimum 50% match
                        bestScore = score;
                        bestMatch = result;
                    }
                }

                // If we found a good match (>80%), stop searching
                if (bestScore > 0.8) break;

            } catch (error) {
                console.error(`Error searching variation "${variation}":`, error);
            }
        }

        if (bestMatch) {
            console.log(`  ✓ Match found: ${bestMatch.name} (score: ${(bestScore * 100).toFixed(1)}%)`);

            // Merge TMDB metadata with AnimeZey content
            return this.mergeMetadata(tmdbItem, bestMatch, bestScore);
        } else {
            console.log(`  ✗ No match found`);
            return null;
        }
    }

    /**
     * Calculate match score between TMDB item and AnimeZey result
     * @param {Object} tmdbItem - TMDB item
     * @param {Object} animezeyResult - AnimeZey result
     * @returns {number} Match score (0-1)
     */
    calculateMatchScore(tmdbItem, animezeyResult) {
        const tmdbTitle = (tmdbItem.title || tmdbItem.original_title || '').toLowerCase();
        const animezeyTitle = (animezeyResult.name || '').toLowerCase();

        // Calculate string similarity
        const similarity = this.stringSimilarity(tmdbTitle, animezeyTitle);

        // Bonus points for year match
        let yearBonus = 0;
        const tmdbYear = this.extractYear(tmdbItem.release_date || tmdbItem.first_air_date);
        const animezeyYear = this.extractYear(animezeyResult.name);

        if (tmdbYear && animezeyYear && Math.abs(tmdbYear - animezeyYear) <= 1) {
            yearBonus = 0.1;
        }

        // Bonus for exact word matches
        const tmdbWords = this.getSignificantWords(tmdbTitle);
        const animezeyWords = this.getSignificantWords(animezeyTitle);
        const commonWords = tmdbWords.filter(w => animezeyWords.includes(w));
        const wordMatchBonus = (commonWords.length / Math.max(tmdbWords.length, 1)) * 0.2;

        return Math.min(similarity + yearBonus + wordMatchBonus, 1.0);
    }

    /**
     * Calculate string similarity (Levenshtein distance normalized)
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity (0-1)
     */
    stringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Extract year from string
     * @param {string} str - String containing year
     * @returns {number|null} Year or null
     */
    extractYear(str) {
        if (!str) return null;
        const match = str.match(/\b(19|20)\d{2}\b/);
        return match ? parseInt(match[0]) : null;
    }

    /**
     * Get significant words (>3 chars, not common words)
     * @param {string} str - Input string
     * @returns {Array<string>} Significant words
     */
    getSignificantWords(str) {
        const commonWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that']);
        return str
            .split(/\s+/)
            .map(w => w.replace(/[^\w]/g, ''))
            .filter(w => w.length > 3 && !commonWords.has(w));
    }

    /**
     * Merge TMDB metadata with AnimeZey content
     * @param {Object} tmdbItem - TMDB item
     * @param {Object} animezeyResult - AnimeZey result
     * @param {number} matchScore - Match score
     * @returns {Object} Merged content
     */
    mergeMetadata(tmdbItem, animezeyResult, matchScore) {
        return {
            // AnimeZey streaming data
            id: animezeyResult.id,
            streamingUrl: animezeyResult.url,
            path: animezeyResult.path,
            size: animezeyResult.size,
            mimeType: animezeyResult.mimeType,
            driveId: animezeyResult.driveId,

            // TMDB rich metadata
            tmdb_id: tmdbItem.tmdb_id,
            type: tmdbItem.type,
            title: tmdbItem.title,
            original_title: tmdbItem.original_title,
            overview: tmdbItem.overview,
            poster_path: tmdbItem.poster_path,
            backdrop_path: tmdbItem.backdrop_path,
            release_date: tmdbItem.release_date || tmdbItem.first_air_date,
            popularity: tmdbItem.popularity,
            vote_average: tmdbItem.vote_average,
            genre_ids: tmdbItem.genre_ids,

            // Match metadata
            matchScore: matchScore,
            matchedFilename: animezeyResult.name,
            hasStreamingUrl: true,

            // For display
            thumbnail: tmdbItem.poster_path || animezeyResult.thumbnail,
            name: tmdbItem.title,
            description: tmdbItem.overview
        };
    }

    /**
     * Get personalized content based on user preferences
     * @param {Array} favoriteGenres - User's favorite genres
     * @param {number} limit - Max results per genre
     * @returns {Promise<Object>} Matched content
     */
    async getPersonalizedMatches(favoriteGenres, limit = 10) {
        console.log('🎯 Getting personalized matches for:', favoriteGenres);

        try {
            // Get TMDB recommendations
            const tmdbRecommendations = await this.tmdb.getRecommendationsByPreferences(favoriteGenres, limit);

            // Match with AnimeZey
            const [movieMatches, tvMatches, animeMatches] = await Promise.all([
                this.findMatches(tmdbRecommendations.movies, 1), // Drive 1 for movies
                this.findMatches(tmdbRecommendations.tv, 1),     // Drive 1 for TV
                this.findMatches(tmdbRecommendations.anime, 0)   // Drive 0 for anime
            ]);

            const result = {
                movies: movieMatches,
                tv: tvMatches,
                anime: animeMatches,
                total: movieMatches.length + tvMatches.length + animeMatches.length
            };

            console.log('✅ Personalized matches:', {
                movies: result.movies.length,
                tv: result.tv.length,
                anime: result.anime.length,
                total: result.total
            });

            return result;
        } catch (error) {
            console.error('Error getting personalized matches:', error);
            return { movies: [], tv: [], anime: [], total: 0 };
        }
    }

    /**
     * Search for content with TMDB enrichment
     * @param {string} query - Search query
     * @param {number} driveId - AnimeZey drive
     * @returns {Promise<Array>} Enriched results
     */
    async searchWithEnrichment(query, driveId = 1) {
        try {
            // Search TMDB first
            const tmdbResults = await this.tmdb.search(query);

            if (tmdbResults.length > 0) {
                // Try to match with AnimeZey
                return await this.findMatches(tmdbResults.slice(0, 10), driveId);
            }

            // If no TMDB results, search AnimeZey directly
            return await this.animezey.search(query, driveId);
        } catch (error) {
            console.error('Error in enriched search:', error);
            return [];
        }
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear match cache
     */
    clearCache() {
        this.matchCache.clear();
        console.log('Match cache cleared');
    }

    /**
     * Get cache stats
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.matchCache.size,
            keys: Array.from(this.matchCache.keys()).slice(0, 10)
        };
    }
}

export default ContentMatcherService;
