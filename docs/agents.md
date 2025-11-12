# 🤖 ZenAI Agents Documentation

## Overview

ZenAI uses multiple specialized AI agents built with LangChain to handle different aspects of project management. Each agent is designed with specific capabilities and tools.

## Agent Architecture

All agents inherit from the `BaseAgent` class which provides:
- Model initialization (OpenAI/Anthropic)
- Memory management
- Tool execution
- Error handling

## Available Agents

### 1. Product Manager Agent

**Purpose**: Helps organize projects, create tasks, and provide strategic insights

**Capabilities**:
- Create structured tasks from natural language descriptions
- Analyze project health and metrics
- Prioritize tasks based on business impact
- Break down epics into subtasks
- Suggest workflow improvements
- Identify bottlenecks and risks

**Tools**:
- `create_task`: Creates tasks in the system
- `analyze_project`: Analyzes project metrics
- `prioritize_tasks`: Intelligent task prioritization

**Example Usage**:
```javascript
const agent = new ProductManagerAgent();
await agent.initialize();

// Create task from description
const task = await agent.createTaskFromDescription(
  "Implement user authentication with OAuth",
  "project_123"
);

// Analyze project health
const health = await agent.analyzeProjectHealth(
  projectData,
  tasks
);
```

**System Prompt**:
```
You are an expert AI Product Manager for ZenAI platform. Your responsibilities include:

Core Capabilities:
- Creating and managing tasks and projects
- Analyzing project health and providing actionable insights
- Prioritizing work based on business impact
- Breaking down complex projects into manageable tasks
- Suggesting improvements to workflow efficiency
- Identifying bottlenecks and risks

Communication Style:
- Professional yet friendly
- Data-driven decision making
- Proactive problem solving
- Clear and concise explanations

Always provide actionable recommendations and be proactive in identifying issues.
```

---

### 2. Task Analyzer Agent

**Purpose**: Analyzes tasks for complexity, dependencies, and optimal execution

**Capabilities**:
- Estimate task complexity (1-10 scale)
- Calculate effort in hours
- Identify dependencies and blockers
- Recommend required skills
- Flag potential risks
- Suggest execution strategies

**Tools**:
- `estimate_complexity`: Estimates task difficulty
- `suggest_dependencies`: Identifies task dependencies

**Example Usage**:
```javascript
const agent = new TaskAnalyzerAgent();
await agent.initialize();

// Analyze single task
const analysis = await agent.analyzeTask(task, projectContext);
console.log(analysis.complexityScore); // 7/10
console.log(analysis.estimatedHours); // 16
console.log(analysis.risks); // ["API integration complexity"]

// Estimate effort for multiple tasks
const estimates = await agent.estimateEffort(tasks);
console.log(estimates.totalHours); // 120
console.log(estimates.criticalPath); // ["task1", "task3", "task5"]
```

**Output Format**:
```json
{
  "complexityScore": 7,
  "estimatedHours": 16,
  "skillsRequired": ["Node.js", "MongoDB", "JWT"],
  "dependencies": ["Setup database", "Configure auth middleware"],
  "risks": ["Third-party API reliability"],
  "recommendations": ["Implement retry logic", "Add comprehensive tests"],
  "blockers": []
}
```

---

### 3. Meeting Summarizer Agent

**Purpose**: Transcribes meetings and generates summaries with action items

**Capabilities**:
- Transcribe audio using Whisper API
- Extract key discussion points
- Identify decisions made
- List action items with owners
- Capture questions and blockers
- Generate professional meeting reports

**Integration**: Works with WhisperService

**Example Usage**:
```javascript
const agent = new MeetingSummarizerAgent();

// Transcribe and summarize meeting
const result = await agent.transcribeAndSummarize(
  '/path/to/meeting.mp3',
  {
    title: 'Sprint Planning Meeting',
    participants: ['Alice', 'Bob', 'Charlie'],
    date: '2024-01-15'
  }
);

console.log(result.summary.executiveSummary);
console.log(result.actionItems);
console.log(result.transcription.text);
```

**Output Format**:
```json
{
  "transcription": {
    "text": "Full meeting transcript...",
    "duration": 1800,
    "language": "en"
  },
  "summary": {
    "executiveSummary": "Team discussed Q1 priorities...",
    "keyPoints": ["Feature X approved", "Budget allocated"],
    "decisions": ["Use React for frontend"],
    "nextSteps": ["Setup dev environment", "Create wireframes"],
    "questions": ["Which API version to use?"],
    "blockers": ["Waiting for design approval"]
  },
  "actionItems": [
    {
      "action": "Setup development environment",
      "owner": "Alice",
      "dueDate": "2024-01-20",
      "priority": "high"
    }
  ]
}
```

---

### 4. Code Reviewer Agent

**Purpose**: Review code for quality, security, and best practices

**Capabilities**:
- Analyze code quality
- Identify security vulnerabilities
- Suggest performance improvements
- Check best practices adherence
- Review test coverage
- Provide refactoring suggestions

**Example Usage**:
```javascript
const agent = new CodeReviewerAgent();

const review = await agent.reviewCode({
  language: 'javascript',
  code: codeString,
  context: 'Express API endpoint'
});

console.log(review.issues); // Security, performance, style issues
console.log(review.suggestions); // Improvement recommendations
```

---

### 5. Orchestrator Agent

**Purpose**: Coordinates multiple agents for complex workflows

**Capabilities**:
- Route requests to appropriate agents
- Chain multiple agent operations
- Aggregate results from multiple agents
- Handle complex multi-step workflows

**Example Usage**:
```javascript
const orchestrator = new OrchestratorAgent();

// Complex workflow: Create project → Analyze → Generate tasks
const result = await orchestrator.run({
  workflow: 'project-setup',
  input: {
    projectName: 'E-commerce Platform',
    description: 'Build online store with React and Node.js'
  }
});
```

## Agent Configuration

### Model Selection
```javascript
// OpenAI GPT-4
const config = {
  modelType: 'openai',
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 2000
};

// Anthropic Claude
const config = {
  modelType: 'anthropic',
  modelName: 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 2000
};
```

### Memory Configuration
```javascript
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
  inputKey: 'input',
  outputKey: 'output'
});
```

## Best Practices

### 1. Error Handling
```javascript
try {
  const result = await agent.run(input, context);
  return result;
} catch (error) {
  logger.error(`Agent error: ${error.message}`);
  // Implement fallback logic
  return defaultResponse;
}
```

### 2. Context Management
```javascript
// Provide relevant context
const context = {
  projectId: 'proj_123',
  userId: 'user_456',
  previousActions: [],
  preferences: {}
};

const result = await agent.run(input, context);
```

### 3. Token Management
```javascript
// Monitor token usage
const tokens = countTokens(input);
if (tokens > MAX_TOKENS) {
  input = truncate(input, MAX_TOKENS);
}
```

### 4. Caching
```javascript
// Cache agent responses
const cacheKey = `agent:${agentName}:${hash(input)}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const result = await agent.run(input);
await cache.set(cacheKey, result, 3600);
```

## Performance Optimization

### 1. Parallel Agent Execution
```javascript
const [taskAnalysis, projectHealth] = await Promise.all([
  taskAnalyzer.analyzeTask(task),
  productManager.analyzeProjectHealth(project, tasks)
]);
```

### 2. Streaming Responses
```javascript
const agent = new ProductManagerAgent({
  streaming: true
});

agent.on('token', (token) => {
  // Stream tokens to client
  res.write(token);
});
```

### 3. Agent Pooling
```javascript
// Maintain agent pool for reuse
class AgentPool {
  constructor(AgentClass, size = 5) {
    this.pool = Array(size).fill(null).map(() => new AgentClass());
  }

  async execute(input) {
    const agent = this.getAvailableAgent();
    return await agent.run(input);
  }
}
```

## Monitoring

### Agent Metrics
- Request count per agent
- Average response time
- Success/failure rate
- Token usage
- Error types and frequency

### Logging
```javascript
logger.info('Agent execution', {
  agent: agent.name,
  input: input.substring(0, 100),
  duration: responseTime,
  tokens: tokensUsed
});
```

## Testing Agents

```javascript
describe('ProductManagerAgent', () => {
  let agent;

  beforeAll(async () => {
    agent = new ProductManagerAgent();
    await agent.initialize();
  });

  test('should create task from description', async () => {
    const task = await agent.createTaskFromDescription(
      'Add user login feature',
      'project_123'
    );

    expect(task.title).toBeDefined();
    expect(task.priority).toMatch(/low|medium|high|urgent/);
  });

  afterAll(() => {
    agent.clearMemory();
  });
});
```
