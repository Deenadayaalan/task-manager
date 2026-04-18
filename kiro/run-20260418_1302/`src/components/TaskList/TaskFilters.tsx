import React from 'react';
import { TaskStatus, TaskPriority } from '../../types/task.types';
import './TaskFilters.scss';

interface TaskFiltersProps {
  filters: {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    assignee: string | 'all';
    dueDate: 'overdue' | 'today' | 'week' | 'all';
    searchTerm: string;
  };
  onFiltersChange: (filters: any) => void;
  taskCount: number;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  taskCount
}) => {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dueDate: 'all',
      searchTerm: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value, index) => {
      const keys = Object.keys(filters);
      return keys[index] === 'searchTerm' ? value !== '' : value !== 'all';
    }
  );

  return (
    <div className="task-filters">
      <div className="task-filters__header">
        <h3>Filters</h3>
        <span className="task-count">{taskCount} tasks</span>
        {hasActiveFilters && (
          <button 
            className="btn btn--link"
            onClick={clearFilters}
          >
            Clear All
          </button>
        )}
      </div>

      <div className="task-filters__content">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value={TaskStatus.TODO}>To Do</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
            <option value={TaskStatus.BLOCKED}>Blocked</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.URGENT}>Urgent</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Due Date:</label>
          <select
            value={filters.dueDate}
            onChange={(e) => updateFilter('dueDate', e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
          </select>
        </div>
      </div>
    </div>
  );
};