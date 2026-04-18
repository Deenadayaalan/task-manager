// src/hooks/useTaskService.ts
import { useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '../types/task.types';
import { taskApi } from '../services/api/taskApi';
import { useAuth } from './useAuth';
import { useNotification } from './useNotification';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: Date;
  search?: string;
}

export interface TaskServiceState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  selectedTask: Task | null;
}

export interface TaskServiceActions {
  // CRUD Operations
  createTask: (task: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task>;
  
  // Bulk Operations
  getTasks: (filters?: TaskFilters) => Promise<Task[]>;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<UpdateTaskRequest>) => Promise<Task[]>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  
  // State Management
  selectTask: (task: Task | null) => void;
  refreshTasks: () => Promise<void>;
  clearError: () => void;
  
  // Real-time Updates
  subscribeToTaskUpdates: (callback: (task: Task) => void) => () => void;
}

export const useTaskService = (initialFilters?: TaskFilters): TaskServiceState & TaskServiceActions => {
  const [state, setState] = useState<TaskServiceState>({
    tasks: [],
    loading: false,
    error: null,
    selectedTask: null,
  });

  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Helper function to update state
  const updateState = useCallback((updates: Partial<TaskServiceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Create Task
  const createTask = useCallback(async (taskData: CreateTaskRequest): Promise<Task> => {
    try {
      updateState({ loading: true, error: null });
      
      const newTask = await taskApi.createTask({
        ...taskData,
        createdBy: user?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setState(prev => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        loading: false,
      }));

      showNotification('Task created successfully', 'success');
      return newTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      updateState({ loading: false, error: errorMessage });
      showNotification(errorMessage, 'error');
      throw error;
    }
  }, [user, updateState, showNotification]);

  // Update Task
  const updateTask = useCallback(async (id: string, updates: UpdateTaskRequest): Promise<Task> => {
    try {
      updateState({ loading: true, error: null });
      
      const updatedTask = await taskApi.updateTask(id, {
        ...updates,
        updatedAt: new Date(),
      });

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => task.id === id ? updatedTask : task),
        selectedTask: prev.selectedTask?.id === id ? updatedTask : prev.selectedTask,
        loading: false,
      }));

      showNotification('Task updated successfully', 'success');
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      updateState({ loading: false, error: errorMessage });
      showNotification(errorMessage, 'error');
      throw error;
    }
  }, [updateState, showNotification]);

  // Delete Task
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      
      await taskApi.deleteTask(id);

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
        selectedTask: prev.selectedTask?.id === id ? null : prev.selectedTask,
        loading: false,
      }));

      showNotification('Task deleted successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      updateState({ loading: false, error: errorMessage });
      showNotification(errorMessage, 'error');
      throw error;
    }
  }, [updateState, showNotification]);

  // Get Single Task
  const getTask = useCallback(async (id: string): Promise<Task> => {
    try {
      updateState({ loading: true, error: null });
      
      const task = await taskApi.getTask(id);
      
      updateState({ loading: false, selectedTask: task });
      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch task';
      updateState({ loading: false, error: errorMessage });
      throw error;
    }
  }, [updateState]);

  // Get Tasks with Filters
  const getTasks = useCallback(async (filters?: TaskFilters): Promise<Task[]> => {
    try {
      updateState({ loading: true, error: null });
      
      const tasks = await taskApi.getTasks(filters);
      
      updateState({ loading: false, tasks });
      return tasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      updateState({ loading: false, error: errorMessage });
      throw error;
    }
  }, [updateState]);

  // Bulk Update Tasks
  const bulkUpdateTasks = useCallback(async (
    taskIds: string[], 
    updates: Partial<UpdateTaskRequest>
  ): Promise<Task[]> => {
    try {
      updateState({ loading: true, error: null });
      
      const updatedTasks = await taskApi.bulkUpdateTasks(taskIds, updates);
      
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        }),
        loading: false,
      }));

      showNotification(`${updatedTasks.length} tasks updated successfully`, 'success');
      return updatedTasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tasks';
      updateState({ loading: false, error: errorMessage });
      showNotification(errorMessage, 'error');
      throw error;
    }
  }, [updateState, showNotification]);

  // Bulk Delete Tasks
  const bulkDeleteTasks = useCallback(async (taskIds: string[]): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      
      await taskApi.bulkDeleteTasks(taskIds);
      
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => !taskIds.includes(task.id)),
        selectedTask: taskIds.includes(prev.selectedTask?.id || '') ? null : prev.selectedTask,
        loading: false,
      }));

      showNotification(`${taskIds.length} tasks deleted successfully`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tasks';
      updateState({ loading: false, error: errorMessage });
      showNotification(errorMessage, 'error');
      throw error;
    }
  }, [updateState, showNotification]);

  // Select Task
  const selectTask = useCallback((task: Task | null) => {
    updateState({ selectedTask: task });
  }, [updateState]);

  // Refresh Tasks
  const refreshTasks = useCallback(async () => {
    await getTasks(initialFilters);
  }, [getTasks, initialFilters]);

  // Clear Error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Subscribe to Real-time Updates
  const subscribeToTaskUpdates = useCallback((callback: (task: Task) => void) => {
    // Implementation would depend on your real-time solution (WebSocket, SSE, etc.)
    const unsubscribe = taskApi.subscribeToUpdates((updatedTask: Task) => {
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => task.id === updatedTask.id ? updatedTask : task),
        selectedTask: prev.selectedTask?.id === updatedTask.id ? updatedTask : prev.selectedTask,
      }));
      callback(updatedTask);
    });

    return unsubscribe;
  }, []);

  // Load initial tasks
  useEffect(() => {
    if (user) {
      getTasks(initialFilters);
    }
  }, [user, getTasks, initialFilters]);

  return {
    // State
    ...state,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    getTask,
    getTasks,
    bulkUpdateTasks,
    bulkDeleteTasks,
    selectTask,
    refreshTasks,
    clearError,
    subscribeToTaskUpdates,
  };
};