# 🚀 ZenAI - AI-Powered Project Management

Complete production-ready AI-powered project management platform with enterprise-grade architecture, monitoring, and deployment capabilities.

## 📋 Project Structure

```
zenai-production/
├── zenai-backend/          # Node.js REST API backend
├── zenai-frontend/         # React.js web frontend
├── zenai-ai-engine/        # AI agents and orchestration
├── nginx/                  # Nginx reverse proxy config
├── monitoring/             # Prometheus & Grafana setup
├── scripts/               # Deployment & maintenance scripts
├── docs/                  # API & architecture documentation
└── docker-compose.*.yml   # Docker orchestration files
```

## 🎯 Features

### Core Features
- ✅ **AI-Powered Agents** - Multiple specialized AI agents for different tasks
- ✅ **Project Management** - Full project lifecycle management
- ✅ **Task Automation** - AI-driven task creation and breakdown
- ✅ **Audio Transcription** - Meeting notes via Whisper API
- ✅ **Document Embeddings** - RAG-based document search
- ✅ **Real-time Collaboration** - WebSocket support
- ✅ **Analytics Dashboard** - Project & team metrics

### Technical Features
- ✅ **Enterprise Security** - Helmet, rate limiting, input validation
- ✅ **High Availability** - Load balanced with horizontal scaling
- ✅ **Observability** - Prometheus metrics + Grafana dashboards
- ✅ **Automated Backups** - Database backup scripts
- ✅ **CI/CD Pipeline** - GitHub Actions workflow included
- ✅ **Production Monitoring** - Real-time health checks
- ✅ **API Documentation** - Swagger/OpenAPI specs

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB 6+
- Redis 7+
- OpenAI API key

### Development Setup

```bash
# Clone the repository
git clone <repo-url>
cd zenai-production

# Create environment files
cp zenai-backend/.env.example zenai-backend/.env.development
cp zenai-ai-engine/.env.example zenai-ai-engine/.env
cp zenai-frontend/.env.example zenai-frontend/.env

# Start services with Docker Compose (development)
docker-compose up -d

# Install frontend dependencies
cd zenai-frontend
npm install
npm run dev

# In another terminal, start backend (local)
cd zenai-backend
npm install
npm run dev
```

### Production Deployment

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 📊 Architecture

### Components

**Backend Service** (Node.js/Express)
- REST API server
- Authentication & Authorization
- Database ORM (Mongoose)
- Redis caching layer
- WebSocket support

**AI Engine** (Node.js)
- LangChain orchestration
- Multiple AI agents (Product Manager, Task Analyzer, Meeting Summarizer)
- Vector embeddings (Pinecone)
- Document processing
- OpenAI integration

**Frontend** (React/Vite)
- Modern UI with Tailwind CSS
- Real-time chat interface
- Project & task management
- Analytics dashboard
- Audio upload & transcription

**Infrastructure**
- Nginx reverse proxy with load balancing
- MongoDB for persistence
- Redis for caching & session management
- Prometheus for metrics collection
- Grafana for visualization

## 🔐 Security

### Implemented Security Measures
- **HTTPS/TLS** - SSL certificates with auto-renewal
- **Authentication** - JWT with refresh tokens
- **Rate Limiting** - Per-endpoint configuration
- **Input Validation** - Joi schemas for all inputs
- **NoSQL Injection Prevention** - MongoDB sanitization
- **XSS Protection** - Content Security Policy headers
- **CSRF Protection** - Token validation
- **API Key Management** - Secure API key generation and validation

## 📈 Monitoring & Observability

### Metrics Collection
- Application metrics (response time, error rate, throughput)
- AI request tracking (duration, success rate, agent performance)
- Database connection pool metrics
- Redis cache hit rates
- System resource usage

### Dashboards
- Access Grafana: `http://localhost:3001` (default password from `.env`)
- Prometheus: `http://localhost:9090`
- Health check: `http://localhost/health`

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Load testing
npm run test:load

# Test coverage
npm run test -- --coverage
```

## 📚 API Documentation

### Main Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh JWT token

#### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

#### Tasks
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task details
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

#### AI Features
- `POST /api/v1/ai/chat` - Chat with AI agent
- `GET /api/v1/ai/chat/history` - Get chat history
- `POST /api/v1/ai/tasks/create` - Create task from description
- `GET /api/v1/ai/tasks/:id/analyze` - Analyze task
- `POST /api/v1/ai/transcribe` - Transcribe audio
- `GET /api/v1/ai/documents/search` - Search indexed documents

Full API documentation: `/api/docs`

## 🔄 Deployment & Scaling

### Horizontal Scaling
```bash
# Scale backend replicas
docker-compose -f docker-compose.prod.yml up --scale backend=3
```

### Database Backup
```bash
# Run backup script
bash scripts/backup.sh

# Restore from backup
bash scripts/restore.sh
```

### SSL Certificate Renewal
```bash
# Automated renewal via Let's Encrypt
docker-compose -f docker-compose.prod.yml exec nginx \
  certbot renew --quiet
```

## 📝 Environment Configuration

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://user:pass@mongodb:27017/zenai
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
CORS_ORIGIN=https://your-domain.com
```

### AI Engine (.env)
```env
NODE_ENV=production
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
MODEL_NAME=gpt-4
```

### Frontend (.env)
```env
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
```

## 🆘 Troubleshooting

### Services won't start
```bash
# Check Docker status
docker ps -a

# View logs
docker-compose logs -f backend

# Restart all services
docker-compose restart
```

### Database connection issues
```bash
# Check MongoDB
docker-compose exec mongodb mongo

# Reset database
docker-compose exec mongodb mongosh
db.dropDatabase()
```

### Performance issues
```bash
# Monitor resource usage
docker stats

# Check metrics in Prometheus
curl http://localhost:9090/api/v1/query?query=process_resident_memory_bytes
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | Change port in `.env` or `docker-compose.yml` |
| SSL certificate error | Run `bash scripts/generate-ssl.sh` |
| Database migration failed | Check migration logs, restart containers |
| AI requests timing out | Increase timeout in `.env`, check OpenAI quota |
| High memory usage | Enable Redis caching, implement pagination |

## 📖 Documentation

- [API Documentation](./docs/api.md)
- [Architecture Guide](./docs/architecture.md)
- [Agent Documentation](./docs/agents.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Create Pull Request

## 📋 Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups automated
- [ ] Rate limiting configured
- [ ] Monitoring dashboards setup
- [ ] Health checks passing
- [ ] Load tests completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained on deployment

## 📞 Support

For issues or questions:
1. Check the [documentation](./docs)
2. Review [GitHub Issues](https://github.com/yourrepo/issues)
3. Create a new issue with detailed information

## 📄 License

This project is proprietary and confidential.

## 🔗 Useful Links

- **Production Server**: https://your-domain.com
- **API Server**: https://api.your-domain.com
- **Grafana Dashboard**: https://monitoring.your-domain.com
- **Backend Repo**: zenai-backend/
- **Frontend Repo**: zenai-frontend/
- **AI Engine Repo**: zenai-ai-engine/

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
