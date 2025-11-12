const { BufferMemory } = require('langchain/memory');
const { ChatMessageHistory } = require('langchain/memory');
const { HumanMessage, AIMessage, SystemMessage } = require('langchain/schema');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

class ConversationMemory {
  constructor(options = {}) {
    this.userId = options.userId;
    this.conversationId = options.conversationId;
    this.maxMessages = options.maxMessages || 20;
    this.ttl = options.ttl || 3600 * 24; // 24 hours
    
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'chat_history',
      inputKey: 'input',
      outputKey: 'output'
    });
  }

  async loadHistory() {
    try {
      const key = this.getCacheKey();
      const history = await cache.get(key);
      
      if (history && Array.isArray(history)) {
        const messages = history.map(msg => {
          if (msg.type === 'human') {
            return new HumanMessage(msg.content);
          } else if (msg.type === 'ai') {
            return new AIMessage(msg.content);
          } else if (msg.type === 'system') {
            return new SystemMessage(msg.content);
          }
        });

        this.memory.chatHistory = new ChatMessageHistory(messages);
      }
    } catch (error) {
      logger.error('Error loading conversation history:', error);
    }
  }

  async saveMessage(role, content, metadata = {}) {
    try {
      const message = {
        type: role,
        content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      };

      // Add to memory
      if (role === 'human') {
        await this.memory.chatHistory.addUserMessage(content);
      } else if (role === 'ai') {
        await this.memory.chatHistory.addAIMessage(content);
      }

      // Save to cache
      await this.saveHistory();
      
      return message;
    } catch (error) {
      logger.error('Error saving message:', error);
      throw error;
    }
  }

  async saveHistory() {
    try {
      const messages = await this.memory.chatHistory.getMessages();
      const serialized = messages.slice(-this.maxMessages).map(msg => ({
        type: msg._getType(),
        content: msg.content
      }));

      const key = this.getCacheKey();
      await cache.set(key, serialized, this.ttl);
    } catch (error) {
      logger.error('Error saving conversation history:', error);
    }
  }

  async getHistory() {
    const messages = await this.memory.chatHistory.getMessages();
    return messages.map(msg => ({
      role: msg._getType(),
      content: msg.content
    }));
  }

  async clear() {
    await this.memory.clear();
    const key = this.getCacheKey();
    await cache.del(key);
  }

  async summarize() {
    const messages = await this.getHistory();
    
    // Create a summary of the conversation
    const summary = {
      messageCount: messages.length,
      userMessages: messages.filter(m => m.role === 'human').length,
      aiMessages: messages.filter(m => m.role === 'ai').length,
      firstMessage: messages[0]?.content.substring(0, 100),
      lastMessage: messages[messages.length - 1]?.content.substring(0, 100)
    };

    return summary;
  }

  getCacheKey() {
    return `conversation:${this.userId}:${this.conversationId}`;
  }
}

module.exports = ConversationMemory;
