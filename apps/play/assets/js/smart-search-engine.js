/**
 * Smart Search Engine for Bitaca Cinema
 * Features: Semantic search using embeddings, fuzzy matching,
 * autocomplete, query suggestions, advanced filters
 */

export class SmartSearchEngine {
    constructor(options = {}) {
        this.options = {
            embeddingsPath: '/assets/data/embeddings.json',
            minSimilarity: 0.3,
            maxResults: 20,
            enableFuzzy: true,
            fuzzyThreshold: 0.6,
            ...options
        };

        this.embeddings = [];
        this.productions = [];
        this.loaded = false;
        this.searchHistory = [];
        this.maxHistorySize = 50;

        this.loadSearchHistory();
    }

    async init() {
        console.log('🔍 Initializing Smart Search Engine...');

        try {
            await this.loadEmbeddings();
            this.loaded = true;
            console.log('✅ Smart Search Engine initialized');
        } catch (error) {
            console.error('Error initializing search engine:', error);
            throw error;
        }
    }

    async loadEmbeddings() {
        try {
            const response = await fetch(this.options.embeddingsPath);
            const data = await response.json();

            this.embeddings = data;
            this.productions = data.map(item => ({
                id: item.id,
                titulo: item.titulo,
                diretor: item.diretor || '',
                genero: item.genero || '',
                tema: item.tema || '',
                ano: item.ano || '',
                duracao: item.duracao || '',
                sinopse: item.sinopse || '',
                tags: item.tags || [],
                embedding: item.embedding
            }));

            console.log(`Loaded ${this.embeddings.length} production embeddings`);

        } catch (error) {
            console.error('Error loading embeddings:', error);
            this.embeddings = [];
            this.productions = [];
        }
    }

    /**
     * Semantic search using cosine similarity
     */
    async semanticSearch(query, options = {}) {
        if (!this.loaded || this.embeddings.length === 0) {
            console.warn('Embeddings not loaded, falling back to keyword search');
            return this.keywordSearch(query, options);
        }

        const {
            limit = this.options.maxResults,
            minSimilarity = this.options.minSimilarity,
            filters = {}
        } = options;

        try {
            // Generate embedding for query
            const queryEmbedding = await this.generateQueryEmbedding(query);

            // Calculate similarity scores
            const results = this.productions.map(prod => {
                const similarity = this.cosineSimilarity(queryEmbedding, prod.embedding);
                return {
                    ...prod,
                    similarity,
                    relevance: similarity * 100
                };
            });

            // Filter by minimum similarity
            let filtered = results.filter(r => r.similarity >= minSimilarity);

            // Apply additional filters
            filtered = this.applyFilters(filtered, filters);

            // Sort by similarity (descending)
            filtered.sort((a, b) => b.similarity - a.similarity);

            // Limit results
            const limited = filtered.slice(0, limit);

            // Add to search history
            this.addToHistory(query, limited.length);

            return limited;

        } catch (error) {
            console.error('Semantic search error:', error);
            return this.keywordSearch(query, options);
        }
    }

    /**
     * Fallback keyword search
     */
    keywordSearch(query, options = {}) {
        const {
            limit = this.options.maxResults,
            filters = {}
        } = options;

        const lowerQuery = query.toLowerCase();

        const results = this.productions.map(prod => {
            let score = 0;

            // Title match (highest weight)
            if (prod.titulo.toLowerCase().includes(lowerQuery)) {
                score += 10;
            }

            // Director match
            if (prod.diretor && prod.diretor.toLowerCase().includes(lowerQuery)) {
                score += 7;
            }

            // Genre match
            if (prod.genero && prod.genero.toLowerCase().includes(lowerQuery)) {
                score += 5;
            }

            // Theme match
            if (prod.tema && prod.tema.toLowerCase().includes(lowerQuery)) {
                score += 5;
            }

            // Synopsis match
            if (prod.sinopse && prod.sinopse.toLowerCase().includes(lowerQuery)) {
                score += 3;
            }

            // Tags match
            if (prod.tags && prod.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
                score += 6;
            }

            // Fuzzy match
            if (this.options.enableFuzzy) {
                const fuzzyScore = this.fuzzyMatch(lowerQuery, prod.titulo.toLowerCase());
                if (fuzzyScore >= this.options.fuzzyThreshold) {
                    score += fuzzyScore * 5;
                }
            }

            return {
                ...prod,
                similarity: score / 50, // Normalize to 0-1
                relevance: score * 2
            };
        });

        // Filter non-zero scores
        let filtered = results.filter(r => r.similarity > 0);

        // Apply additional filters
        filtered = this.applyFilters(filtered, filters);

        // Sort by score
        filtered.sort((a, b) => b.similarity - a.similarity);

        // Limit results
        const limited = filtered.slice(0, limit);

        this.addToHistory(query, limited.length);

        return limited;
    }

    /**
     * Search with autocomplete suggestions
     */
    autocomplete(query, limit = 5) {
        const lowerQuery = query.toLowerCase();

        const suggestions = [];

        // Title suggestions
        this.productions.forEach(prod => {
            if (prod.titulo.toLowerCase().startsWith(lowerQuery)) {
                suggestions.push({
                    type: 'title',
                    text: prod.titulo,
                    value: prod.titulo,
                    production: prod
                });
            }
        });

        // Director suggestions
        const directors = new Set();
        this.productions.forEach(prod => {
            if (prod.diretor && prod.diretor.toLowerCase().includes(lowerQuery)) {
                directors.add(prod.diretor);
            }
        });

        directors.forEach(director => {
            suggestions.push({
                type: 'director',
                text: `Dir: ${director}`,
                value: director
            });
        });

        // Genre suggestions
        const genres = new Set();
        this.productions.forEach(prod => {
            if (prod.genero && prod.genero.toLowerCase().includes(lowerQuery)) {
                genres.add(prod.genero);
            }
        });

        genres.forEach(genre => {
            suggestions.push({
                type: 'genre',
                text: `Gênero: ${genre}`,
                value: genre
            });
        });

        // Theme suggestions
        const themes = new Set();
        this.productions.forEach(prod => {
            if (prod.tema && prod.tema.toLowerCase().includes(lowerQuery)) {
                themes.add(prod.tema);
            }
        });

        themes.forEach(theme => {
            suggestions.push({
                type: 'theme',
                text: `Tema: ${theme}`,
                value: theme
            });
        });

        // History suggestions
        this.searchHistory.forEach(item => {
            if (item.query.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'history',
                    text: item.query,
                    value: item.query,
                    count: item.results
                });
            }
        });

        // Remove duplicates and limit
        const unique = Array.from(new Map(suggestions.map(s => [s.value, s])).values());
        return unique.slice(0, limit);
    }

    /**
     * Get query suggestions based on current trends
     */
    getQuerySuggestions() {
        const suggestions = [
            'filmes sobre patrimônio cultural',
            'documentários etnográficos',
            'videoclipes musicais',
            'produções sobre meio ambiente',
            'curtas brasileiros',
            'cinema indígena',
            'cultura popular'
        ];

        // Add popular searches from history
        const popularSearches = this.getPopularSearches(3);
        popularSearches.forEach(search => {
            if (!suggestions.includes(search.query)) {
                suggestions.push(search.query);
            }
        });

        return suggestions;
    }

    /**
     * Filter productions by criteria
     */
    applyFilters(productions, filters) {
        let filtered = [...productions];

        if (filters.theme) {
            filtered = filtered.filter(p =>
                p.tema && p.tema.toLowerCase().includes(filters.theme.toLowerCase())
            );
        }

        if (filters.genre) {
            filtered = filtered.filter(p =>
                p.genero && p.genero.toLowerCase().includes(filters.genre.toLowerCase())
            );
        }

        if (filters.director) {
            filtered = filtered.filter(p =>
                p.diretor && p.diretor.toLowerCase().includes(filters.director.toLowerCase())
            );
        }

        if (filters.year) {
            filtered = filtered.filter(p => p.ano === filters.year);
        }

        if (filters.minDuration) {
            filtered = filtered.filter(p => {
                const duration = this.parseDuration(p.duracao);
                return duration >= filters.minDuration;
            });
        }

        if (filters.maxDuration) {
            filtered = filtered.filter(p => {
                const duration = this.parseDuration(p.duracao);
                return duration <= filters.maxDuration;
            });
        }

        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter(p =>
                    p.tags && filters.tags.some(tag =>
                        p.tags.includes(tag)
                    )
            );
        }

        return filtered;
    }

    /**
     * Get related productions based on a production
     */
    getRelated(production, limit = 6) {
        if (!production || !production.embedding) {
            return [];
        }

        const related = this.productions
            .filter(p => p.id !== production.id)
            .map(prod => {
                const similarity = this.cosineSimilarity(production.embedding, prod.embedding);
                return {
                    ...prod,
                    similarity,
                    relevance: similarity * 100
                };
            })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        return related;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    /**
     * Fuzzy string matching (Levenshtein distance based)
     */
    fuzzyMatch(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;

        if (len1 === 0) return 0;
        if (len2 === 0) return 0;

        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + cost
                );
            }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        return 1 - (distance / maxLen);
    }

    /**
     * Generate query embedding (mock - in production use actual embedding API)
     */
    async generateQueryEmbedding(query) {
        // In production, call embedding API
        // For now, use average of all embeddings (mock)
        if (this.embeddings.length === 0) {
            return [];
        }

        // Simple mock: use average embedding
        const dim = this.embeddings[0].embedding.length;
        const avgEmbedding = new Array(dim).fill(0);

        this.embeddings.forEach(item => {
            for (let i = 0; i < dim; i++) {
                avgEmbedding[i] += item.embedding[i];
            }
        });

        for (let i = 0; i < dim; i++) {
            avgEmbedding[i] /= this.embeddings.length;
        }

        // Add some randomness based on query
        const queryHash = this.hashString(query);
        for (let i = 0; i < dim; i++) {
            avgEmbedding[i] += (Math.sin(queryHash + i) * 0.1);
        }

        return avgEmbedding;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    parseDuration(duration) {
        if (!duration) return 0;

        // Parse "15 min", "1h 30min", etc
        const matches = duration.match(/(\d+)\s*(h|min)/gi);
        if (!matches) return 0;

        let totalMinutes = 0;
        matches.forEach(match => {
            const value = parseInt(match);
            if (match.toLowerCase().includes('h')) {
                totalMinutes += value * 60;
            } else {
                totalMinutes += value;
            }
        });

        return totalMinutes;
    }

    // Search history management
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('bitaca_search_history');
            if (stored) {
                this.searchHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('bitaca_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    addToHistory(query, resultsCount) {
        // Remove existing entry if exists
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);

        // Add new entry
        this.searchHistory.unshift({
            query,
            results: resultsCount,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }

        this.saveSearchHistory();
    }

    getPopularSearches(limit = 10) {
        // Sort by frequency (count duplicates)
        const queryCounts = {};

        this.searchHistory.forEach(item => {
            queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
        });

        const popular = Object.entries(queryCounts)
            .map(([query, count]) => ({query, count}))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return popular;
    }

    clearHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    // Get available filters
    getAvailableFilters() {
        const themes = new Set();
        const genres = new Set();
        const directors = new Set();
        const years = new Set();
        const allTags = new Set();

        this.productions.forEach(prod => {
            if (prod.tema) themes.add(prod.tema);
            if (prod.genero) genres.add(prod.genero);
            if (prod.diretor) directors.add(prod.diretor);
            if (prod.ano) years.add(prod.ano);
            if (prod.tags) prod.tags.forEach(tag => allTags.add(tag));
        });

        return {
            themes: Array.from(themes).sort(),
            genres: Array.from(genres).sort(),
            directors: Array.from(directors).sort(),
            years: Array.from(years).sort(),
            tags: Array.from(allTags).sort()
        };
    }
}

export default SmartSearchEngine;
