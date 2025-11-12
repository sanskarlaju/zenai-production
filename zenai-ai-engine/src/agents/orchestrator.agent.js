const BaseAgent = require('./base.agent');
const ProductManagerAgent = require('./product-manager.agent');
const TaskAnalyzerAgent = require('./task-analyzer.agent');
const CodeReviewerAgent = require('./code-reviewer.agent');
const MeetingSummarizerAgent = require('./meeting-summarizer.agent');

class OrchestratorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'OrchestratorAgent',
      description: 'Orchestrates multiple AI agents to handle complex tasks',
      modelType: 'openai',
      temperature: 0.7,
      maxIterations: 10
    });

    this.agents = {
      productManager: new ProductManagerAgent(),
      taskAnalyzer: new TaskAnalyzerAgent(),
      codeReviewer: new CodeReviewerAgent(),
      meetingSummarizer: new MeetingSummarizerAgent()
    };
  }

  async initialize() {
    await super.initialize();
    
    // Initialize all sub-agents
    await Promise.all([
      this.agents.productManager.initialize(),
      this.agents.taskAnalyzer.initialize()
    ]);
  }

  getSystemPrompt() {
    return `You are an AI Orchestrator that coordinates multiple specialized agents:

**Available Agents:**
1. ProductManager - Project planning, task creation, prioritization
2. TaskAnalyzer - Task complexity analysis, effort estimation
3. CodeReviewer - Code quality, security, best practices
4. MeetingSummarizer - Meeting transcription and action items

**Your Role:**
- Analyze user requests
- Determine which agent(s) to use
- Coordinate multi-agent workflows
- Synthesize results into coherent responses

**Decision Process:**
1. Understand the user's goal
2. Break down complex requests
3. Route to appropriate agents
4. Combine outputs intelligently

Always be efficient and choose the minimum number of agents needed.`;
  }

  async routeRequest(request, context = {}) {
    const routingPrompt = `Analyze this request and determine which agent(s) to use:

Request: "${request}"
Context: ${JSON.stringify(context)}

Return JSON:
{
  "agents": ["agent_name"],
  "workflow": "sequential|parallel",
  "reasoning": "why these agents",
  "expected_output": "what we'll get"
}

Available agents: productManager, taskAnalyzer, codeReviewer, meetingSummarizer`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: routingPrompt }
    ]);

    return JSON.parse(response.content);
  }

  async execute(request, context = {}) {
    try {
      // Route the request
      const routing = await this.routeRequest(request, context);
      
      const results = {};

      if (routing.workflow === 'sequential') {
        // Execute agents sequentially
        for (const agentName of routing.agents) {
          const agent = this.agents[agentName];
          if (agent) {
            results[agentName] = await agent.run(request, {
              ...context,
              previousResults: results
            });
          }
        }
      } else {
        // Execute agents in parallel
        const promises = routing.agents.map(async (agentName) => {
          const agent = this.agents[agentName];
          if (agent) {
            return { [agentName]: await agent.run(request, context) };
          }
        });

        const parallelResults = await Promise.all(promises);
        parallelResults.forEach(result => Object.assign(results, result));
      }

      // Synthesize results
      const synthesis = await this.synthesizeResults(request, results, routing);

      return {
        routing,
        agentResults: results,
        finalResponse: synthesis
      };
    } catch (error) {
      logger.error('Orchestrator execution error:', error);
      throw error;
    }
  }

  async synthesizeResults(request, results, routing) {
    const synthesisPrompt = `Synthesize these agent results into a coherent response:

Original Request: "${request}"

Agent Results:
${JSON.stringify(results, null, 2)}

Create a unified, helpful response that addresses the user's request.`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: synthesisPrompt }
    ]);

    return response.content;
  }

  async handleComplexWorkflow(request, context = {}) {
    // Example: "Create a project plan, analyze tasks, and review code quality"
    const steps = await this.breakdownWorkflow(request);
    
    const workflowResults = [];

    for (const step of steps) {
      const result = await this.execute(step.action, {
        ...context,
        step: step.order,
        previousSteps: workflowResults
      });

      workflowResults.push({
        step: step.order,
        action: step.action,
        result
      });
    }

    return {
      workflow: steps,
      results: workflowResults,
      summary: await this.summarizeWorkflow(workflowResults)
    };
  }

  async breakdownWorkflow(request) {
    const prompt = `Break down this complex request into sequential steps:

Request: "${request}"

Return JSON array:
[{
  "order": 1,
  "action": "specific action",
  "agent": "agent to use",
  "dependencies": []
}]`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }

  async summarizeWorkflow(workflowResults) {
    const prompt = `Summarize this workflow execution:

${JSON.stringify(workflowResults, null, 2)}

Provide:
- What was accomplished
- Key findings
- Recommendations
- Next steps`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return response.content;
  }
}

module.exports = OrchestratorAgent;
