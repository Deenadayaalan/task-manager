import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { useTaskService } from '../../hooks/useTaskService';
import { TaskItem } from './TaskItem';
import { TaskFilters } from './TaskFilters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import './TaskList.scss';

interface TaskListProps {
  projectId?: string;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  onTaskSelect?: (task: Task) => void;
  onTaskUpdate?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
}

interface TaskFilters {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assignee: string | 'all';
  dueDate: 'overdue' | 'today' | 'week' | 'all';
  searchTerm: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  projectId,
  showFilters = true,
  showPagination = true,
  pageSize = 10,
  onTaskSelect,
  onTaskUpdate,
  onTaskDelete
}) => {
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    updateTask,
    deleteTask,
    totalCount
  } = useTaskService();

  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDate: 'all',
    searchTerm: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Task>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Fetch tasks on component mount and when filters change
  useEffect(() => {
    const fetchParams = {
      projectId,
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder,
      ...filters
    };
    fetchTasks(fetchParams);
  }, [projectId, currentPage, pageSize, sortBy, sortOrder, filters, fetchTasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.assignee !== 'all') {
      filtered = filtered.filter(task => task.assigneeId === filters.assignee);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filters
    if (filters.dueDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);

        switch (filters.dueDate) {
          case 'overdue':
            return dueDate < today;
          case 'today':
            return dueDate.toDateString() === today.toDateString();
          case 'week':
            return dueDate >= today && dueDate <= weekFromNow;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [tasks, filters]);

  // Handle task actions
  const handleTaskUpdate = async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask.id, updatedTask);
      onTaskUpdate?.(updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      onTaskDelete?.(taskId);
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleTaskSelect = (task: Task) => {
    onTaskSelect?.(task);
  };

  const handleBulkAction = async (action: 'delete' | 'complete' | 'archive') => {
    const taskIds = Array.from(selectedTasks);
    
    try {
      switch (action) {
        case 'delete':
          await Promise.all(taskIds.map(id => deleteTask(id)));
          break;
        case 'complete':
          await Promise.all(
            taskIds.map(id => {
              const task = tasks.find(t => t.id === id);
              if (task) {
                return updateTask(id, { ...task, status: TaskStatus.COMPLETED });
              }
            })
          );
          break;
        case 'archive':
          await Promise.all(
            taskIds.map(id => {
              const task = tasks.find(t => t.id === id);
              if (task) {
                return updateTask(id, { ...task, archived: true });
              }
            })
          );
          break;
      }
      setSelectedTasks(new Set());
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
    }
  };

  const handleSort = (field: keyof Task) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectTask = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  if (loading && tasks.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchTasks()} />;
  }

  return (
    <div className="task-list">
      {showFilters && (
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          taskCount={filteredTasks.length}
        />
      )}

      <div className="task-list__header">
        <div className="task-list__actions">
          {selectedTasks.size > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">
                {selectedTasks.size} task(s) selected
              </span>
              <button
                className="btn btn--secondary"
                onClick={() => handleBulkAction('complete')}
              >
                Mark Complete
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => handleBulkAction('archive')}
              >
                Archive
              </button>
              <button
                className="btn btn--danger"
                onClick={() => handleBulkAction('delete')}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="task-list__sort">
          <label>Sort by:</label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as keyof Task);
              setSortOrder(order as 'asc' | 'desc');
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="dueDate-asc">Due Date (Earliest)</option>
            <option value="dueDate-desc">Due Date (Latest)</option>
            <option value="priority-desc">Priority (High to Low)</option>
            <option value="priority-asc">Priority (Low to High)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      <div className="task-list__content">
        {filteredTasks.length === 0 ? (
          <div className="task-list__empty">
            <p>No tasks found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="task-list__select-all">
              <input
                type="checkbox"
                checked={selectedTasks.size === filteredTasks.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <label>Select All</label>
            </div>

            <div className="task-list__items">
              {filteredTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  selected={selectedTasks.has(task.id)}
                  onSelect={(selected) => handleSelectTask(task.id, selected)}
                  onClick={() => handleTaskSelect(task)}
                  onUpdate={handleTaskUpdate}
                  onDelete={() => handleTaskDelete(task.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showPagination && filteredTasks.length > 0 && (
        <div className="task-list__pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {Math.ceil(totalCount / pageSize)}
          </span>
          <button
            disabled={currentPage * pageSize >= totalCount}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};