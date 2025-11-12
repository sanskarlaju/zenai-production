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