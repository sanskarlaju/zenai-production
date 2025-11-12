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
- `audio`: Audio file (mp3, wav, m4a, etc.)
- `metadata`: JSON with meeting details

**Response** (200):
```json
{
  "success": true,
  "data": {
    "transcription": {
      "text": "Full meeting transcript...",
      "duration": 1800,
      "language": "en"
    },
    "summary": {
      "executiveSummary": "Team discussed Q1 priorities...",
      "keyPoints": ["Feature X approved", "Budget allocated"],
      "decisions": ["Use React for frontend"],
      "actionItems": [
        {
          "action": "Setup development environment",
          "owner": "Alice",
          "dueDate": "2024-01-20",
          "priority": "high"
        }
      ]
    }
  }
}
```

---

## 📋 Project Endpoints

### Get All Projects
```http
GET /projects
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Response** (200):
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "proj_123",
        "name": "ZenAI Platform",
        "description": "AI-powered project management",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "pages": 3
    }
  }
}
```

### Get Project by ID
```http
GET /projects/:projectId
```

### Create Project
```http
POST /projects
```

**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30"
}
```

### Update Project
```http
PUT /projects/:projectId
```

### Delete Project
```http
DELETE /projects/:projectId
```

---

## ✅ Task Endpoints

### Get All Tasks
```http
GET /tasks
```

**Query Parameters**:
- `projectId` (optional): Filter by project
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority

### Get Task by ID
```http
GET /tasks/:taskId
```

### Create Task
```http
POST /tasks
```

**Request Body**:
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication",
  "projectId": "proj_123",
  "priority": "high",
  "estimatedTime": 16,
  "tags": ["backend", "security"]
}
```

### Update Task
```http
PUT /tasks/:taskId
```

### Delete Task
```http
DELETE /tasks/:taskId
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /notifications
```

### Mark as Read
```http
PUT /notifications/:notificationId/read
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API requests are rate limited per user:

- **Standard Endpoints**: 100 requests per 15 minutes
- **Auth Endpoints**: 5 requests per 15 minutes
- **AI Endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## Webhooks

ZenAI supports webhooks for real-time event notifications.

### Webhook Events

- `task.created`
- `task.updated`
- `task.completed`
- `project.created`
- `project.updated`

### Webhook Payload Format

```json
{
  "event": "task.created",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "taskId": "task_123",
    "projectId": "proj_123",
    "title": "New Task"
  }
}
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const ZenAI = require('@zenai/sdk');

const client = new ZenAI({
  apiKey: process.env.ZENAI_API_KEY
});

// Create task with AI
const task = await client.ai.createTask({
  description: 'Implement user authentication',
  projectId: 'proj_123'
});

// Get project health analysis
const health = await client.ai.analyzeProject('proj_123');
```

### Python

```python
from zenai import ZenAI

client = ZenAI(api_key=os.getenv('ZENAI_API_KEY'))

# Create task
task = client.ai.create_task(
    description='Implement user authentication',
    project_id='proj_123'
)

# Analyze project
health = client.ai.analyze_project('proj_123')
```

---

## Best Practices

1. **Authentication**: Always store API keys securely using environment variables
2. **Error Handling**: Implement retry logic for transient errors
3. **Rate Limiting**: Implement exponential backoff when rate limited
4. **Caching**: Cache responses when appropriate to reduce API calls
5. **Webhooks**: Use webhooks for real-time updates instead of polling
