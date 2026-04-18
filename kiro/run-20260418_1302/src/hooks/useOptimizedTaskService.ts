// src/hooks/useOptimizedTaskService.ts
import { useMemo, useCallback } from 'react';
import { useTaskService, TaskFilters } from './useTaskService';
import { Task, TaskStatus, TaskPriority } from '../types/task.types';

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
}

export const useOptimizedTaskService = (filters?: TaskFilters) => {
  const taskService = useTaskService(filters);

  // Memoized task metrics
  const metrics = useMemo((): TaskMetrics => {
    const { tasks } = taskService;
    const now = new Date();

    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<TaskStatus, number>);

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskPriority, number>);

    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const pendingTasks = tasks.filter(task => 
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED
    ).length;
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== TaskStatus.DONE
    ).length;

    return {
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
    };
  }, [taskService.tasks]);

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    return taskService.tasks.filter(task => {
      if (filters?.status && task.status !== filters.status) return false;
      if (filters?.priority && task.priority !== filters.priority) return false;
      if (filters?.assignedTo && task.assignedTo !== filters.assignedTo) return false;
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return task.title.toLowerCase().includes(searchLower) ||
               task.description?.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [taskService.tasks, filters]);

  // Memoized task groups
  const taskGroups = useMemo(() => {
    return {
      byStatus: filteredTasks.reduce((acc, task) => {
        if (!acc[task.status]) acc[task.status] = [];
        acc[task.status].push(task);
        return acc;
      }, {} as Record<TaskStatus, Task[]>),
      
      byPriority: filteredTasks.reduce((acc, task) => {
        if (!acc[task.priority]) acc[task.priority] = [];
        acc[task.priority].push(task);
        return acc;
      }, {} as Record<TaskPriority, Task[]>),
      
      byAssignee: filteredTasks.reduce((acc, task) => {
        const assignee = task.assignedTo || 'unassigned';
        if (!acc[assignee]) acc[assignee] = [];
        acc[assignee].push(task);
        return acc;
      }, {} as Record<string, Task[]>),
    };
  }, [filteredTasks]);

  // Optimized bulk operations
  const bulkOperations = useMemo(() => ({
    markAsComplete: (taskIds: string[]) => 
      taskService.bulkUpdateTasks(taskIds, { status: TaskStatus.DONE }),
    
    markAsInProgress: (taskIds: string[]) => 
      taskService.bulkUpdateTasks(taskIds, { status: TaskStatus.IN_PROGRESS }),
    
    assignTasks: (taskIds: string[], assignedTo: string) => 
      taskService.bulkUpdateTasks(taskIds, { assignedTo }),
    
    setPriority: (taskIds: string[], priority: TaskPriority) => 
      taskService.bulkUpdateTasks(taskIds, { priority }),
  }), [taskService.bulkUpdateTasks]);

  return {
    ...taskService,
    filteredTasks,
    metrics,
    taskGroups,
    bulkOperations,
  };
};