import React from 'react';
import { Icon } from '../common/Icon';
import './TaskSort.scss';

interface SortState {
  field: 'title' | 'dueDate' | 'priority' | 'status' | 'createdAt';
  direction: 'asc' | 'desc';
}

interface TaskSortProps {
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}

export const TaskSort: React.FC<TaskSortProps> = ({
  sort,
  onSortChange
}) => {
  const handleSortChange = (field: SortState['field']) => {
    if (sort.field === field) {
      // Toggle direction if same field
      onSortChange({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Set new field with default direction
      onSortChange({
        field,
        direction: 'desc'
      });
    }
  };

  const getSortIcon = (field: SortState['field']) => {
    if (sort.field !== field) {
      return 'chevron-up-down';
    }
    return sort.direction === 'asc' ? 'chevron-up' : 'chevron-down';
  };

  return (
    <div className="task-sort">
      <span className="task-sort__label">Sort by:</span>
      
      <div className="task-sort__options">
        <button
          className={`task-sort__option ${sort.field === 'title' ? 'task-sort__option--active' : ''}`}
          onClick={() => handleSortChange('title')}
        >
          Title
          <Icon name={getSortIcon('title')} size="sm" />
        </button>

        <button
          className={`task-sort__option ${sort.field === 'dueDate' ? 'task-sort__option--active' : ''}`}
          onClick={() => handleSortChange('dueDate')}
        >
          Due Date
          <Icon name={getSortIcon('dueDate')} size="sm" />
        </button>

        <button
          className={`task-sort__option ${sort.field === 'priority' ? 'task-sort__option--active' : ''}`}
          onClick={() => handleSortChange('priority')}
        >
          Priority
          <Icon name={getSortIcon('priority')} size="sm" />
        </button>

        <button
          className={`task-sort__option ${sort.field === 'status' ? 'task-sort__option--active' : ''}`}
          onClick={() => handleSortChange('status')}
        >
          Status
          <Icon name={getSortIcon('status')} size="sm" />
        </button>

        <button
          className={`task-sort__option ${sort.field === 'createdAt' ? 'task-sort__option--active' : ''}`}
          onClick={() => handleSortChange('createdAt')}
        >
          Created
          <Icon name={getSortIcon('createdAt')} size="sm" />
        </button>
      </div>
    </div>
  );
};