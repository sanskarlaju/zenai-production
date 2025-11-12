// src/services/ai.service.js
import api from './api';

const aiService = {
  async chat(message, context = {}) {
    return await api.post('/ai/chat', { message, context });
  },

  async createTaskWithAI(description, projectId) {
    return await api.post('/ai/tasks/create', { description, projectId });
  },

  async analyzeTask(taskId) {
    return await api.get(`/ai/tasks/${taskId}/analyze`);
  },

  async analyzeProject(projectId) {
    return await api.get(`/ai/projects/${projectId}/analyze`);
  },

  async suggestBreakdown(taskId) {
    return await api.get(`/ai/tasks/${taskId}/breakdown`);
  },

  async estimateEffort(taskIds) {
    return await api.post('/ai/tasks/estimate', { taskIds });
  },

  async transcribeAudio(file, metadata) {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', metadata.title || '');
    formData.append('participants', JSON.stringify(metadata.participants || []));
    
    return await api.post('/ai/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async getChatHistory(params = {}) {
    return await api.get('/ai/chat/history', { params });
  },

  async indexDocument(content, metadata) {
    return await api.post('/ai/documents/index', { content, metadata });
  },

  async searchDocuments(query, limit = 5) {
    return await api.get('/ai/documents/search', { 
      params: { query, limit } 
    });
  }
};

export default aiService;