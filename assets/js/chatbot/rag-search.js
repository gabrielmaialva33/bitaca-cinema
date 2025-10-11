// ===============================================
// BITACA CINEMA - VECTOR SEARCH (RAG)
// Busca por similaridade vetorial usando embeddings
// ===============================================

/**
 * Vector Search Class
 * Implementa busca por similaridade de cosseno em embeddings
 */
class VectorSearch {
  constructor(embeddings) {
    this.embeddings = embeddings || [];
    console.log(`VectorSearch initialized with ${this.embeddings.length} embeddings`);
  }

  /**
   * Calcula similaridade de cosseno entre dois vetores
   * @param {Array<number>} vecA - Vetor A
   * @param {Array<number>} vecB - Vetor B
   * @returns {number} - Similaridade [-1, 1]
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      console.warn('Invalid vectors for similarity calculation');
      return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Busca por similaridade vetorial
   * @param {Array<number>} queryEmbedding - Embedding da query
   * @param {number} topK - Número de resultados a retornar
   * @param {number} threshold - Threshold mínimo de similaridade (0-1)
   * @returns {Array<Object>} - Array de resultados ordenados por similaridade
   */
  search(queryEmbedding, topK = 3, threshold = 0.7) {
    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn('Empty query embedding');
      return [];
    }

    // Calcula similaridade com todos os embeddings
    const similarities = this.embeddings.map(item => {
      const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);

      return {
        id: item.id,
        titulo: item.titulo,
        similarity: similarity,
        metadata: item.metadata
      };
    });

    // Filtra por threshold e ordena por similaridade decrescente
    const filtered = similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    // Retorna top K resultados
    const results = filtered.slice(0, topK);

    console.log(`VectorSearch found ${results.length} results above threshold ${threshold}`);

    return results;
  }

  /**
   * Busca híbrida (combina busca vetorial com keywords)
   * @param {Array<number>} queryEmbedding - Embedding da query
   * @param {string} queryText - Texto da query (para keyword matching)
   * @param {number} topK - Número de resultados
   * @returns {Array<Object>} - Resultados híbridos
   */
  hybridSearch(queryEmbedding, queryText, topK = 3) {
    // Busca vetorial
    const vectorResults = this.search(queryEmbedding, topK * 2, 0.5);

    // Keyword boost
    const queryLower = queryText.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 3);

    vectorResults.forEach(result => {
      let keywordBoost = 0;

      // Verifica se keywords aparecem no título ou sinopse
      const searchText = `${result.titulo} ${result.metadata.sinopse}`.toLowerCase();

      keywords.forEach(keyword => {
        if (searchText.includes(keyword)) {
          keywordBoost += 0.1;
        }
      });

      // Ajusta similaridade com boost
      result.similarity = Math.min(1.0, result.similarity + keywordBoost);
    });

    // Re-ordena e retorna top K
    return vectorResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Atualiza embeddings (útil para hot reload)
   * @param {Array} newEmbeddings - Novos embeddings
   */
  updateEmbeddings(newEmbeddings) {
    this.embeddings = newEmbeddings;
    console.log(`Embeddings updated: ${this.embeddings.length} items`);
  }

  /**
   * Retorna estatísticas dos embeddings
   * @returns {Object} - Stats
   */
  getStats() {
    return {
      total: this.embeddings.length,
      dimensions: this.embeddings[0]?.embedding?.length || 0,
      temas: [...new Set(this.embeddings.map(e => e.metadata.tema))],
      diretores: [...new Set(this.embeddings.map(e => e.metadata.diretor))]
    };
  }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VectorSearch;
}
