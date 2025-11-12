const TokenCounter = require('./token-counter');
const logger = require('./logger');

class PromptOptimizer {
  constructor(modelName = 'gpt-4') {
    this.tokenCounter = new TokenCounter(modelName);
    this.maxTokens = 8000; // Conservative limit
  }

  optimize(prompt, context = {}, options = {}) {
    const maxTokens = options.maxTokens || this.maxTokens;
    
    // Start with the base prompt
    let optimized = prompt;
    let currentTokens = this.tokenCounter.countTokens(optimized);

    // Add context if it fits
    if (context && currentTokens < maxTokens * 0.7) {
      const contextStr = this.formatContext(context);
      const contextTokens = this.tokenCounter.countTokens(contextStr);
      
      if (currentTokens + contextTokens < maxTokens * 0.8) {
        optimized = `${contextStr}\n\n${optimized}`;
        currentTokens += contextTokens;
      } else {
        // Truncate context to fit
        const availableTokens = Math.floor(maxTokens * 0.5);
        const truncatedContext = this.tokenCounter.truncateToTokenLimit(
          contextStr,
          availableTokens
        );
        optimized = `${truncatedContext}\n\n${optimized}`;
        currentTokens = this.tokenCounter.countTokens(optimized);
      }
    }

    // Add examples if specified and if there's room
    if (options.examples && currentTokens < maxTokens * 0.85) {
      const examplesStr = this.formatExamples(options.examples);
      const examplesTokens = this.tokenCounter.countTokens(examplesStr);
      
      if (currentTokens + examplesTokens < maxTokens * 0.9) {
        optimized = `${optimized}\n\n${examplesStr}`;
      }
    }

    return optimized;
  }

  formatContext(context) {
    const lines = [];
    
    if (typeof context === 'string') {
      return context;
    }

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'object') {
        lines.push(`${key}: ${JSON.stringify(value, null, 2)}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  formatExamples(examples) {
    return examples.map((ex, i) => 
      `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}`
    ).join('\n\n');
  }

  compressPrompt(prompt) {
    // Remove extra whitespace
    let compressed = prompt.replace(/\s+/g, ' ').trim();
    
    // Remove redundant phrases
    const redundantPhrases = [
      /please\s+/gi,
      /kindly\s+/gi,
      /essentially\s+/gi,
      /basically\s+/gi
    ];

    redundantPhrases.forEach(phrase => {
      compressed = compressed.replace(phrase, '');
    });

    return compressed;
  }

  extractKeyInformation(text, maxTokens) {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Score sentences by importance (simple heuristic)
    const scored = sentences.map(sentence => ({
      text: sentence,
      score: this.scoreSentence(sentence)
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Take sentences until we hit token limit
    let result = '';
    let tokens = 0;

    for (const item of scored) {
      const sentenceTokens = this.tokenCounter.countTokens(item.text);
      if (tokens + sentenceTokens > maxTokens) break;
      
      result += item.text + ' ';
      tokens += sentenceTokens;
    }

    return result.trim();
  }

  scoreSentence(sentence) {
    let score = 0;
    
    // Important keywords increase score
    const importantKeywords = [
      'important', 'critical', 'must', 'required', 'urgent',
      'deadline', 'priority', 'key', 'essential', 'vital'
    ];

    importantKeywords.forEach(keyword => {
      if (sentence.toLowerCase().includes(keyword)) {
        score += 2;
      }
    });

    // Numbers and dates are often important
    if (/\d+/.test(sentence)) {
      score += 1;
    }

    // Questions are often important
    if (sentence.includes('?')) {
      score += 1;
    }

    return score;
  }

  cleanup() {
    this.tokenCounter.cleanup();
  }
}

module.exports = PromptOptimizer;
