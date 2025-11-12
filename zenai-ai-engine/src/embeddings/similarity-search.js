// src/embeddings/similarity-search.js
const { OpenAIEmbeddings } = require('@langchain/openai');
const { PineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../utils/logger');

class SimilaritySearchService {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT
    });

    this.vectorStore = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const indexName = process.env.PINECONE_INDEX || 'zenai-embeddings';
      this.index = this.pinecone.Index(indexName);

      this.vectorStore = await PineconeStore.fromExistingIndex(
        this.embeddings,
        { pineconeIndex: this.index }
      );

      this.initialized = true;
      logger.info('Similarity search service initialized');
    } catch (error) {
      logger.error('Similarity search initialization error:', error);
      throw error;
    }
  }

  async search(query, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const {
        k = 5,
        filter = {},
        scoreThreshold = 0.7,
        namespace = 'default'
      } = options;

      // Perform similarity search with scores
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        k,
        filter
      );

      // Filter by score threshold
      const filteredResults = results
        .filter(([doc, score]) => score >= scoreThreshold)
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: score,
          relevance: this.calculateRelevance(score)
        }));

      logger.info(`Similarity search returned ${filteredResults.length} results`);

      return {
        results: filteredResults,
        query,
        totalResults: filteredResults.length,
        options: { k, scoreThreshold }
      };
    } catch (error) {
      logger.error('Similarity search error:', error);
      throw error;
    }
  }

  async searchByVector(vector, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const { k = 5, filter = {} } = options;

      const results = await this.index.query({
        vector,
        topK: k,
        filter,
        includeMetadata: true
      });

      return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
        relevance: this.calculateRelevance(match.score)
      }));
    } catch (error) {
      logger.error('Vector search error:', error);
      throw error;
    }
  }

  async searchRelatedDocuments(documentId, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const { k = 5 } = options;

      // Get the document's vector
      const docVector = await this.index.fetch([documentId]);
      
      if (!docVector.vectors[documentId]) {
        throw new Error('Document not found');
      }

      const vector = docVector.vectors[documentId].values;

      // Search for similar documents
      const results = await this.searchByVector(vector, {
        k: k + 1, // +1 to exclude the original document
        filter: { documentId: { $ne: documentId } }
      });

      return results.slice(0, k);
    } catch (error) {
      logger.error('Related documents search error:', error);
      throw error;
    }
  }

  async hybridSearch(query, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const {
        k = 10,
        semanticWeight = 0.7,
        keywordWeight = 0.3,
        filter = {}
      } = options;

      // Semantic search
      const semanticResults = await this.search(query, { k, filter });

      // Simple keyword matching (you can enhance this with BM25 or similar)
      const keywords = query.toLowerCase().split(' ');
      const keywordResults = semanticResults.results.map(result => {
        const content = result.content.toLowerCase();
        const keywordScore = keywords.reduce((score, keyword) => {
          return score + (content.includes(keyword) ? 1 : 0);
        }, 0) / keywords.length;

        return {
          ...result,
          keywordScore,
          hybridScore: (result.score * semanticWeight) + (keywordScore * keywordWeight)
        };
      });

      // Sort by hybrid score
      keywordResults.sort((a, b) => b.hybridScore - a.hybridScore);

      return {
        results: keywordResults.slice(0, k),
        query,
        method: 'hybrid',
        weights: { semantic: semanticWeight, keyword: keywordWeight }
      };
    } catch (error) {
      logger.error('Hybrid search error:', error);
      throw error;
    }
  }

  async multiQuerySearch(queries, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const { k = 5, aggregation = 'union' } = options;

      // Search for each query
      const searchPromises = queries.map(query => 
        this.search(query, { k, ...options })
      );

      const allResults = await Promise.all(searchPromises);

      let finalResults;
      if (aggregation === 'union') {
        // Combine all unique results
        const resultsMap = new Map();
        allResults.forEach(({ results }) => {
          results.forEach(result => {
            const key = result.metadata.id || result.content;
            if (!resultsMap.has(key) || resultsMap.get(key).score < result.score) {
              resultsMap.set(key, result);
            }
          });
        });
        finalResults = Array.from(resultsMap.values());
      } else if (aggregation === 'intersection') {
        // Only results that appear in all queries
        const resultCounts = new Map();
        allResults.forEach(({ results }) => {
          results.forEach(result => {
            const key = result.metadata.id || result.content;
            resultCounts.set(key, (resultCounts.get(key) || 0) + 1);
          });
        });
        finalResults = Array.from(resultCounts.entries())
          .filter(([key, count]) => count === queries.length)
          .map(([key]) => key);
      }

      // Sort by score
      finalResults.sort((a, b) => b.score - a.score);

      return {
        results: finalResults.slice(0, k),
        queries,
        aggregation,
        totalResults: finalResults.length
      };
    } catch (error) {
      logger.error('Multi-query search error:', error);
      throw error;
    }
  }

  calculateRelevance(score) {
    if (score >= 0.9) return 'very_high';
    if (score >= 0.8) return 'high';
    if (score >= 0.7) return 'medium';
    if (score >= 0.6) return 'low';
    return 'very_low';
  }

  async getStats(namespace = 'default') {
    try {
      const stats = await this.index.describeIndexStats();
      return {
        totalVectors: stats.totalVectorCount,
        dimension: stats.dimension,
        namespaces: stats.namespaces
      };
    } catch (error) {
      logger.error('Get stats error:', error);
      throw error;
    }
  }

  async deleteByMetadata(filter) {
    if (!this.initialized) await this.initialize();

    try {
      await this.index.delete1({
        filter,
        deleteAll: false
      });

      logger.info('Documents deleted by metadata filter');
      return { success: true };
    } catch (error) {
      logger.error('Delete by metadata error:', error);
      throw error;
    }
  }
}

module.exports = SimilaritySearchService;