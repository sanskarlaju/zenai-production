// src/hooks/useProjects.js
import { useQuery, useMutation, useQueryClient } from 'react-query';
import projectService from '../services/project.service';
import toast from 'react-hot-toast';

export const useProjects = (params = {}) => {
  return useQuery(
    ['projects', params],
    () => projectService.getProjects(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useProject = (id) => {
  return useQuery(
    ['project', id],
    () => projectService.getProjectById(id),
    {
      enabled: !!id,
    }
  );
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data) => projectService.createProject(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        toast.success('Project created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create project');
      }
    }
  );
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, data }) => projectService.updateProject(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries('projects');
        queryClient.invalidateQueries(['project', variables.id]);
        toast.success('Project updated successfully!');
      }
    }
  );
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (id) => projectService.deleteProject(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        toast.success('Project deleted successfully!');
      }
    }
  );
};