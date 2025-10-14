/**
 * TMDB API Integration
 * Fetches movie/TV show metadata and images
 */

class TmdbAPI {
    constructor() {
        this.apiKey = 'c52d98b4fbf4b91185d02cae59ce1ba5';
        this.readToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNTJkOThiNGZiZjRiOTExODVkMDJjYWU1OWNlMWJhNSIsIm5iZiI6MTc2MDQwMDkyMy4xOTI5OTk4LCJzdWIiOiI2OGVkOTYxYjdhYWY2ODY2YTdhMjE5OGMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.J8fUOAv115nK2iGFIDzs9bKDP8ZL9HLqPBBY8ELGYN8';
        this.baseURL = 'https://api.themoviedb.org/3';
        this.imageBaseURL = 'https://image.tmdb.org/t/p';
        this.cache = new Map();
        this.language = 'pt-BR';
    }

    /**
     * Make API request to TMDB
     */
    async request(endpoint, params = {}) {
        const queryParams = new URLSearchParams({
            api_key: this.apiKey,
            language: this.language,
            ...params
        });

        const url = `${this.baseURL}${endpoint}?${queryParams}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.readToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('TMDB API request failed:', error);
            return null;
        }
    }

    /**
     * Search for content by name
     */
    async search(query) {
        const cacheKey = `search_${query}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const data = await this.request('/search/multi', { query });

        if (data && data.results) {
            this.cache.set(cacheKey, data.results);
            return data.results;
        }

        return [];
    }

    /**
     * Get image URL with specified size
     * @param {string} path - Image path from TMDB
     * @param {string} size - Size (w185, w300, w500, w780, original)
     */
    getImageURL(path, size = 'w500') {
        if (!path) return null;
        return `${this.imageBaseURL}/${size}${path}`;
    }

    /**
     * Get poster URL
     */
    getPosterURL(path, size = 'w500') {
        return this.getImageURL(path, size);
    }

    /**
     * Get backdrop URL
     */
    getBackdropURL(path, size = 'w780') {
        return this.getImageURL(path, size);
    }

    /**
     * Extract clean title from video name
     * Removes season/episode info, quality tags, etc.
     */
    extractCleanTitle(videoName) {
        let title = videoName;

        // Remove common anime/video tags
        title = title
            .replace(/\[.*?\]/g, '') // Remove [tags]
            .replace(/\(.*?\)/g, '') // Remove (tags)
            .replace(/S\d+E\d+/gi, '') // Remove S01E01 format
            .replace(/Season\s+\d+/gi, '') // Remove Season X
            .replace(/Episode\s+\d+/gi, '') // Remove Episode X
            .replace(/\d{3,4}p/gi, '') // Remove quality tags (1080p, 720p)
            .replace(/BluRay|WEB-?DL|HDTV|x264|x265|HEVC/gi, '') // Remove encoding tags
            .replace(/-\s*$/, '') // Remove trailing dashes
            .trim();

        return title;
    }

    /**
     * Get metadata for a video
     * Returns best match from TMDB
     */
    async getMetadataForVideo(videoName) {
        const cacheKey = `video_${videoName}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const cleanTitle = this.extractCleanTitle(videoName);
        const results = await this.search(cleanTitle);

        if (!results || results.length === 0) {
            return null;
        }

        // Get first result (best match)
        const match = results[0];

        const metadata = {
            id: match.id,
            title: match.title || match.name,
            originalTitle: match.original_title || match.original_name,
            overview: match.overview,
            releaseDate: match.release_date || match.first_air_date,
            posterPath: match.poster_path,
            backdropPath: match.backdrop_path,
            posterURL: this.getPosterURL(match.poster_path),
            backdropURL: this.getBackdropURL(match.backdrop_path),
            voteAverage: match.vote_average,
            voteCount: match.vote_count,
            popularity: match.popularity,
            mediaType: match.media_type, // 'movie' or 'tv'
            genreIds: match.genre_ids || []
        };

        this.cache.set(cacheKey, metadata);
        return metadata;
    }

    /**
     * Batch get metadata for multiple videos
     */
    async batchGetMetadata(videoNames) {
        const promises = videoNames.map(name => this.getMetadataForVideo(name));
        const results = await Promise.allSettled(promises);

        return results.map((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                return { video: videoNames[index], metadata: result.value };
            }
            return { video: videoNames[index], metadata: null };
        });
    }

    /**
     * Get placeholder image for failed loads
     */
    getPlaceholderImage() {
        return 'https://images.unsplash.com/photo-1574267432644-f74f3d76d53a?w=500&h=750&fit=crop';
    }
}

// Export for use in other modules
window.tmdbAPI = new TmdbAPI();
console.log('TMDB API initialized');
