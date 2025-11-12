// src/hooks/useAI.js
import { useMutation, useQuery } from 'react-query';
import aiService from '../services/ai.service';
import toast from 'react-hot-toast';

export const useAIChat = () => {
  return useMutation(
    ({ message, context }) => aiService.chat(message, context),
    {
      onError: () => {
        toast.error('Failed to get AI response');
      }
    }
  );
};

export const useAITaskCreation = () => {
  return useMutation(
    ({ description, projectId }) => aiService.createTaskWithAI(description, projectId),
    {
      onSuccess: () => {
        toast.success('Task created with AI!');
      }
    }
  );
};

export const useTaskAnalysis = (taskId) => {
  return useQuery(
    ['task-analysis', taskId],
    () => aiService.analyzeTask(taskId),
    {
      enabled: !!taskId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useProjectAnalysis = (projectId) => {
  return useQuery(
    ['project-analysis', projectId],
    () => aiService.analyzeProject(projectId),
    {
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useAudioTranscription = () => {
  return useMutation(
    ({ file, metadata }) => aiService.transcribeAudio(file, metadata),
    {
      onSuccess: () => {
        toast.success('Audio transcribed successfully!');
      }
    }
  );
};

export const useChatHistory = (params = {}) => {
  return useQuery(
    ['chat-history', params],
    () => aiService.getChatHistory(params)
  );
};