// src/hooks/useTasks.js
import { useQuery, useMutation, useQueryClient } from 'react-query';
import taskService from '../services/task.service';
import toast from 'react-hot-toast';

export const useTasks = (projectId, params = {}) => {
  return useQuery(
    ['tasks', projectId, params],
    () => taskService.getTasks(projectId, params),
    {
      enabled: !!projectId,
    }
  );
};

export const useTask = (id) => {
  return useQuery(
    ['task', id],
    () => taskService.getTaskById(id),
    {
      enabled: !!id,
    }
  );
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data) => taskService.createTask(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        toast.success('Task created successfully!');
      }
    }
  );
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, data }) => taskService.updateTask(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries('tasks');
        queryClient.invalidateQueries(['task', variables.id]);
        toast.success('Task updated successfully!');
      }
    }
  );
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id) => taskService.deleteTask(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        toast.success('Task deleted successfully!');
      }
    }
  );
};