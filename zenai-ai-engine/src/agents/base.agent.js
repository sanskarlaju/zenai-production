// src/agents/base.agent.js
const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { BufferMemory } = require('langchain/memory');
const logger = require('../utils/logger');

class BaseAgent {
  constructor(config) {
    this.name = config.name || 'BaseAgent';
    this.description = config.description || '';
    this.model = this.initializeModel(config);
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'chat_history',
      inputKey: 'input',
      outputKey: 'output'
    });
    this.tools = config.tools || [];
    this.maxIterations = config.maxIterations || 5;
    this.verbose = config.verbose || false;
  }

  initializeModel(config) {
    const modelType = config.modelType || 'openai';
    const temperature = config.temperature || 0.7;
    const maxTokens = config.maxTokens || 2000;

    if (modelType === 'openai') {
      return new ChatOpenAI({
        modelName: config.modelName || process.env.OPENAI_MODEL,
        temperature,
        maxTokens,
        streaming: config.streaming || false
      });
    } else if (modelType === 'anthropic') {
      return new ChatAnthropic({
        modelName: config.modelName || process.env.ANTHROPIC_MODEL,
        temperature,
        maxTokens,
        streaming: config.streaming || false
      });
    }

    throw new Error(`Unsupported model type: ${modelType}`);
  }

  async initialize() {
    this.executor = await initializeAgentExecutorWithOptions(
      this.tools,
      this.model,
      {
        agentType: 'openai-functions',
        memory: this.memory,
        maxIterations: this.maxIterations,
        verbose: this.verbose
      }
    );
  }

  async run(input, context = {}) {
    try {
      logger.info(`${this.name} executing with input: ${input.substring(0, 100)}...`);

      const result = await this.executor.call({
        input,
        ...context
      });

      logger.info(`${this.name} completed successfully`);
      return result.output;
    } catch (error) {
      logger.error(`${this.name} error: ${error.message}`);
      throw error;
    }
  }

  async chat(message, conversationId) {
    // Streaming chat implementation
    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: message }
    ]);

    return response.content;
  }

  getSystemPrompt() {
    return `You are ${this.name}. ${this.description}`;
  }

  clearMemory() {
    this.memory.clear();
  }
}

module.exports = BaseAgent;