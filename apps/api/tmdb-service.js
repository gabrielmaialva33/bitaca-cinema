/**
 * TMDB (The Movie Database) Service
 * Integrates with TMDB API to discover popular movies/shows
 * Generates smart search queries for AnimeZey
 */

import fetch from 'node-fetch';

export class TMDBService {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.TMDB_API_KEY || 'c52d98b4fbf4b91185d02cae59ce1ba5';
        this.bearerToken = config.bearerToken || process.env.TMDB_BEARER_TOKEN ||
            'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNTJkOThiNGZiZjRiOTExODVkMDJjYWU1OWNlMWJhNSIsIm5iZiI6MTc2MDQwMDkyMy4xOTI5OTk4LCJzdWIiOiI2OGVkOTYxYjdhYWY2ODY2YTdhMjE5OGMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.J8fUOAv115nK2iGFIDzs9bKDP8ZL9HLqPBBY8ELGYN8';
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p';

        // Genre mapping: User selection → TMDB genre IDs
        this.genreMapping = {
            // User genres → TMDB IDs
            'action': 28,        // Action
            'adventure': 12,     // Adventure
            'comedy': 35,        // Comedy
            'drama': 18,         // Drama
            'fantasy': 14,       // Fantasy
            'horror': 27,        // Horror
            'mystery': 9648,     // Mystery
            'romance': 10749,    // Romance
            'sci-fi': 878,       // Science Fiction
            'thriller': 53,      // Thriller
            'animation': 16,     // Animation (for anime)
            'family': 10751      // Family
        };
    }

    /**
     * Get authorization headers for TMDB API
     * @returns {Object} Headers
     */
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json;charset=utf-8'
        };
    }

    /**
     * Search movies by genre
     * @param {string} genreName - Genre name from user preferences
     * @param {number} page - Page number
     * @returns {Promise<Array>} Movies
     */
    async searchMoviesByGenre(genreName, page = 1) {
        const genreId = this.genreMapping[genreName.toLowerCase()];
        if (!genreId) {
            console.warn(`Genre "${genreName}" not mapped to TMDB`);
            return [];
        }

        try {
            const url = `${this.baseUrl}/discover/movie?with_genres=${genreId}&page=${page}&sort_by=popularity.desc&language=pt-BR`;
            const response = await fetch(url, { headers: this.getHeaders() });

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseMovieResults(data.results || []);
        } catch (error) {
            console.error(`Error searching movies by genre ${genreName}:`, error);
            return [];
        }
    }

    /**
     * Search TV shows by genre
     * @param {string} genreName - Genre name
     * @param {number} page - Page number
     * @returns {Promise<Array>} TV shows
     */
    async searchTVByGenre(genreName, page = 1) {
        const genreId = this.genreMapping[genreName.toLowerCase()];
        if (!genreId) return [];

        try {
            const url = `${this.baseUrl}/discover/tv?with_genres=${genreId}&page=${page}&sort_by=popularity.desc&language=pt-BR`;
            const response = await fetch(url, { headers: this.getHeaders() });

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseTVResults(data.results || []);
        } catch (error) {
            console.error(`Error searching TV by genre ${genreName}:`, error);
            return [];
        }
    }

    /**
     * Get popular anime (animation genre movies/TV)
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Anime results
     */
    async getPopularAnime(limit = 20) {
        try {
            // Search for animation genre (which includes anime)
            const movies = await this.searchMoviesByGenre('animation', 1);
            const tv = await this.searchTVByGenre('animation', 1);

            // Combine and filter for anime-like titles
            const combined = [...movies, ...tv]
                .filter(item => this.isLikelyAnime(item))
                .slice(0, limit);

            return combined;
        } catch (error) {
            console.error('Error getting popular anime:', error);
            return [];
        }
    }

    /**
     * Check if a title is likely anime
     * @param {Object} item - TMDB item
     * @returns {boolean}
     */
    isLikelyAnime(item) {
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();

        // Check for anime indicators
        const animeKeywords = ['anime', 'manga', 'japan', 'tokyo', 'ninja', 'samurai', 'dragon ball', 'naruto', 'one piece'];
        return animeKeywords.some(keyword =>
            title.includes(keyword) || overview.includes(keyword)
        ) || item.origin_country?.includes('JP');
    }

    /**
     * Parse movie results from TMDB
     * @param {Array} results - TMDB movie results
     * @returns {Array} Parsed movies
     */
    parseMovieResults(results) {
        return results.map(movie => ({
            tmdb_id: movie.id,
            type: 'movie',
            title: movie.title,
            original_title: movie.original_title,
            overview: movie.overview,
            release_date: movie.release_date,
            poster_path: movie.poster_path ? `${this.imageBaseUrl}/w500${movie.poster_path}` : null,
            backdrop_path: movie.backdrop_path ? `${this.imageBaseUrl}/original${movie.backdrop_path}` : null,
            popularity: movie.popularity,
            vote_average: movie.vote_average,
            genre_ids: movie.genre_ids,
            // Generate search variations for AnimeZey
            searchVariations: this.generateSearchVariations(movie.title, movie.original_title)
        }));
    }

    /**
     * Parse TV show results from TMDB
     * @param {Array} results - TMDB TV results
     * @returns {Array} Parsed TV shows
     */
    parseTVResults(results) {
        return results.map(show => ({
            tmdb_id: show.id,
            type: 'tv',
            title: show.name,
            original_title: show.original_name,
            overview: show.overview,
            first_air_date: show.first_air_date,
            poster_path: show.poster_path ? `${this.imageBaseUrl}/w500${show.poster_path}` : null,
            backdrop_path: show.backdrop_path ? `${this.imageBaseUrl}/original${show.backdrop_path}` : null,
            popularity: show.popularity,
            vote_average: show.vote_average,
            genre_ids: show.genre_ids,
            origin_country: show.origin_country,
            // Generate search variations
            searchVariations: this.generateSearchVariations(show.name, show.original_name)
        }));
    }

    /**
     * Generate smart search variations for finding content in AnimeZey
     * @param {string} title - Translated title
     * @param {string} originalTitle - Original title
     * @returns {Array<string>} Search variations
     */
    generateSearchVariations(title, originalTitle) {
        const variations = new Set();

        // Add original titles
        variations.add(title);
        if (originalTitle && originalTitle !== title) {
            variations.add(originalTitle);
        }

        // Remove special characters and clean
        const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
        variations.add(cleanTitle);

        // Split into words and add significant words (>3 chars)
        const words = cleanTitle.split(/\s+/).filter(w => w.length > 3);
        words.forEach(word => variations.add(word));

        // Add combinations of first 2-3 words
        if (words.length >= 2) {
            variations.add(words.slice(0, 2).join(' '));
        }
        if (words.length >= 3) {
            variations.add(words.slice(0, 3).join(' '));
        }

        // Remove empty strings
        return Array.from(variations).filter(v => v && v.trim().length > 0);
    }

    /**
     * Get content recommendations based on user preferences
     * @param {Array} favoriteGenres - User's favorite genres
     * @param {number} itemsPerGenre - Items to fetch per genre
     * @returns {Promise<Object>} Recommendations by genre
     */
    async getRecommendationsByPreferences(favoriteGenres, itemsPerGenre = 10) {
        console.log('🎯 Getting TMDB recommendations for genres:', favoriteGenres);

        const recommendations = {
            movies: [],
            tv: [],
            anime: []
        };

        try {
            // Fetch content for each favorite genre
            for (const genre of favoriteGenres) {
                const [movies, tvShows] = await Promise.all([
                    this.searchMoviesByGenre(genre, 1),
                    this.searchTVByGenre(genre, 1)
                ]);

                recommendations.movies.push(...movies.slice(0, itemsPerGenre));
                recommendations.tv.push(...tvShows.slice(0, itemsPerGenre));
            }

            // Get anime if animation is in preferences
            if (favoriteGenres.includes('animation') || favoriteGenres.some(g => ['fantasy', 'sci-fi', 'adventure'].includes(g))) {
                recommendations.anime = await this.getPopularAnime(20);
            }

            // Deduplicate by TMDB ID
            recommendations.movies = this.deduplicateById(recommendations.movies);
            recommendations.tv = this.deduplicateById(recommendations.tv);

            console.log('✅ TMDB Recommendations:', {
                movies: recommendations.movies.length,
                tv: recommendations.tv.length,
                anime: recommendations.anime.length
            });

            return recommendations;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return recommendations;
        }
    }

    /**
     * Deduplicate array by tmdb_id
     * @param {Array} items - Items to deduplicate
     * @returns {Array} Deduplicated items
     */
    deduplicateById(items) {
        const seen = new Set();
        return items.filter(item => {
            if (seen.has(item.tmdb_id)) {
                return false;
            }
            seen.add(item.tmdb_id);
            return true;
        });
    }

    /**
     * Search for a specific title
     * @param {string} query - Search query
     * @param {string} type - 'movie', 'tv', or 'multi'
     * @returns {Promise<Array>} Search results
     */
    async search(query, type = 'multi') {
        try {
            const endpoint = type === 'multi' ? 'search/multi' : `search/${type}`;
            const url = `${this.baseUrl}/${endpoint}?query=${encodeURIComponent(query)}&language=pt-BR`;
            const response = await fetch(url, { headers: this.getHeaders() });

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status}`);
            }

            const data = await response.json();
            const results = data.results || [];

            // Parse based on type
            return results.map(item => {
                if (item.media_type === 'movie' || type === 'movie') {
                    return this.parseMovieResults([item])[0];
                } else if (item.media_type === 'tv' || type === 'tv') {
                    return this.parseTVResults([item])[0];
                }
                return null;
            }).filter(Boolean);
        } catch (error) {
            console.error(`Error searching for "${query}":`, error);
            return [];
        }
    }

    /**
     * Get trending content
     * @param {string} mediaType - 'movie', 'tv', or 'all'
     * @param {string} timeWindow - 'day' or 'week'
     * @returns {Promise<Array>} Trending content
     */
    async getTrending(mediaType = 'all', timeWindow = 'week') {
        try {
            const url = `${this.baseUrl}/trending/${mediaType}/${timeWindow}?language=pt-BR`;
            const response = await fetch(url, { headers: this.getHeaders() });

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status}`);
            }

            const data = await response.json();
            const results = data.results || [];

            return results.map(item => {
                if (item.media_type === 'movie') {
                    return this.parseMovieResults([item])[0];
                } else if (item.media_type === 'tv') {
                    return this.parseTVResults([item])[0];
                }
                return null;
            }).filter(Boolean);
        } catch (error) {
            console.error('Error getting trending:', error);
            return [];
        }
    }
}

export default TMDBService;
