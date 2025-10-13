/**
 * AnimeZeY API Client
 * Integration with Google Drive Index
 * Based on mahina-bot implementation
 */

export class AnimeZeyAPI {
    constructor() {
        this.baseUrl = 'https://animezey16082023.animezey16082023.workers.dev';
        this.drives = [
            { id: 0, name: 'AnimeZeY - Animes e Desenhos', path: '/0:' },
            { id: 1, name: 'AnimeZeY - Filmes e Séries', path: '/1:' }
        ];
        this.sessionHeaders = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Content-Type': 'application/json',
            'Accept': '*/*'
        };
    }

    /**
     * Make a request to AnimeZey API
     */
    async request(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: this.sessionHeaders
            };

            if (data && method === 'POST') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(this.baseUrl + endpoint, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('AnimeZey API error:', error);
            return null;
        }
    }

    /**
     * Search for anime (Drive 0)
     * @param {string} query - Search query
     * @param {string|null} pageToken - Pagination token
     * @returns {Promise<Object>} Search results with files array
     */
    async searchAnime(query, pageToken = null) {
        const response = await this.request('/0:search', 'POST', {
            q: query,
            page_token: pageToken,
            page_index: 0
        });

        return this.parseSearchResponse(response);
    }

    /**
     * Search for movies/series (Drive 1)
     * @param {string} query - Search query
     * @param {string|null} pageToken - Pagination token
     * @returns {Promise<Object>} Search results with files array
     */
    async searchMovie(query, pageToken = null) {
        const response = await this.request('/1:search', 'POST', {
            q: query,
            page_token: pageToken,
            page_index: 0
        });

        return this.parseSearchResponse(response);
    }

    /**
     * Search across all drives
     * @param {string} query - Search query
     * @param {number} driveId - Drive ID (0 for anime, 1 for movies)
     * @returns {Promise<Array>} Formatted video results
     */
    async search(query, driveId = 1) {
        console.log(`🔍 Searching in drive ${driveId}:`, query);

        let response;
        if (driveId === 0) {
            response = await this.searchAnime(query);
        } else {
            response = await this.searchMovie(query);
        }

        if (!response || !response.files) {
            return [];
        }

        return response.files.filter(f => this.isVideoFile(f.name));
    }

    /**
     * Get popular/recent content
     * @param {number} driveId - Drive ID
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Video results
     */
    async getPopularContent(driveId = 1, limit = 20) {
        console.log(`⭐ Getting content from drive ${driveId}...`);

        // Search with empty query to get recent files
        const results = await this.search('', driveId);

        return results.slice(0, limit);
    }

    /**
     * Parse search response from API
     */
    parseSearchResponse(response) {
        if (!response) {
            return { files: [], nextPageToken: null };
        }

        // Handle different response structures
        const files = response.data?.files || response.files || [];
        const nextPageToken = response.nextPageToken || null;

        const parsedFiles = files.map(file => ({
            id: file.id,
            name: file.name,
            path: file.link || file.path,
            url: `${this.baseUrl}${file.link || file.path}`,
            size: file.size,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            isVideo: this.isVideoFile(file.name),
            thumbnail: this.getThumbnailForFile(file.name),
            driveId: file.driveId
        }));

        return {
            files: parsedFiles,
            nextPageToken
        };
    }

    /**
     * Check if file is a video
     */
    isVideoFile(filename) {
        const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv', '.wmv', '.3gp', '.ts'];
        return videoExts.some(ext => filename.toLowerCase().endsWith(ext));
    }

    /**
     * Get thumbnail for file (placeholder generator)
     */
    getThumbnailForFile(filename) {
        // Generate deterministic seed from filename
        const seed = filename.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `https://picsum.photos/seed/${seed}/400/225`;
    }

    /**
     * Get direct video URL for streaming
     * @param {string} filePath - File path from API
     * @returns {string} Full streaming URL
     */
    getVideoUrl(filePath) {
        // If already full URL, return as is
        if (filePath.startsWith('http')) {
            return filePath;
        }
        // Otherwise prepend base URL
        return `${this.baseUrl}${filePath}`;
    }

    /**
     * Get all available drives
     */
    getDrives() {
        return this.drives;
    }

    /**
     * Browse by folder/category
     * @param {number} driveId - Drive ID
     * @param {string} folderPath - Folder path
     * @returns {Promise<Array>} Files in folder
     */
    async browseFolder(driveId, folderPath = '') {
        // For now, use search with folder name
        // In future, implement proper folder navigation
        const query = folderPath.split('/').pop() || '';
        return await this.search(query, driveId);
    }
}

export default AnimeZeyAPI;
