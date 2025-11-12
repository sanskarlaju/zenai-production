
const { encoding_for_model } = require('tiktoken');
const logger = require('./logger');

class TokenCounter {
  constructor(modelName = 'gpt-4') {
    try {
      this.encoding = encoding_for_model(modelName);
      this.modelName = modelName;
    } catch (error) {
      logger.warn(`Failed to load encoding for ${modelName}, using cl100k_base`);
      this.encoding = encoding_for_model('cl100k_base');
    }
  }

  countTokens(text) {
    if (!text) return 0;
    return this.encoding.encode(text).length;
  }

  countMessagesTokens(messages) {
    let totalTokens = 0;

    for (const message of messages) {
      // Every message follows <|start|>{role/name}\n{content}<|end|>\n
      totalTokens += 4;
      
      if (message.role) {
        totalTokens += this.countTokens(message.role);
      }
      
      if (message.content) {
        totalTokens += this.countTokens(message.content);
      }
      
      if (message.name) {
        totalTokens += this.countTokens(message.name);
        totalTokens += -1; // Role is omitted
      }
    }

    totalTokens += 2; // Every reply is primed with <|start|>assistant

    return totalTokens;
  }

  estimateCost(tokens, model = this.modelName) {
    // Approximate costs (as of 2024)
    const costs = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };

    const modelCost = costs[model] || costs['gpt-4'];
    return {
      input: (tokens / 1000) * modelCost.input,
      output: (tokens / 1000) * modelCost.output
    };
  }

  truncateToTokenLimit(text, maxTokens) {
    const tokens = this.encoding.encode(text);
    
    if (tokens.length <= maxTokens) {
      return text;
    }

    const truncatedTokens = tokens.slice(0, maxTokens);
    return this.encoding.decode(truncatedTokens);
  }

  splitIntoChunks(text, chunkSize, overlap = 0) {
    const tokens = this.encoding.encode(text);
    const chunks = [];
    
    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + chunkSize, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      chunks.push(this.encoding.decode(chunkTokens));
      start = end - overlap;
    }

    return chunks;
  }

  cleanup() {
    if (this.encoding) {
      this.encoding.free();
    }
  }
}

module.exports = TokenCounter;
