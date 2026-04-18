// src/hooks/useTaskService.js
import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { taskApi } from '../services/api/taskApi';
import { useNotification } from './useNotification';
import { useLoading } from './useLoading';

export const useTaskService = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDate: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const { setLoading } = useLoading();

  // Load tasks on mount and when user changes
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  // Apply filters and sorting when tasks or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [tasks, filters, sortConfig]);

  /**
   * Load all tasks for the current user
   */
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskApi.getTasks();
      setTasks(response.data);
    } catch (error) {
      showNotification('Failed to load tasks', 'error');
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, showNotification]);

  /**
   * Create a new task
   */
  const createTask = useCallback(async (taskData) => {
    try {
      setLoading(true);
      const response = await taskApi.createTask({
        ...taskData,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setTasks(prev => [response.data, ...prev]);
      showNotification('Task created successfully', 'success');
      return response.data;
    } catch (error) {
      showNotification('Failed to create task', 'error');
      console.error('Error creating task:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, showNotification]);

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      setLoading(true);
      const response = await taskApi.updateTask(taskId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? response.data : task
      ));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(response.data);
      }
      
      showNotification('Task updated successfully', 'success');
      return response.data;
    } catch (error) {
      showNotification('Failed to update task', 'error');
      console.error('Error updating task:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedTask, setLoading, showNotification]);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (taskId) => {
    try {
      setLoading(true);
      await taskApi.deleteTask(taskId);
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      
      showNotification('Task deleted successfully', 'success');
    } catch (error) {
      showNotification('Failed to delete task', 'error');
      console.error('Error deleting task:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedTask, setLoading, showNotification]);

  /**
   * Get a specific task by ID
   */
  const getTask = useCallback(async (taskId) => {
    try {
      const response = await taskApi.getTask(taskId);
      setSelectedTask(response.data);
      return response.data;
    } catch (error) {
      showNotification('Failed to load task', 'error');
      console.error('Error loading task:', error);
      throw error;
    }
  }, [showNotification]);

  /**
   * Update task status
   */
  const updateTaskStatus = useCallback(async (taskId, status) => {
    return updateTask(taskId, { status });
  }, [updateTask]);

  /**
   * Update task priority
   */
  const updateTaskPriority = useCallback(async (taskId, priority) => {
    return updateTask(taskId, { priority });
  }, [updateTask]);

  /**
   * Assign task to user
   */
  const assignTask = useCallback(async (taskId, assigneeId) => {
    return updateTask(taskId, { assignedTo: assigneeId });
  }, [updateTask]);

  /**
   * Add comment to task
   */
  const addComment = useCallback(async (taskId, comment) => {
    try {
      const response = await taskApi.addComment(taskId, {
        text: comment,
        author: user.id,
        createdAt: new Date().toISOString()
      });
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, comments: [...(task.comments || []), response.data] }
          : task
      ));
      
      showNotification('Comment added successfully', 'success');
      return response.data;
    } catch (error) {
      showNotification('Failed to add comment', 'error');
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [user, showNotification]);

  /**
   * Apply filters and sorting to tasks
   */
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...tasks];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.assignee !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === filters.assignee);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dueDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(task => {
        if (!task.dueDate) return filters.dueDate === 'no-date';
        
        const dueDate = new Date(task.dueDate);
        switch (filters.dueDate) {
          case 'overdue':
            return dueDate < now && task.status !== 'completed';
          case 'today':
            return dueDate.toDateString() === now.toDateString();
          case 'this-week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return dueDate >= now && dueDate <= weekFromNow;
          case 'no-date':
            return false;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredTasks(filtered);
  }, [tasks, filters, sortConfig]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Update sort configuration
   */
  const updateSort = useCallback((key, direction) => {
    setSortConfig({ key, direction });
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dueDate: 'all',
      search: ''
    });
  }, []);

  /**
   * Get task statistics
   */
  const getTaskStats = useCallback(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(task => task.status === 'completed').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      pending: tasks.filter(task => task.status === 'pending').length,
      overdue: tasks.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate) < new Date();
      }).length,
      highPriority: tasks.filter(task => task.priority === 'high').length
    };
  }, [tasks]);

  return {
    // State
    tasks: filteredTasks,
    allTasks: tasks,
    selectedTask,
    filters,
    sortConfig,
    
    // Actions
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    updateTaskStatus,
    updateTaskPriority,
    assignTask,
    addComment,
    
    // Filtering and sorting
    updateFilters,
    updateSort,
    clearFilters,
    
    // Utilities
    getTaskStats,
    setSelectedTask
  };
};