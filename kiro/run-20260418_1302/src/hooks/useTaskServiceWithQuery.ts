// src/hooks/useTaskServiceWithQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../services/api/taskApi';
import { TaskFilters } from './useTaskService';
import { CreateTaskRequest, UpdateTaskRequest } from '../types/task.types';

const TASK_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_KEYS.all, 'list'] as const,
  list: (filters: TaskFilters) => [...TASK_KEYS.lists(), filters] as const,
  details: () => [...TASK_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TASK_KEYS.details(), id] as const,
};

export const useTaskServiceWithQuery = (filters?: TaskFilters) => {
  const queryClient = useQueryClient();

  // Query for tasks list
  const tasksQuery = useQuery({
    queryKey: TASK_KEYS.list(filters || {}),
    queryFn: () => taskApi.getTasks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for creating tasks
  const createTaskMutation = useMutation({
    mutationFn: (task: CreateTaskRequest) => taskApi.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
    },
  });

  // Mutation for updating tasks
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskRequest }) =>
      taskApi.updateTask(id, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(TASK_KEYS.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
    },
  });

  // Mutation for deleting tasks
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
    },
  });

  return {
    // Query state
    tasks: tasksQuery.data || [],
    loading: tasksQuery.isLoading,
    error: tasksQuery.error?.message || null,
    
    // Mutations
    createTask: createTaskMutation.mutateAsync,
    updateTask: (id: string, updates: UpdateTaskRequest) =>
      updateTaskMutation.mutateAsync({ id, updates }),
    deleteTask: deleteTaskMutation.mutateAsync,
    
    // Loading states
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    
    // Refetch
    refetch: tasksQuery.refetch,
  };
};