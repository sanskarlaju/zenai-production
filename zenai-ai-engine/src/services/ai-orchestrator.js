const OrchestratorAgent = require('../agents/orchestrator.agent');
const ContextManager = require('../memory/context.manager');
const logger = require('../utils/logger');

class AIOrchestrator {
  constructor() {
    this.agent = new OrchestratorAgent();
    this.contextManagers = new Map();
  }

  async initialize() {
    await this.agent.initialize();
    logger.info('AI Orchestrator initialized');
  }

  async processRequest(request, options = {}) {
    try {
      const { userId, conversationId, context } = options;

      // Get or create context manager
      const contextManager = this.getContextManager(userId, conversationId);
      await contextManager.initialize();

      // Build context
      const fullContext = await contextManager.buildContext(request, {
        includeHistory: options.includeHistory !== false,
        includeDocuments: options.includeDocuments,
        additionalContext: context
      });

      // Execute request through orchestrator
      const result = await this.agent.execute(request, fullContext);

      // Save interaction
      await contextManager.saveInteraction(
        request,
        result.finalResponse,
        { routing: result.routing }
      );

      return {
        response: result.finalResponse,
        routing: result.routing,
        agentResults: result.agentResults,
        metadata: {
          timestamp: new Date().toISOString(),
          userId,
          conversationId
        }
      };
    } catch (error) {
      logger.error('AI Orchestrator error:', error);
      throw error;
    }
  }

  async processComplexWorkflow(request, options = {}) {
    try {
      const { userId, conversationId, context } = options;

      const contextManager = this.getContextManager(userId, conversationId);
      await contextManager.initialize();

      const fullContext = await contextManager.buildContext(request, {
        additionalContext: context
      });

      const result = await this.agent.handleComplexWorkflow(request, fullContext);

      return result;
    } catch (error) {
      logger.error('Complex workflow error:', error);
      throw error;
    }
  }

  getContextManager(userId, conversationId) {
    const key = `${userId}:${conversationId}`;
    
    if (!this.contextManagers.has(key)) {
      const manager = new ContextManager({ userId, conversationId });
      this.contextManagers.set(key, manager);
    }
    
    return this.contextManagers.get(key);
  }

  async clearContext(userId, conversationId) {
    const key = `${userId}:${conversationId}`;
    const manager = this.contextManagers.get(key);
    
    if (manager) {
      await manager.clear();
      this.contextManagers.delete(key);
    }
  }
}

module.exports = AIOrchestrator;
