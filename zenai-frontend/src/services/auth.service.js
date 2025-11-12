// src/services/auth.service.js
import api from './api';

const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.success) {
      this.setTokens(response.data);
    }
    return response;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.success) {
      this.setTokens(response.data);
    }
    return response;
  },

  async logout() {
    await api.post('/auth/logout');
    this.clearTokens();
  },

  async getProfile() {
    return await api.get('/auth/profile');
  },

  async updateProfile(data) {
    return await api.put('/auth/profile', data);
  },

  setTokens(data) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
};

export default authService;