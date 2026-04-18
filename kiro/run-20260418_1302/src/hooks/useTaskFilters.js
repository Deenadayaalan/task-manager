// src/hooks/useTaskFilters.js
import { useState, useCallback, useMemo } from 'react';

export const useTaskFilters = (tasks = []) => {
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDate: 'all',
    search: '',
    tags: []
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  /**
   * Get unique filter options from tasks
   */
  const filterOptions = useMemo(() => {
    const statuses = [...new Set(tasks.map(task => task.status))];
    const priorities = [...new Set(tasks.map(task => task.priority))];
    const assignees = [...new Set(tasks.map(task => task.assignedTo).filter(Boolean))];
    const tags = [...new Set(tasks.flatMap(task => task.tags || []))];

    return {
      statuses,
      priorities,
      assignees,
      tags
    };
  }, [tasks]);

  /**
   * Apply filters to tasks
   */
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Assignee filter
    if (filters.assignee !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === filters.assignee);
    }

    // Due date filter
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
          case 'next-week':
            const nextWeekStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            return dueDate >= nextWeekStart && dueDate <= nextWeekEnd;
          case 'no-date':
            return false;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        (task.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(task => 
        filters.tags.every(tag => (task.tags || []).includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key.includes('Date') || sortConfig.key.includes('At')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
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
  const updateSort = useCallback((key, direction = null) => {
    setSortConfig(prev => ({
      key,
      direction: direction || (prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc')
    }));
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
      search: '',
      tags: []
    });
  }, []);

  /**
   * Reset sort to default
   */
  const resetSort = useCallback(() => {
    setSortConfig({
      key: 'createdAt',
      direction: 'desc'
    });
  }, []);

  /**
   * Get active filter count
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.assignee !== 'all') count++;
    if (filters.dueDate !== 'all') count++;
    if (filters.search) count++;
    if (filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  return {
    filters,
    sortConfig,
    filteredTasks,
    filterOptions,
    activeFilterCount,
    updateFilters,
    updateSort,
    clearFilters,
    resetSort
  };
};