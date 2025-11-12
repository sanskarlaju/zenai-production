const { OpenAIEmbeddings } = require('@langchain/openai');
const { PineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const { Document } = require('langchain/document');
const logger = require('../utils/logger');

class VectorStore {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
    });

    this.initialized = false;
  }

  async initialize() {
    try {
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });

      const indexName = process.env.PINECONE_INDEX || 'zenai-embeddings';
      this.index = pinecone.Index(indexName);
      
      this.vectorStore = await PineconeStore.fromExistingIndex(
        this.embeddings,
        { pineconeIndex: this.index }
      );

      this.initialized = true;
      logger.info('Vector store initialized successfully');
    } catch (error) {
      logger.error('Vector store initialization error:', error);
      throw error;
    }
  }

  async addDocuments(documents, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const docs = documents.map((doc, index) => new Document({
        pageContent: typeof doc === 'string' ? doc : doc.content,
        metadata: {
          ...metadata,
          index,
          timestamp: new Date().toISOString(),
          ...(typeof doc === 'object' ? doc.metadata : {})
        }
      }));

      const ids = await this.vectorStore.addDocuments(docs);
      
      logger.info(`Added ${docs.length} documents to vector store`);
      return ids;
    } catch (error) {
      logger.error('Error adding documents:', error);
      throw error;
    }
  }

  async similaritySearch(query, k = 5, filter = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        k,
        filter
      );

      return results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score
      }));
    } catch (error) {
      logger.error('Similarity search error:', error);
      throw error;
    }
  }

  async delete(filter = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await this.index.deleteMany(filter);
      logger.info('Documents deleted from vector store');
    } catch (error) {
      logger.error('Error deleting documents:', error);
      throw error;
    }
  }
}

module.exports = VectorStore;