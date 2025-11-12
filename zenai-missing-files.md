# 🗂️ ZenAI Missing Files - Complete Code

## 📁 AI Engine Files

### **similarity-search.js**
```javascript
// src/embeddings/similarity-search.js
const { OpenAIEmbeddings } = require('@langchain/openai');
const { PineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../utils/logger');

class SimilaritySearchService {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT
    });

    this.vectorStore = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const indexName = process.env.PINECONE_INDEX || 'zenai-embeddings';
      this.index = this.pinecone.Index(indexName);

      this.vectorStore = await PineconeStore.fromExistingIndex(
        this.embeddings,
        { pineconeIndex: this.index }
      );

      this.initialized = true;
      logger.info('Similarity search service initialized');
    } catch (error) {
      logger.error('Similarity search initialization error:', error);
      throw error;
    }
  }

  async search(query, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const {
        k = 5,
        filter = {},
        scoreThreshold = 0.7,
        namespace = 'default'
      } = options;

      // Perform similarity search with scores
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        k,
        filter
      );

      // Filter by score threshold
      const filteredResults = results
        .filter(([doc, score]) => score >= scoreThreshold)
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: score,
          relevance: this.calculateRelevance(score)
        }));

      logger.info(`Similarity search returned ${filteredResults.length} results`);

      return {
        results: filteredResults,
        query,
        totalResults: filteredResults.length,
        options: { k, scoreThreshold }
      };
    } catch (error) {
      logger.error('Similarity search error:', error);
      throw error;
    }
  }

  async searchByVector(vector, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const { k = 5, filter = {} } = options;

      const results = await this.index.query({
        vector,
        topK: k,
        filter,
        includeMetadata: true
      });

      return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
        relevance: this.calculateRelevance(match.score)
      }));
    } catch (error) {
      logger.error('Vector search error:', error);
      throw error;
    }
  }

  async searchRelatedDocuments(documentId, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const { k = 5 } = options;

      // Get the document's vector
      const docVector = await this.index.fetch([documentId]);
      
      if (!docVector.vectors[documentId]) {
        throw new Error('Document not found');
      }

      const vector = docVector.vectors[documentId].values;

      // Search for similar documents
      const results = await this.searchByVector(vector, {
        k: k + 1, // +1 to exclude the original document
        filter: { documentId: { $ne: documentId } }
      });

      return results.slice(0, k);
    } catch (error) {
      logger.error('Related documents search error:', error);
      throw error;
    }
  }

  async hybridSearch(query, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const {
        k = 10,
        semanticWeight = 0.7,
        keywordWeight = 0.3,
        filter = {}
      } = options;

      // Semantic search
      const semanticResults = await this.search(query, { k, filter });

      // Simple keyword matching (you can enhance this with BM25 or similar)
      const keywords = query.toLowerCase().split(' ');
      const keywordResults = semanticResults.results.map(result => {
        const content = result.content.toLowerCase();
        const keywordScore = keywords.reduce((score, keyword) => {
          return score + (content.includes(keyword) ? 1 : 0);
        }, 0) / keywords.length;

        return {
          ...result,
          keywordScore,
          hybridScore: (result.score * semanticWeight) + (keywordScore * keywordWeight)
        };
      });

      // Sort by hybrid score
      keywordResults.sort((a, b) => b.hybridScore - a.hybridScore);

      return {
        results: keywordResults.slice(0, k),
        query,
        method: 'hybrid',
        weights: { semantic: semanticWeight, keyword: keywordWeight }
      };
    } catch (error) {
      logger.error('Hybrid search error:', error);
      throw error;
    }
  }

  async multiQuerySearch(queries, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const { k = 5, aggregation = 'union' } = options;

      // Search for each query
      const searchPromises = queries.map(query => 
        this.search(query, { k, ...options })
      );

      const allResults = await Promise.all(searchPromises);

      let finalResults;
      if (aggregation === 'union') {
        // Combine all unique results
        const resultsMap = new Map();
        allResults.forEach(({ results }) => {
          results.forEach(result => {
            const key = result.metadata.id || result.content;
            if (!resultsMap.has(key) || resultsMap.get(key).score < result.score) {
              resultsMap.set(key, result);
            }
          });
        });
        finalResults = Array.from(resultsMap.values());
      } else if (aggregation === 'intersection') {
        // Only results that appear in all queries
        const resultCounts = new Map();
        allResults.forEach(({ results }) => {
          results.forEach(result => {
            const key = result.metadata.id || result.content;
            resultCounts.set(key, (resultCounts.get(key) || 0) + 1);
          });
        });
        finalResults = Array.from(resultCounts.entries())
          .filter(([key, count]) => count === queries.length)
          .map(([key]) => key);
      }

      // Sort by score
      finalResults.sort((a, b) => b.score - a.score);

      return {
        results: finalResults.slice(0, k),
        queries,
        aggregation,
        totalResults: finalResults.length
      };
    } catch (error) {
      logger.error('Multi-query search error:', error);
      throw error;
    }
  }

  calculateRelevance(score) {
    if (score >= 0.9) return 'very_high';
    if (score >= 0.8) return 'high';
    if (score >= 0.7) return 'medium';
    if (score >= 0.6) return 'low';
    return 'very_low';
  }

  async getStats(namespace = 'default') {
    try {
      const stats = await this.index.describeIndexStats();
      return {
        totalVectors: stats.totalVectorCount,
        dimension: stats.dimension,
        namespaces: stats.namespaces
      };
    } catch (error) {
      logger.error('Get stats error:', error);
      throw error;
    }
  }

  async deleteByMetadata(filter) {
    if (!this.initialized) await this.initialize();

    try {
      await this.index.delete1({
        filter,
        deleteAll: false
      });

      logger.info('Documents deleted by metadata filter');
      return { success: true };
    } catch (error) {
      logger.error('Delete by metadata error:', error);
      throw error;
    }
  }
}

module.exports = SimilaritySearchService;
```

---

## 📚 Documentation Files

### **architecture.md**
```markdown
# 🏗️ ZenAI Architecture Documentation

## System Overview

ZenAI is an AI-powered project management platform built with a microservices architecture. The system consists of three main layers:

1. **Frontend Layer** - React-based user interface
2. **Backend Layer** - Node.js/Express REST API
3. **AI Engine Layer** - LangChain-based AI agents and services

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                    (React + Tailwind CSS)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────┴────────────────────────────────────────┐
│                       Load Balancer                             │
│                      (Nginx + SSL)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                    Backend API Layer                            │
│                  (Node.js + Express)                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Auth       │  │   Projects   │  │   AI API     │        │
│  │  Controller  │  │  Controller  │  │  Controller  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────┬──────────────────┬──────────────────┬─────────────────┘
         │                  │                  │
         │                  │                  │
    ┌────┴────┐       ┌────┴────┐      ┌─────┴─────────────┐
    │ MongoDB │       │  Redis  │      │   AI Engine       │
    │         │       │  Cache  │      │   (LangChain)     │
    └─────────┘       └─────────┘      │                   │
                                        │  ┌─────────────┐  │
                                        │  │   Agents    │  │
                                        │  ├─────────────┤  │
                                        │  │  Whisper    │  │
                                        │  ├─────────────┤  │
                                        │  │   RAG/VDB   │  │
                                        │  └─────────────┘  │
                                        └───────┬───────────┘
                                                │
                                        ┌───────┴───────────┐
                                        │   OpenAI API      │
                                        │   Pinecone        │
                                        └───────────────────┘
```

## Component Details

### 1. Frontend Layer
- **Technology**: React 18, TailwindCSS, Axios
- **Features**:
  - Project dashboard
  - Task management
  - AI chat interface
  - Real-time updates via WebSocket
  - Audio recording for meetings

### 2. Backend API Layer
- **Technology**: Node.js, Express, MongoDB, Redis
- **Components**:
  - **Authentication**: JWT-based auth with refresh tokens
  - **API Gateway**: RESTful API with versioning
  - **Middleware**: Auth, validation, rate limiting, error handling
  - **Cache Layer**: Redis for session and query caching
  - **Database**: MongoDB with Mongoose ODM

### 3. AI Engine Layer
- **Technology**: LangChain, OpenAI, Anthropic
- **Components**:
  - **Agents**:
    - Product Manager Agent
    - Task Analyzer Agent
    - Code Reviewer Agent
    - Meeting Summarizer Agent
  - **Chains**: LangChain chains for complex workflows
  - **Tools**: Integration with Notion, Slack, GitHub
  - **Memory**: Conversation history and context management
  - **Vector Store**: Pinecone for RAG implementation

## Data Flow

### Task Creation Flow
```
User Input → Backend Controller → AI Service → Product Manager Agent
                                                        ↓
                                              OpenAI API (GPT-4)
                                                        ↓
MongoDB ← Backend Controller ← AI Service ← Structured Task Data
```

### Meeting Transcription Flow
```
Audio File → Backend Upload → AI Service → Whisper Service
                                                  ↓
                                          OpenAI Whisper API
                                                  ↓
                    Meeting Summarizer Agent ← Transcription
                                ↓
                          AI Analysis
                                ↓
             Summary + Action Items → MongoDB → User
```

## Security Architecture

### Authentication Flow
1. User logs in with credentials
2. Backend validates and generates JWT access token (7 days)
3. Refresh token generated (30 days) and stored in DB
4. Access token sent in Authorization header
5. Middleware validates token on each request

### Rate Limiting
- **API Endpoints**: 100 requests per 15 minutes
- **Auth Endpoints**: 5 attempts per 15 minutes
- **AI Endpoints**: 10 requests per minute

### Data Protection
- Passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted at rest
- HTTPS/TLS 1.3 for data in transit
- Input sanitization against XSS and NoSQL injection

## Scalability

### Horizontal Scaling
- Backend API can be scaled to N instances
- Load balancer distributes traffic
- Stateless design (sessions in Redis)
- Database read replicas for read-heavy operations

### Caching Strategy
- **L1 Cache**: In-memory (Node.js)
- **L2 Cache**: Redis (shared across instances)
- **Cache Invalidation**: Event-driven updates

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling (max 10 connections)
- Query optimization with explain()
- Aggregation pipelines for complex queries

## Monitoring & Observability

### Metrics Collection
- **Application Metrics**: Prometheus
- **Visualization**: Grafana dashboards
- **Logging**: Winston with daily rotation
- **Error Tracking**: Sentry integration
- **APM**: New Relic or DataDog

### Key Metrics
- Request rate and latency
- Error rate by endpoint
- AI request success rate
- Database query performance
- Cache hit ratio
- Memory and CPU usage

## Deployment Strategy

### Environments
1. **Development**: Local Docker Compose
2. **Staging**: AWS ECS or DigitalOcean
3. **Production**: Kubernetes or Docker Swarm

### CI/CD Pipeline
```
Git Push → GitHub Actions → Run Tests → Build Docker Images
                                              ↓
                                    Push to Registry
                                              ↓
                                Deploy to Production
                                              ↓
                                    Health Checks
                                              ↓
                                  Rollback if Failed
```

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React, TailwindCSS, Axios |
| Backend | Node.js, Express, MongoDB, Redis |
| AI Engine | LangChain, OpenAI, Anthropic |
| Vector DB | Pinecone / ChromaDB |
| Cache | Redis |
| Load Balancer | Nginx |
| Monitoring | Prometheus, Grafana |
| Logging | Winston |
| Deployment | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## Performance Targets

- **API Response Time**: < 200ms (p95)
- **AI Response Time**: < 5s (p95)
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%
- **Concurrent Users**: 10,000+
```

### **agents.md**
```markdown
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
```

### **api.md**
```markdown
# 📡 ZenAI API Documentation

## Base URL
```
Production: https://api.zenai.com/v1
Development: http://localhost:5000/api/v1
```

## Authentication

All API requests (except auth endpoints) require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Token Lifespan
- Access Token: 7 days
- Refresh Token: 30 days

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```http
POST /auth/logout
```

### Get Profile
```http
GET /auth/profile
```

---

## 🤖 AI Endpoints

### Chat with AI
```http
POST /ai/chat
```

**Request Body**:
```json
{
  "message": "Create a task for implementing user authentication",
  "context": {
    "type": "project-management",
    "projectId": "proj_123"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "response": "I'll help you create a task for user authentication...",
    "metadata": {
      "responseTime": 1250,
      "agent": "product-manager"
    }
  }
}
```

### Create Task with AI
```http
POST /ai/tasks/create
```

**Request Body**:
```json
{
  "description": "Build user login with Google OAuth and email/password options",
  "projectId": "proj_123"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "task_456",
    "title": "Implement User Authentication System",
    "description": "Build comprehensive auth system...",
    "priority": "high",
    "estimatedTime": 16,
    "tags": ["authentication", "security", "backend"],
    "acceptanceCriteria": [
      "User can register with email",
      "OAuth integration working",
      "JWT tokens generated"
    ]
  }
}
```

### Analyze Task
```http
GET /ai/tasks/:taskId/analyze
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "complexityScore": 7,
    "estimatedHours": 16,
    "skillsRequired": ["Node.js", "OAuth", "JWT", "MongoDB"],
    "dependencies": ["Database setup", "Email service"],
    "risks": ["Third-party OAuth service downtime"],
    "recommendations": [
      "Implement comprehensive error handling",
      "Add rate limiting to auth endpoints"
    ],
    "blockers": []
  }
}
```

### Analyze Project Health
```http
GET /ai/projects/:projectId/analyze
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "healthScore": 75,
    "status": "healthy",
    "insights": [
      "Project is on track for deadline",
      "Good task completion rate",
      "Team velocity is consistent"
    ],
    "risks": [
      "3 tasks overdue",
      "Testing coverage below target"
    ],
    "recommendations": [
      "Prioritize overdue tasks",
      "Allocate time for testing",
      "Consider adding another developer"
    ]
  }
}
```

### Transcribe Audio/Meeting
```http
POST /ai/transcribe
Content-Type: multipart/form-data
```

**Form Data**:
- `audio`: Audio file (mp3, wav, m4a,