// src/embeddings/document-processor.js
const { OpenAIEmbeddings } = require('@langchain/openai');
const { PineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { Document } = require('langchain/document');
const logger = require('../utils/logger');

class DocumentProcessor {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
  }

  async initialize() {
    const indexName = process.env.PINECONE_INDEX || 'zenai-embeddings';
    this.index = this.pinecone.Index(indexName);
    
    this.vectorStore = await PineconeStore.fromExistingIndex(
      this.embeddings,
      { pineconeIndex: this.index }
    );

    logger.info('Vector store initialized');
  }

  async indexDocument(content, metadata = {}) {
    try {
      // Split document into chunks
      const chunks = await this.textSplitter.splitText(content);

      // Create documents
      const documents = chunks.map((chunk, index) => new Document({
        pageContent: chunk,
        metadata: {
          ...metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
          timestamp: new Date().toISOString()
        }
      }));

      // Add to vector store
      await this.vectorStore.addDocuments(documents);

      logger.info(`Indexed ${documents.length} document chunks`);
      return { success: true, chunks: documents.length };
    } catch (error) {
      logger.error('Document indexing error:', error);
      throw error;
    }
  }

  async similaritySearch(query, options = {}) {
    try {
      const k = options.limit || 5;
      const filter = options.filter || {};

      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        k,
        filter
      );

      // Format results
      const formattedResults = results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score,
        relevance: this.calculateRelevance(score)
      }));

      logger.info(`Found ${formattedResults.length} relevant documents`);
      return formattedResults;
    } catch (error) {
      logger.error('Similarity search error:', error);
      throw error;
    }
  }

  calculateRelevance(score) {
    // Convert similarity score to relevance percentage
    // Lower scores are better in cosine similarity (0 = identical)
    if (score < 0.3) return 'high';
    if (score < 0.6) return 'medium';
    return 'low';
  }

  async deleteDocuments(filter) {
    try {
      // Delete documents matching filter
      await this.index.deleteMany({ filter });
      
      logger.info('Documents deleted successfully');
      return { success: true };
    } catch (error) {
      logger.error('Document deletion error:', error);
      throw error;
    }
  }

  async updateDocument(documentId, content, metadata = {}) {
    try {
      // Delete old version
      await this.deleteDocuments({ documentId });

      // Index new version
      return await this.indexDocument(content, {
        ...metadata,
        documentId,
        version: (metadata.version || 0) + 1
      });
    } catch (error) {
      logger.error('Document update error:', error);
      throw error;
    }
  }

  async queryWithContext(query, options = {}) {
    try {
      // Get relevant documents
      const relevantDocs = await this.similaritySearch(query, options);

      // Build context from top documents
      const context = relevantDocs
        .slice(0, options.contextLimit || 3)
        .map(doc => doc.content)
        .join('\n\n');

      return {
        query,
        context,
        sources: relevantDocs.map(doc => ({
          content: doc.content.substring(0, 200) + '...',
          metadata: doc.metadata,
          score: doc.score
        }))
      };
    } catch (error) {
      logger.error('Query with context error:', error);
      throw error;
    }
  }

  async bulkIndexDocuments(documents) {
    try {
      const results = [];
      
      for (const doc of documents) {
        const result = await this.indexDocument(doc.content, doc.metadata);
        results.push({
          documentId: doc.metadata.documentId,
          ...result
        });
      }

      logger.info(`Bulk indexed ${results.length} documents`);
      return { success: true, results };
    } catch (error) {
      logger.error('Bulk indexing error:', error);
      throw error;
    }
  }

  async getDocumentStats(filter = {}) {
    try {
      // Query to get statistics
      const stats = await this.index.describeIndexStats();

      return {
        totalVectors: stats.totalRecordCount,
        dimension: stats.dimension,
        namespaces: stats.namespaces,
        indexFullness: stats.indexFullness
      };
    } catch (error) {
      logger.error('Stats retrieval error:', error);
      throw error;
    }
  }

  async hybridSearch(query, options = {}) {
    try {
      // Combine vector search with keyword matching
      const vectorResults = await this.similaritySearch(query, {
        limit: options.limit || 10,
        filter: options.filter
      });

      // Extract keywords from query
      const keywords = this.extractKeywords(query);

      // Re-rank results based on keyword presence
      const rankedResults = vectorResults.map(result => {
        const keywordScore = this.calculateKeywordScore(
          result.content,
          keywords
        );
        
        return {
          ...result,
          keywordScore,
          finalScore: result.score * 0.7 + keywordScore * 0.3
        };
      }).sort((a, b) => a.finalScore - b.finalScore);

      return rankedResults.slice(0, options.limit || 5);
    } catch (error) {
      logger.error('Hybrid search error:', error);
      throw error;
    }
  }

  extractKeywords(text) {
    // Simple keyword extraction (can be enhanced with NLP)
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
  }

  isStopWord(word) {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'are', 'was', 'were',
      'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can'
    ]);
    return stopWords.has(word);
  }

  calculateKeywordScore(content, keywords) {
    const contentLower = content.toLowerCase();
    const matches = keywords.filter(kw => contentLower.includes(kw)).length;
    return matches / keywords.length;
  }

  async semanticSearch(query, options = {}) {
    try {
      // Advanced semantic search with question answering
      const results = await this.queryWithContext(query, options);

      return {
        answer: results.context,
        confidence: this.calculateConfidence(results.sources),
        sources: results.sources,
        relatedQueries: await this.generateRelatedQueries(query)
      };
    } catch (error) {
      logger.error('Semantic search error:', error);
      throw error;
    }
  }

  calculateConfidence(sources) {
    if (sources.length === 0) return 0;
    
    const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
    
    // Convert score to confidence percentage
    if (avgScore < 0.2) return 95;
    if (avgScore < 0.4) return 85;
    if (avgScore < 0.6) return 70;
    if (avgScore < 0.8) return 50;
    return 30;
  }

  async generateRelatedQueries(query) {
    // Generate semantically related queries
    const variations = [
      query.replace(/how/i, 'what'),
      query.replace(/what/i, 'why'),
      query + ' examples',
      query + ' best practices'
    ];

    return variations.slice(0, 3);
  }

  async clearNamespace(namespace) {
    try {
      await this.index.deleteAll({ namespace });
      logger.info(`Cleared namespace: ${namespace}`);
      return { success: true };
    } catch (error) {
      logger.error('Namespace clearing error:', error);
      throw error;
    }
  }
}

module.exports = DocumentProcessor;