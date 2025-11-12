// src/agents/product-manager.agent.js
const BaseAgent = require('./base.agent');
const { DynamicTool } = require('langchain/tools');

class ProductManagerAgent extends BaseAgent {
  constructor() {
    const tools = [
      new DynamicTool({
        name: 'create_task',
        description: 'Create a new task in the project management system',
        func: async (input) => {
          const taskData = JSON.parse(input);
          // Call your API to create task
          return `Task created: ${taskData.title}`;
        }
      }),
      new DynamicTool({
        name: 'analyze_project',
        description: 'Analyze project health and provide insights',
        func: async (projectId) => {
          // Analyze project metrics
          return `Project analysis complete for ${projectId}`;
        }
      }),
      new DynamicTool({
        name: 'prioritize_tasks',
        description: 'Prioritize tasks based on urgency and importance',
        func: async (input) => {
          const tasks = JSON.parse(input);
          // Implement prioritization logic
          return `Tasks prioritized: ${tasks.length} items`;
        }
      })
    ];

    super({
      name: 'ProductManagerAgent',
      description: 'An AI Product Manager that helps organize projects, create tasks, and provide strategic insights',
      tools,
      modelType: 'openai',
      temperature: 0.7,
      maxIterations: 5,
      verbose: true
    });
  }

  getSystemPrompt() {
    return `You are an expert AI Product Manager for ZenAI platform. Your responsibilities include:

**Core Capabilities:**
- Creating and managing tasks and projects
- Analyzing project health and providing actionable insights
- Prioritizing work based on business impact
- Breaking down complex projects into manageable tasks
- Suggesting improvements to workflow efficiency
- Identifying bottlenecks and risks

**Communication Style:**
- Professional yet friendly
- Data-driven decision making
- Proactive problem solving
- Clear and concise explanations
- Use emojis occasionally for engagement

**Available Actions:**
- create_task: Create new tasks with proper structure
- analyze_project: Deep dive into project metrics
- prioritize_tasks: Smart task prioritization

Always provide actionable recommendations and be proactive in identifying issues.`;
  }

  async createTaskFromDescription(description, projectId) {
    const prompt = `Based on this description, create a structured task:
    
Description: "${description}"
Project ID: ${projectId}

Extract and return JSON with:
- title (concise, action-oriented)
- description (detailed)
- priority (low/medium/high/urgent)
- estimatedTime (in hours)
- tags (relevant tags)
- suggestedAssignee (if mentioned)

Return only valid JSON.`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse task JSON:', error);
      throw new Error('Invalid task structure generated');
    }
  }

  async analyzeProjectHealth(projectData, tasks) {
    const prompt = `Analyze this project and provide insights:

Project: ${projectData.name}
Status: ${projectData.status}
Deadline: ${projectData.deadline}
Total Tasks: ${tasks.length}
Completed: ${tasks.filter(t => t.status === 'done').length}
In Progress: ${tasks.filter(t => t.status === 'in-progress').length}
Overdue: ${tasks.filter(t => new Date(t.dueDate) < new Date()).length}

Provide analysis in JSON format:
{
  "healthScore": 0-100,
  "status": "healthy|at-risk|critical",
  "insights": ["insight1", "insight2"],
  "risks": ["risk1", "risk2"],
  "recommendations": ["action1", "action2"]
}`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }

  async suggestTaskBreakdown(epicTask) {
    const prompt = `Break down this epic into smaller, actionable tasks:

Epic: ${epicTask.title}
Description: ${epicTask.description}

Create 3-7 subtasks that are:
- Specific and actionable
- Can be completed in 1-3 days
- Have clear acceptance criteria

Return JSON array:
[{
  "title": "Task title",
  "description": "What needs to be done",
  "estimatedTime": 4,
  "priority": "medium",
  "dependencies": []
}]`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }
}

module.exports = ProductManagerAgent;