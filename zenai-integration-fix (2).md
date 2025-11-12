# 🚀 ZenAI - Complete Integration & Production Setup

## 📋 Table of Contents
1. [Missing Integration Files](#missing-integration-files)
2. [Production Architecture](#production-architecture)
3. [Deployment Guide](#deployment-guide)
4. [Monitoring & Security](#monitoring--security)

---

## 🔧 Missing Integration Files

### **1. AI Service (Bridge Layer)**
```javascript
// src/services/ai.service.js
const ProductManagerAgent = require('../../zenai-ai-engine/src/agents/product-manager.agent');
const TaskAnalyzerAgent = require('../../zenai-ai-engine/src/agents/task-analyzer.agent');
const MeetingSummarizerAgent = require('../../zenai-ai-engine/src/agents/meeting-summarizer.agent');
const WhisperService = require('../../zenai-ai-engine/src/whisper/transcription.service');
const DocumentProcessor = require('../../zenai-ai-engine/src/embeddings/document-processor');
const ChatMessage = require('../models/ChatMessage.model');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.productManager = null;
    this.taskAnalyzer = null;
    this.meetingSummarizer = null;
    this.whisperService = null;
    this.documentProcessor = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize all AI agents
      this.productManager = new ProductManagerAgent();
      await this.productManager.initialize();

      this.taskAnalyzer = new TaskAnalyzerAgent();
      await this.taskAnalyzer.initialize();

      this.meetingSummarizer = new MeetingSummarizerAgent();

      this.whisperService = new WhisperService();

      this.documentProcessor = new DocumentProcessor();
      await this.documentProcessor.initialize();

      this.initialized = true;
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('AI Service initialization failed:', error);
      throw error;
    }
  }

  async chat(userId, message, context = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const startTime = Date.now();

      // Choose appropriate agent based on context
      let response;
      if (context.type === 'task-analysis') {
        response = await this.taskAnalyzer.run(message, context);
      } else if (context.type === 'project-management') {
        response = await this.productManager.run(message, context);
      } else {
        // Default to product manager for general queries
        response = await this.productManager.chat(message);
      }

      const responseTime = Date.now() - startTime;

      // Save conversation to database
      await ChatMessage.create({
        user: userId,
        role: 'user',
        content: message,
        context: {
          projectId: context.projectId,
          taskId: context.taskId
        }
      });

      await ChatMessage.create({
        user: userId,
        role: 'ai',
        content: response,
        context: {
          projectId: context.projectId,
          taskId: context.taskId
        },
        metadata: {
          model: 'gpt-4',
          responseTime
        }
      });

      return {
        response,
        metadata: {
          responseTime,
          agent: context.type || 'product-manager'
        }
      };
    } catch (error) {
      logger.error('AI Chat error:', error);
      throw error;
    }
  }

  async createTaskFromDescription(description, projectId, userId) {
    if (!this.initialized) await this.initialize();

    try {
      const taskData = await this.productManager.createTaskFromDescription(
        description,
        projectId
      );

      return {
        success: true,
        task: taskData
      };
    } catch (error) {
      logger.error('Task creation error:', error);
      throw error;
    }
  }

  async analyzeTask(task, projectContext) {
    if (!this.initialized) await this.initialize();

    try {
      const analysis = await this.taskAnalyzer.analyzeTask(task, projectContext);
      return analysis;
    } catch (error) {
      logger.error('Task analysis error:', error);
      throw error;
    }
  }

  async analyzeProject(projectData, tasks) {
    if (!this.initialized) await this.initialize();

    try {
      const health = await this.productManager.analyzeProjectHealth(
        projectData,
        tasks
      );
      return health;
    } catch (error) {
      logger.error('Project analysis error:', error);
      throw error;
    }
  }

  async transcribeAudio(audioFilePath, meetingContext) {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.meetingSummarizer.transcribeAndSummarize(
        audioFilePath,
        meetingContext
      );
      return result;
    } catch (error) {
      logger.error('Transcription error:', error);
      throw error;
    }
  }

  async indexDocument(content, metadata) {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.documentProcessor.indexDocument(
        content,
        metadata
      );
      return result;
    } catch (error) {
      logger.error('Document indexing error:', error);
      throw error;
    }
  }

  async searchDocuments(query, options) {
    if (!this.initialized) await this.initialize();

    try {
      const results = await this.documentProcessor.similaritySearch(
        query,
        options
      );
      return results;
    } catch (error) {
      logger.error('Document search error:', error);
      throw error;
    }
  }

  async suggestTaskBreakdown(epicTask) {
    if (!this.initialized) await this.initialize();

    try {
      const subtasks = await this.productManager.suggestTaskBreakdown(epicTask);
      return subtasks;
    } catch (error) {
      logger.error('Task breakdown error:', error);
      throw error;
    }
  }

  async estimateEffort(tasks) {
    if (!this.initialized) await this.initialize();

    try {
      const estimates = await this.taskAnalyzer.estimateEffort(tasks);
      return estimates;
    } catch (error) {
      logger.error('Effort estimation error:', error);
      throw error;
    }
  }
}

// Singleton instance
const aiService = new AIService();

module.exports = aiService;
```

### **2. AI Controller**
```javascript
// src/controllers/ai.controller.js
const aiService = require('../services/ai.service');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|mp4|webm|ogg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only audio files allowed.'));
  }
});

exports.uploadAudio = upload.single('audio');

// Chat with AI
exports.chat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const result = await aiService.chat(userId, message, context);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Create task from natural language
exports.createTask = async (req, res, next) => {
  try {
    const { description, projectId } = req.body;
    const userId = req.user.userId;

    if (!description || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Description and projectId are required'
      });
    }

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const hasAccess = project.owner.toString() === userId ||
                      project.team.some(t => t.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await aiService.createTaskFromDescription(
      description,
      projectId,
      userId
    );

    // Create actual task in database
    const task = await Task.create({
      ...result.task,
      project: projectId,
      createdBy: userId
    });

    logger.info(`AI created task: ${task._id} for project: ${projectId}`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// Analyze task complexity and effort
exports.analyzeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access
    const hasAccess = task.project.owner.toString() === req.user.userId ||
                      task.project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const projectContext = {
      name: task.project.name,
      status: task.project.status,
      priority: task.project.priority
    };

    const analysis = await aiService.analyzeTask(task, projectContext);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// Analyze project health
exports.analyzeProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const hasAccess = project.owner.toString() === req.user.userId ||
                      project.team.some(t => t.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const tasks = await Task.find({ project: projectId });

    const analysis = await aiService.analyzeProject(project, tasks);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// Transcribe audio/meeting
exports.transcribe = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    const { title, participants } = req.body;
    const audioPath = req.file.path;

    const meetingContext = {
      title: title || 'Team Meeting',
      participants: participants ? JSON.parse(participants) : [],
      date: new Date().toISOString()
    };

    const result = await aiService.transcribeAudio(audioPath, meetingContext);

    // Clean up uploaded file
    fs.unlinkSync(audioPath);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Suggest task breakdown
exports.suggestBreakdown = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtasks = await aiService.suggestTaskBreakdown(task);

    res.json({
      success: true,
      data: subtasks
    });
  } catch (error) {
    next(error);
  }
};

// Estimate effort for multiple tasks
exports.estimateEffort = async (req, res, next) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task IDs array is required'
      });
    }

    const tasks = await Task.find({ _id: { $in: taskIds } });

    const estimates = await aiService.estimateEffort(tasks);

    res.json({
      success: true,
      data: estimates
    });
  } catch (error) {
    next(error);
  }
};

// Get chat history
exports.getChatHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessage.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ChatMessage.countDocuments({ user: userId })
    ]);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Index document for RAG
exports.indexDocument = async (req, res, next) => {
  try {
    const { content, metadata } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await aiService.indexDocument(content, {
      ...metadata,
      userId: req.user.userId,
      indexedAt: new Date()
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Search documents
exports.searchDocuments = async (req, res, next) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await aiService.searchDocuments(query, {
      limit: parseInt(limit),
      filter: { userId: req.user.userId }
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
```

### **3. AI Routes**
```javascript
// src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { aiLimiter } = require('../middleware/rateLimiter.middleware');

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(aiLimiter);

// Chat endpoints
router.post('/chat', aiController.chat);
router.get('/chat/history', aiController.getChatHistory);

// Task AI endpoints
router.post('/tasks/create', aiController.createTask);
router.get('/tasks/:taskId/analyze', aiController.analyzeTask);
router.get('/tasks/:taskId/breakdown', aiController.suggestBreakdown);
router.post('/tasks/estimate', aiController.estimateEffort);

// Project AI endpoints
router.get('/projects/:projectId/analyze', aiController.analyzeProject);

// Audio/Meeting endpoints
router.post(
  '/transcribe',
  aiController.uploadAudio,
  aiController.transcribe
);

// RAG endpoints
router.post('/documents/index', aiController.indexDocument);
router.get('/documents/search', aiController.searchDocuments);

module.exports = router;
```

### **4. Update Main App**
```javascript
// src/app.js - Add AI routes
const aiRoutes = require('./routes/ai.routes');

// ... existing code ...

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/ai', aiRoutes); // ADD THIS LINE
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// ... rest of the code ...
```

---

## 🏗️ Production Architecture

### **Production File Structure**
```
zenai-production/
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── backend/
│   ├── Dockerfile
│   ├── .env.production
│   └── [backend files]
├── ai-engine/
│   ├── Dockerfile
│   └── [ai-engine files]
├── frontend/
│   ├── Dockerfile
│   └── [frontend files]
├── scripts/
│   ├── deploy.sh
│   ├── backup.sh
│   └── restore.sh
└── monitoring/
    ├── prometheus.yml
    └── grafana/
```

### **Docker Compose - Production**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: zenai-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/build:/usr/share/nginx/html:ro
    depends_on:
      - backend
    networks:
      - zenai-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: zenai-backend
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    env_file:
      - ./backend/.env.production
    depends_on:
      - mongodb
      - redis
    networks:
      - zenai-network
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G

  ai-engine:
    build:
      context: ./ai-engine
      dockerfile: Dockerfile
    container_name: zenai-ai-engine
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    env_file:
      - ./ai-engine/.env.production
    networks:
      - zenai-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G

  mongodb:
    image: mongo:6
    container_name: zenai-mongodb
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb-data:/data/db
      - mongodb-config:/data/configdb
    networks:
      - zenai-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  redis:
    image: redis:7-alpine
    container_name: zenai-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - zenai-network
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: zenai-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - zenai-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: zenai-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    networks:
      - zenai-network
    restart: unless-stopped

networks:
  zenai-network:
    driver: bridge

volumes:
  mongodb-data:
  mongodb-config:
  redis-data:
  prometheus-data:
  grafana-data:
```

### **Nginx Configuration**
```nginx
# nginx/nginx.conf
upstream backend {
    least_conn;
    server backend:5000 max_fails=3 fail_timeout=30s;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints - stricter rate limit
    location /api/v1/auth/ {
        limit_req zone=auth_limit burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### **Backend Dockerfile**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/server.js"]
```

---

## 🚀 Deployment Guide

### **1. Environment Setup**
```bash
# Create production environment file
cat > backend/.env.production << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://username:password@mongodb:27017/zenai?authSource=admin
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
OPENAI_API_KEY=sk-your-openai-key
PINECONE_API_KEY=your-pinecone-key
CORS_ORIGIN=https://your-domain.com
EOF
```

### **2. SSL Certificate Setup (Let's Encrypt)**
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### **3. Deploy Script**
```bash
# scripts/deploy.sh
#!/bin/bash

set -e

echo "🚀 Starting ZenAI Production Deployment..."

# Pull latest code
git pull origin main

# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Check health
echo "🏥 Checking service health..."
curl -f http://localhost/health || exit 1

echo "✅ Deployment completed successfully!"
```

### **4. Database Backup Script**
```bash
# scripts/backup.sh
#!/bin/bash

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose -f docker-compose.prod.yml exec -T mongodb \
  mongodump --username $MONGO_USERNAME --password $MONGO_PASSWORD \
  --authenticationDatabase admin --archive > $BACKUP_DIR/backup_$DATE.archive

# Compress
gzip $BACKUP_DIR/backup_$DATE.archive

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.archive.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.archive.gz"
```

---

## 📊 Monitoring & Security

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5000']
    
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
    
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### **Application Monitoring (Backend)**
```javascript
// src/utils/metrics.js
const client = require('prom-client');

// Create metrics
const register = new client.Registry();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const aiRequestCounter = new client.Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['agent', 'status']
});

const aiRequestDuration = new client.Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI requests in seconds',
  labelNames: ['agent'],
  buckets: [1, 3, 5, 10, 30]
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(aiRequestCounter);
register.registerMetric(aiRequestDuration);
register.registerMetric(activeConnections);

// Enable default metrics
client.collectDefaultMetrics({ register });

module.exports = {
  register,
  httpRequestDuration,
  aiRequestCounter,
  aiRequestDuration,
  activeConnections
};
```

### **Metrics Middleware**
```javascript
// src/middleware/metrics.middleware.js
const { httpRequestDuration, activeConnections } = require('../utils/metrics');

exports.metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    
    activeConnections.dec();
  });
  
  next();
};

// Metrics endpoint
exports.getMetrics = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
```

### **Enhanced Logger with Production Settings**
```javascript
// src/utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'zenai-backend' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

---

## 🔐 Security Enhancements

### **Security Middleware**
```javascript
// src/middleware/security.middleware.js
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

exports.securityMiddleware = [
  // Helmet - Security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.openai.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  // Sanitize data against NoSQL injection
  mongoSanitize(),
  
  // Prevent XSS attacks
  xss(),
  
  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: ['status', 'priority', 'tags']
  })
];
```

### **API Key Management**
```javascript
// src/middleware/apiKey.middleware.js
const crypto = require('crypto');
const { cache } = require('../config/redis');

class APIKeyManager {
  static generateAPIKey(userId) {
    const key = `zn_${crypto.randomBytes(32).toString('hex')}`;
    return key;
  }

  static async validateAPIKey(key) {
    // Check cache first
    const cachedUserId = await cache.get(`apikey:${key}`);
    if (cachedUserId) {
      return cachedUserId;
    }

    // Check database
    const apiKey = await APIKey.findOne({ key, isActive: true });
    if (!apiKey) {
      return null;
    }

    // Update last used
    apiKey.lastUsed = new Date();
    await apiKey.save();

    // Cache for 1 hour
    await cache.set(`apikey:${key}`, apiKey.userId, 3600);

    return apiKey.userId;
  }

  static middleware() {
    return async (req, res, next) => {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API key required'
        });
      }

      const userId = await APIKeyManager.validateAPIKey(apiKey);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }

      req.user = { userId };
      next();
    };
  }
}

module.exports = APIKeyManager;
```

### **Input Validation Schema**
```javascript
// src/middleware/validation.middleware.js
const Joi = require('joi');

const schemas = {
  chat: Joi.object({
    message: Joi.string().required().max(5000),
    context: Joi.object({
      type: Joi.string().valid('task-analysis', 'project-management'),
      projectId: Joi.string().length(24).hex(),
      taskId: Joi.string().length(24).hex()
    })
  }),

  createTask: Joi.object({
    description: Joi.string().required().min(10).max(5000),
    projectId: Joi.string().required().length(24).hex()
  }),

  transcribe: Joi.object({
    title: Joi.string().max(200),
    participants: Joi.array().items(Joi.string())
  })
};

exports.validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return next();
    }

    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};
```

---

## 🧪 Testing Setup

### **Integration Tests**
```javascript
// tests/integration/ai.test.js
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User.model');
const Project = require('../../src/models/Project.model');
const { generateAccessToken } = require('../../src/config/jwt');

describe('AI Endpoints', () => {
  let token;
  let userId;
  let projectId;

  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    userId = user._id;
    token = generateAccessToken(userId);

    // Create test project
    const project = await Project.create({
      name: 'Test Project',
      owner: userId
    });
    projectId = project._id;
  });

  describe('POST /api/v1/ai/chat', () => {
    it('should respond to chat message', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Create a task for implementing user authentication',
          context: {
            type: 'project-management',
            projectId: projectId.toString()
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBeDefined();
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({ message: 'Hello' });

      expect(response.status).toBe(401);
    });

    it('should reject empty message', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/ai/tasks/create', () => {
    it('should create task from description', async () => {
      const response = await request(app)
        .post('/api/v1/ai/tasks/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Implement user login with JWT authentication',
          projectId: projectId.toString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBeDefined();
      expect(response.body.data.priority).toBeDefined();
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
  });
});
```

### **Load Testing Script**
```javascript
// tests/load/load-test.js
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:5000',
    connections: 100,
    duration: 30,
    pipelining: 10,
    requests: [
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      },
      {
        method: 'GET',
        path: '/api/v1/projects',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      }
    ]
  });

  console.log('Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.average} req/sec`);
  console.log(`Latency: ${result.latency.mean}ms`);
  console.log(`Errors: ${result.errors}`);
}

runLoadTest();
```

---

## 🚀 CI/CD Pipeline

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/zenai-test
          REDIS_HOST: localhost
          JWT_SECRET: test-secret
      
      - name: Run linting
        run: |
          cd backend
          npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            yourusername/zenai-backend:latest
            yourusername/zenai-backend:${{ github.sha }}
          cache-from: type=registry,ref=yourusername/zenai-backend:buildcache
          cache-to: type=registry,ref=yourusername/zenai-backend:buildcache,mode=max
      
      - name: Build and push AI engine
        uses: docker/build-push-action@v4
        with:
          context: ./ai-engine
          push: true
          tags: |
            yourusername/zenai-ai-engine:latest
            yourusername/zenai-ai-engine:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/zenai
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -af
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://your-domain.com/health || exit 1
      
      - name: Notify on Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📦 Package.json Scripts

### **Backend Package.json**
```json
{
  "name": "zenai-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:load": "node tests/load/load-test.js",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "format": "prettier --write \"src/**/*.js\"",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js",
    "backup": "bash scripts/backup.sh",
    "docker:build": "docker build -t zenai-backend .",
    "docker:run": "docker-compose up -d",
    "docker:stop": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "ioredis": "^5.3.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "express-rate-limit": "^7.0.1",
    "rate-limit-redis": "^3.0.2",
    "joi": "^17.11.0",
    "express-validator": "^7.0.1",
    "openai": "^4.20.0",
    "langchain": "^0.0.193",
    "@langchain/openai": "^0.0.10",
    "@langchain/anthropic": "^0.0.5",
    "bull": "^4.11.5",
    "bullmq": "^4.14.0",
    "socket.io": "^4.6.2",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "axios": "^1.6.0",
    "multer": "^1.4.5-lts.1",
    "compression": "^1.7.4",
    "express-mongo-sanitize": "^2.2.0",
    "xss-clean": "^0.1.4",
    "hpp": "^0.2.3",
    "prom-client": "^15.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.52.0",
    "prettier": "^3.0.3",
    "autocannon": "^7.12.0"
  }
}
```

---

## 🎯 Production Checklist

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups automated
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] CORS properly configured
- [ ] Error handling complete
- [ ] Logging configured
- [ ] Monitoring setup (Prometheus + Grafana)
- [ ] Load testing completed

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Metrics collecting
- [ ] Logs flowing
- [ ] Backups running
- [ ] SSL certificate auto-renewal
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team trained

### **Monitoring Metrics**
- Response time (< 200ms for 95th percentile)
- Error rate (< 0.1%)
- CPU usage (< 70%)
- Memory usage (< 80%)
- Database connections (within limits)
- Cache hit rate (> 80%)
- AI request success rate (> 95%)

---

## 🔄 Scaling Strategy

### **Horizontal Scaling**
```yaml
# docker-compose.prod.yml - Scale backend
services:
  backend:
    deploy:
      replicas: 5
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure
```

### **Database Sharding**
```javascript
// For high load, implement MongoDB sharding
// config/database.js
const shardingConfig = {
  shards: [
    { name: 'shard1', uri: 'mongodb://shard1:27017' },
    { name: 'shard2', uri: 'mongodb://shard2:27017' }
  ],
  shardKey: { userId: 1 }
};
```

### **Redis Cluster**
```javascript
// config/redis.js - Redis Cluster mode
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 }
]);
```

---

## 📚 Documentation

### **API Documentation (Swagger)**
```javascript
// src/docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZenAI API',
      version: '1.0.0',
      description: 'AI-powered project management API'
    },
    servers: [
      {
        url: 'https://api.zenai.com/v1',
        description: 'Production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
```

---

## ✅ Summary

You now have:
1. ✅ **Complete AI integration** - Backend connected to AI Engine
2. ✅ **Production-ready infrastructure** - Docker, Nginx, SSL
3. ✅ **Monitoring & Logging** - Prometheus, Grafana, Winston
4. ✅ **Security hardened** - Helmet, rate limiting, validation
5. ✅ **CI/CD pipeline** - GitHub Actions automated deployment
6. ✅ **Scalable architecture** - Load balanced, horizontally scalable
7. ✅ **Testing suite** - Unit, integration, and load tests
8. ✅ **Documentation** - API docs with Swagger

**Next Steps:**
1. Implement missing files in your codebase
2. Configure environment variables
3. Setup SSL certificates
4. Deploy to production server
5. Monitor and optimize based on metrics