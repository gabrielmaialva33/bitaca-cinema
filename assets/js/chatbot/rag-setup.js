// ===============================================
// BITACA CINEMA - RAG SETUP
// Gera embeddings das produções (executar 1x)
// ===============================================

/**
 * Embedding Generator Class
 * Gera embeddings usando NVIDIA NIM API
 */
class EmbeddingGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://integrate.api.nvidia.com/v1';
    this.embeddingModel = 'nvidia/nv-embedqa-e5-v5'; // 1024 dimensions
  }

  /**
   * Gera embedding de um texto
   * @param {string} text - Texto para gerar embedding
   * @returns {Promise<Array<number>>} - Array de floats (1024 dimensions)
   */
  async generateEmbedding(text) {
    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text,
          encoding_format: "float"
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Gera embeddings de todas as produções
   * @param {Array} filmesData - Array de produções
   * @param {Function} progressCallback - Callback para progresso (optional)
   * @returns {Promise<Array>} - Array de embeddings
   */
  async generateAllEmbeddings(filmesData, progressCallback = null) {
    const embeddings = [];
    const total = filmesData.length;

    console.log(`Starting embedding generation for ${total} productions...`);

    for (let i = 0; i < filmesData.length; i++) {
      const filme = filmesData[i];

      try {
        // Cria texto rico para embedding
        const textToEmbed = this.prepareTextForEmbedding(filme);

        console.log(`[${i + 1}/${total}] Generating embedding for: "${filme.titulo}"`);

        // Gera embedding
        const embedding = await this.generateEmbedding(textToEmbed);

        embeddings.push({
          id: filme.id,
          titulo: filme.titulo,
          embedding: embedding,
          metadata: {
            diretor: filme.diretor,
            tema: filme.tema,
            eixo: filme.eixo,
            sinopse: filme.sinopse,
            status: filme.status
          }
        });

        // Callback de progresso
        if (progressCallback) {
          progressCallback(i + 1, total, filme.titulo);
        }

        // Rate limiting (evitar throttle da API)
        await this.sleep(500); // 500ms entre requisições

      } catch (error) {
        console.error(`Error generating embedding for "${filme.titulo}":`, error);
        // Continua com outras produções mesmo se uma falhar
      }
    }

    console.log(`Embedding generation complete: ${embeddings.length}/${total} successful`);

    return embeddings;
  }

  /**
   * Prepara texto otimizado para embedding
   * @param {Object} filme - Dados do filme
   * @returns {string} - Texto formatado
   */
  prepareTextForEmbedding(filme) {
    // Texto estruturado com todas as informações relevantes
    return `
Título: ${filme.titulo}
Diretor: ${filme.diretor}
Tema: ${filme.tema}
Eixo Temático: ${filme.eixo}
Sinopse: ${filme.sinopse || 'Produção audiovisual de Capão Bonito'}
Status: ${filme.status}
    `.trim();
  }

  /**
   * Salva embeddings em arquivo JSON (para uso no navegador, usar localStorage ou indexedDB)
   * @param {Array} embeddings - Embeddings gerados
   * @returns {string} - JSON string
   */
  exportEmbeddings(embeddings) {
    return JSON.stringify(embeddings, null, 2);
  }

  /**
   * Helper: Sleep function
   * @param {number} ms - Milliseconds
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Função de inicialização para gerar embeddings
 * Deve ser executada 1x via console ou script Node.js
 */
async function initializeEmbeddings(apiKey, filmesData) {
  const generator = new EmbeddingGenerator(apiKey);

  const embeddings = await generator.generateAllEmbeddings(
    filmesData,
    (current, total, titulo) => {
      console.log(`Progress: ${current}/${total} - ${titulo}`);
    }
  );

  // Exporta para JSON
  const json = generator.exportEmbeddings(embeddings);

  // No navegador: salvar no localStorage ou baixar como arquivo
  // No Node.js: salvar em arquivo usando fs.writeFileSync

  console.log('Embeddings JSON ready!');
  console.log('Size:', (json.length / 1024 / 1024).toFixed(2), 'MB');

  return json;
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EmbeddingGenerator, initializeEmbeddings };
}
