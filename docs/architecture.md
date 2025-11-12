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
