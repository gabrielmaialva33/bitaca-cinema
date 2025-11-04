/**
 * AI Tagging Service
 * Uses NVIDIA NIM API for embeddings and LLM-powered smart tagging
 * Stores enriched metadata in Firebase + MongoDB
 */

import fetch from 'node-fetch';

export class AITaggingService {
    constructor(config = {}) {
        this.nvidiaApiKey = config.nvidiaApiKey || process.env.NVIDIA_API_KEY;
        this.nvidiaBaseUrl = 'https://integrate.api.nvidia.com/v1';
        this.embeddingModel = 'nvidia/nv-embedqa-e5-v5';
        this.llmModel = 'meta/llama-3.3-70b-instruct';
    }

    /**
     * Generate embeddings for a text using NVIDIA NIM
     * @param {string} text - Text to embed
     * @returns {Promise<number[]>} - Embedding vector (1024 dimensions)
     */
    async generateEmbedding(text) {
        try {
            const response = await fetch(`${this.nvidiaBaseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.nvidiaApiKey}`
                },
                body: JSON.stringify({
                    input: text,
                    model: this.embeddingModel,
                    input_type: 'passage',
                    encoding_format: 'float',
                    truncate: 'NONE'
                })
            });

            if (!response.ok) {
                throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    /**
     * Generate smart tags using LLM analysis
     * @param {string} title - Content title
     * @param {string} description - Optional description
     * @returns {Promise<Object>} - Generated tags
     */
    async generateSmartTags(title, description = '') {
        try {
            const prompt = `Analyze this anime/movie title and generate smart tags.

Title: ${title}
${description ? `Description: ${description}` : ''}

Generate tags in the following categories:
- genres: main genres (e.g., action, romance, comedy)
- themes: thematic elements (e.g., friendship, revenge, coming-of-age)
- mood: emotional tone (e.g., dark, lighthearted, intense)
- target_audience: who would enjoy this (e.g., shonen, seinen, kids)
- style: visual or narrative style (e.g., realistic, fantasy, sci-fi)

Respond with ONLY a JSON object, no explanation:
{
  "genres": ["genre1", "genre2"],
  "themes": ["theme1", "theme2"],
  "mood": ["mood1", "mood2"],
  "target_audience": ["audience1"],
  "style": ["style1"]
}`;

            const response = await fetch(`${this.nvidiaBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.nvidiaApiKey}`
                },
                body: JSON.stringify({
                    model: this.llmModel,
                    messages: [
                        { role: 'system', content: 'You are an expert in anime and movie categorization. You always respond with valid JSON only.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON from LLM response');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error generating smart tags:', error);
            // Return default tags on error
            return {
                genres: ['unknown'],
                themes: [],
                mood: [],
                target_audience: [],
                style: []
            };
        }
    }

    /**
     * Process AnimeZey content and enrich with AI metadata
     * @param {Object} file - AnimeZey file object
     * @returns {Promise<Object>} - Enriched metadata
     */
    async enrichContent(file) {
        try {
            console.log(`🤖 Processing: ${file.name}`);

            // Generate embedding from title
            const embedding = await this.generateEmbedding(file.name);

            // Generate smart tags
            const smartTags = await this.generateSmartTags(file.name);

            // Create enriched metadata
            const enrichedMetadata = {
                // Original AnimeZey data
                id: file.id,
                name: file.name,
                url: file.url,
                path: file.path,
                size: file.size,
                mimeType: file.mimeType,
                modifiedTime: file.modifiedTime,
                driveId: file.driveId,
                isVideo: file.isVideo,
                thumbnail: file.thumbnail,

                // AI-generated metadata
                embedding: embedding,
                smartTags: smartTags,

                // Searchable text (for full-text search)
                searchText: `${file.name} ${Object.values(smartTags).flat().join(' ')}`.toLowerCase(),

                // Metadata
                enrichedAt: new Date().toISOString(),
                embeddingModel: this.embeddingModel,
                embeddingDimensions: embedding.length
            };

            console.log(`✅ Enriched: ${file.name}`);
            console.log(`   Genres: ${smartTags.genres.join(', ')}`);
            console.log(`   Embedding: ${embedding.length} dimensions`);

            return enrichedMetadata;
        } catch (error) {
            console.error(`Error enriching content ${file.name}:`, error);
            throw error;
        }
    }

    /**
     * Batch process multiple files
     * @param {Array} files - Array of AnimeZey files
     * @param {number} batchSize - Number of files to process concurrently
     * @returns {Promise<Array>} - Array of enriched metadata
     */
    async enrichBatch(files, batchSize = 5) {
        const results = [];

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);

            const batchPromises = batch.map(file => this.enrichContent(file));
            const batchResults = await Promise.allSettled(batchPromises);

            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`Failed to process ${batch[index].name}:`, result.reason);
                }
            });

            // Rate limiting - wait 1 second between batches
            if (i + batchSize < files.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Find similar content based on embedding similarity
     * @param {number[]} queryEmbedding - Query embedding vector
     * @param {Array} contentList - List of enriched content
     * @param {number} limit - Number of results to return
     * @returns {Array} - Similar content sorted by similarity
     */
    findSimilar(queryEmbedding, contentList, limit = 10) {
        const withSimilarity = contentList.map(content => ({
            ...content,
            similarity: this.cosineSimilarity(queryEmbedding, content.embedding)
        }));

        return withSimilarity
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    /**
     * Calculate cosine similarity between two vectors
     * @param {number[]} a - First vector
     * @param {number[]} b - Second vector
     * @returns {number} - Similarity score (0-1)
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

export default AITaggingService;
