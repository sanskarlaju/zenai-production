// src/hooks/useAuth.js
import { create } from 'zustand';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  user: authService.getUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const response = await authService.login(credentials);
      set({ 
        user: response.data.user, 
        isAuthenticated: true,
        loading: false 
      });
      toast.success('Login successful!');
      return response;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const response = await authService.register(data);
      set({ 
        user: response.data.user, 
        isAuthenticated: true,
        loading: false 
      });
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  updateUser: (userData) => {
    set({ user: userData });
    localStorage.setItem('user', JSON.stringify(userData));
  }
}));