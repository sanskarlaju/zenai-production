// src/agents/task-analyzer.agent.js
const BaseAgent = require('./base.agent');
const { DynamicTool } = require('langchain/tools');

class TaskAnalyzerAgent extends BaseAgent {
  constructor() {
    const tools = [
      new DynamicTool({
        name: 'estimate_complexity',
        description: 'Estimate task complexity on a scale of 1-10',
        func: async (taskDescription) => {
          // Complexity estimation logic
          return 'Complexity score: 7/10';
        }
      }),
      new DynamicTool({
        name: 'suggest_dependencies',
        description: 'Identify task dependencies',
        func: async (input) => {
          // Dependency analysis
          return 'Dependencies identified';
        }
      })
    ];

    super({
      name: 'TaskAnalyzerAgent',
      description: 'Analyzes tasks for complexity, dependencies, and optimal execution',
      tools,
      modelType: 'openai',
      temperature: 0.3, // Lower temperature for analytical tasks
      maxIterations: 3
    });
  }

  getSystemPrompt() {
    return `You are a Task Analysis Expert. You analyze software development and project tasks to:
- Estimate complexity and effort
- Identify dependencies and blockers
- Suggest optimal execution strategies
- Flag potential risks
- Recommend skill requirements

Be precise and data-driven in your analysis.`;
  }

  async analyzeTask(task, projectContext) {
    const prompt = `Analyze this task in detail:

Task: ${task.title}
Description: ${task.description}
Project Context: ${projectContext}

Provide comprehensive analysis:
{
  "complexityScore": 1-10,
  "estimatedHours": number,
  "skillsRequired": ["skill1", "skill2"],
  "dependencies": ["dep1", "dep2"],
  "risks": ["risk1"],
  "recommendations": ["rec1"],
  "blockers": ["blocker1"]
}`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }

  async estimateEffort(tasks) {
    const taskDescriptions = tasks.map(t => 
      `- ${t.title}: ${t.description}`
    ).join('\n');

    const prompt = `Estimate effort for these tasks:

${taskDescriptions}

Return JSON:
{
  "totalHours": number,
  "taskEstimates": [
    {"taskId": "id", "hours": number, "confidence": "high|medium|low"}
  ],
  "criticalPath": ["taskId1", "taskId2"]
}`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }
}

module.exports = TaskAnalyzerAgent;