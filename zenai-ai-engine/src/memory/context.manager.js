const ConversationMemory = require('./conversation.memory');
const VectorStore = require('./vector-store');
const logger = require('../utils/logger');

class ContextManager {
  constructor(options = {}) {
    this.userId = options.userId;
    this.conversationId = options.conversationId;
    this.maxContextLength = options.maxContextLength || 4000;
    
    this.conversationMemory = new ConversationMemory({
      userId: this.userId,
      conversationId: this.conversationId
    });
    
    this.vectorStore = new VectorStore();
  }

  async initialize() {
    await this.conversationMemory.loadHistory();
    await this.vectorStore.initialize();
  }

  async buildContext(query, options = {}) {
    try {
      const context = {
        query,
        conversationHistory: [],
        relevantDocuments: [],
        metadata: {}
      };

      // Get conversation history
      if (options.includeHistory !== false) {
        const history = await this.conversationMemory.getHistory();
        context.conversationHistory = this.truncateHistory(history);
      }

      // Get relevant documents from vector store
      if (options.includeDocuments !== false) {
        const docs = await this.vectorStore.similaritySearch(
          query,
          options.topK || 3,
          options.filter
        );
        context.relevantDocuments = docs;
      }

      // Add additional context
      if (options.additionalContext) {
        context.metadata = options.additionalContext;
      }

      return context;
    } catch (error) {
      logger.error('Error building context:', error);
      throw error;
    }
  }

  async saveInteraction(userMessage, aiResponse, metadata = {}) {
    try {
      await this.conversationMemory.saveMessage('human', userMessage, metadata);
      await this.conversationMemory.saveMessage('ai', aiResponse, metadata);
      
      // Optionally index the interaction for future retrieval
      if (metadata.indexForRetrieval) {
        await this.vectorStore.addDocuments([
          {
            content: `User: ${userMessage}\nAssistant: ${aiResponse}`,
            metadata: {
              type: 'conversation',
              userId: this.userId,
              conversationId: this.conversationId,
              ...metadata
            }
          }
        ]);
      }
    } catch (error) {
      logger.error('Error saving interaction:', error);
      throw error;
    }
  }

  truncateHistory(history, maxLength = this.maxContextLength) {
    let totalLength = 0;
    const truncated = [];

    // Keep messages from newest to oldest until we hit the limit
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const msgLength = msg.content.length;
      
      if (totalLength + msgLength > maxLength) {
        break;
      }
      
      truncated.unshift(msg);
      totalLength += msgLength;
    }

    return truncated;
  }

  async summarizeContext() {
    const history = await this.conversationMemory.getHistory();
    return {
      messageCount: history.length,
      totalTokens: this.estimateTokens(history),
      summary: await this.conversationMemory.summarize()
    };
  }

  estimateTokens(messages) {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  async clear() {
    await this.conversationMemory.clear();
  }
}

module.exports = ContextManager;