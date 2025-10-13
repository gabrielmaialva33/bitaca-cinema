/**
 * AnimeZeY API Client
 * Real integration with Google Drive Index using fetch
 */

export class AnimeZeyAPI {
    constructor() {
        this.baseUrl = 'https://animezey16082023.animezey16082023.workers.dev';
        this.drives = [
            { id: 0, name: 'AnimeZeY - Animes e Desenhos', path: '/0:' },
            { id: 1, name: 'AnimeZeY - Filmes e Séries', path: '/1:' }
        ];
        this.cache = new Map();
        this.iframe = null;
    }

    /**
     * Initialize iframe to render AnimezeyWorker content
     */
    initIframe() {
        if (this.iframe) return this.iframe;

        this.iframe = document.createElement('iframe');
        this.iframe.style.display = 'none';
        this.iframe.src = this.baseUrl + '/1:/';
        document.body.appendChild(this.iframe);

        return new Promise((resolve) => {
            this.iframe.onload = () => {
                console.log('✅ Animezey iframe loaded');
                resolve(this.iframe);
            };
        });
    }

    /**
     * Fetch folder contents using real fetch
     */
    async getFolderContents(driveId = 1, path = '') {
        const cacheKey = `${driveId}:${path}`;

        if (this.cache.has(cacheKey)) {
            console.log('📦 Cache hit for:', cacheKey);
            return this.cache.get(cacheKey);
        }

        try {
            const drivePath = this.drives[driveId].path;
            const fullPath = path ? `${drivePath}${path}/` : `${drivePath}/`;
            const url = `${this.baseUrl}${fullPath}`;

            console.log('🌐 Fetching:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const html = await response.text();

            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract file list from JavaScript
            const files = this.extractFilesFromHTML(doc);

            // Cache
            this.cache.set(cacheKey, files);

            console.log('✅ Found files:', files.length);

            return files;

        } catch (error) {
            console.error('❌ Error fetching:', error);
            return [];
        }
    }

    /**
     * Extract files from HTML document
     */
    extractFilesFromHTML(doc) {
        const files = [];

        // Method 1: Try to get from window.list if available
        try {
            const scripts = doc.querySelectorAll('script');
            for (const script of scripts) {
                const text = script.textContent;

                // Look for list data
                if (text.includes('window.list') || text.includes('files')) {
                    console.log('📜 Found potential file list in script');
                }
            }
        } catch (e) {
            console.log('Could not extract from scripts');
        }

        // Method 2: Parse the file links
        const links = doc.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();

            if (href && href.startsWith('/') && text && text !== 'Home') {
                const isFolder = !this.isVideoFile(text);
                const isVideo = this.isVideoFile(text);

                if (isVideo) {
                    files.push({
                        name: text,
                        path: href,
                        url: `${this.baseUrl}${href}`,
                        isFolder: false,
                        isVideo: true,
                        thumbnail: this.getThumbnailForFile(text)
                    });
                }
            }
        });

        return files;
    }

    /**
     * Check if file is video
     */
    isVideoFile(filename) {
        const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv', '.wmv', '.3gp', '.ts'];
        return videoExts.some(ext => filename.toLowerCase().endsWith(ext));
    }

    /**
     * Get thumbnail for file
     */
    getThumbnailForFile(filename) {
        // Generate random seed from filename
        const seed = filename.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `https://picsum.photos/seed/${seed}/400/225`;
    }

    /**
     * Get popular content
     */
    async getPopularContent(driveId = 1, limit = 20) {
        console.log('⭐ Getting popular content...');

        const allFiles = await this.getFolderContents(driveId, '');

        // Get all videos
        const videos = allFiles.filter(f => f.isVideo);

        return videos.slice(0, limit);
    }

    /**
     * Search for content
     */
    async search(query, driveId = 1) {
        console.log('🔍 Searching for:', query);

        const allFiles = await this.getFolderContents(driveId, '');

        const lowerQuery = query.toLowerCase();
        return allFiles.filter(f =>
            f.isVideo && f.name.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get direct video URL
     */
    getVideoUrl(filePath) {
        return `${this.baseUrl}${filePath}`;
    }

    /**
     * Get all drives
     */
    getDrives() {
        return this.drives;
    }

    /**
     * Browse by category/folder
     */
    async browseCategory(driveId, categoryPath) {
        return await this.getFolderContents(driveId, categoryPath);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Fetch using embedded iframe (alternative method)
     */
    async fetchViaIframe(path = '') {
        await this.initIframe();

        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
                    const files = this.extractFilesFromHTML(iframeDoc);
                    resolve(files);
                } catch (error) {
                    console.error('Error accessing iframe:', error);
                    resolve([]);
                }
            }, 2000); // Wait for JavaScript to render
        });
    }
}

export default AnimeZeyAPI;
