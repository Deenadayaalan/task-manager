import { useState, useCallback, useMemo } from 'react';
import { Task, TaskStatus } from '../types/task.types';
import { useTaskService } from './useTaskService';

interface UseBoardOptions {
  projectId?: string;
  initialFilter?: BoardFilter;
}

interface BoardFilter {
  search?: string;
  assignee?: string;
  priority?: string;
  tags?: string[];
}

export const useBoard = (options: UseBoardOptions = {}) => {
  const { projectId, initialFilter = {} } = options;
  const [filter, setFilter] = useState<BoardFilter>(initialFilter);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    updateTask,
    createTask,
    deleteTask
  } = useTaskService();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) &&
            !task.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filter.assignee && task.assigneeId !== filter.assignee) {
        return false;
      }

      if (filter.priority && task.priority !== filter.priority) {
        return false;
      }

      if (filter.tags && filter.tags.length > 0) {
        if (!task.tags || !filter.tags.some(tag => task.tags?.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filter]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      'todo': [],
      'in-progress': [],
      'review': [],
      'done': []
    };

    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      return true;
    } catch (error) {
      console.error('Failed to move task:', error);
      return false;
    }
  }, [updateTask]);

  const refreshBoard = useCallback(() => {
    fetchTasks({ projectId, ...filter });
  }, [fetchTasks, projectId, filter]);

  return {
    // Data
    tasks: filteredTasks,
    tasksByStatus,
    selectedTask,
    filter,
    
    // State
    loading,
    error,
    
    // Actions
    setFilter,
    setSelectedTask,
    moveTask,
    createTask,
    updateTask,
    deleteTask,
    refreshBoard
  };
};