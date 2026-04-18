import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { formatDate, getRelativeTime } from '../../utils/date.utils';
import { getPriorityColor, getStatusColor } from '../../utils/task.utils';
import './TaskItem.scss';

interface TaskItemProps {
  task: Task;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
  onUpdate: (task: Task) => void;
  onDelete: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  selected,
  onSelect,
  onClick,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdate({
      ...task,
      status: newStatus,
      completedAt: newStatus === TaskStatus.COMPLETED ? new Date() : undefined
    });
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    onUpdate({
      ...task,
      priority: newPriority
    });
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdate({
        ...task,
        title: editedTitle.trim()
      });
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(task.title);
    setIsEditing(false);
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && 
                   task.status !== TaskStatus.COMPLETED;

  return (
    <div 
      className={`task-item ${selected ? 'task-item--selected' : ''} ${isOverdue ? 'task-item--overdue' : ''}`}
    >
      <div className="task-item__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="task-item__status">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
          onClick={(e) => e.stopPropagation()}
          className={`status-select status-select--${task.status}`}
        >
          <option value={TaskStatus.TODO}>To Do</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.COMPLETED}>Completed</option>
          <option value={TaskStatus.BLOCKED}>Blocked</option>
        </select>
      </div>

      <div className="task-item__content" onClick={onClick}>
        <div className="task-item__header">
          {isEditing ? (
            <div className="task-item__title-edit">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                autoFocus
              />
            </div>
          ) : (
            <h3 
              className="task-item__title"
              onDoubleClick={() => setIsEditing(true)}
            >
              {task.title}
            </h3>
          )}

          <div className="task-item__priority">
            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
              onClick={(e) => e.stopPropagation()}
              className={`priority-select priority-select--${task.priority}`}
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </select>
          </div>
        </div>

        {task.description && (
          <p className="task-item__description">
            {task.description.length > 100 
              ? `${task.description.substring(0, 100)}...`
              : task.description
            }
          </p>
        )}

        <div className="task-item__meta">
          {task.assignee && (
            <div className="task-item__assignee">
              <img 
                src={task.assignee.avatar || '/default-avatar.png'} 
                alt={task.assignee.name}
                className="assignee-avatar"
              />
              <span>{task.assignee.name}</span>
            </div>
          )}

          {task.dueDate && (
            <div className={`task-item__due-date ${isOverdue ? 'overdue' : ''}`}>
              <span>Due: {formatDate(task.dueDate)}</span>
              <span className="relative-time">({getRelativeTime(task.dueDate)})</span>
            </div>
          )}

          <div className="task-item__timestamps">
            <span>Created: {getRelativeTime(task.createdAt)}</span>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <span>Updated: {getRelativeTime(task.updatedAt)}</span>
            )}
          </div>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="task-item__tags">
            {task.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="task-item__actions">
        <button
          className="btn btn--icon"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          title="Edit task"
        >
          ✏️
        </button>
        <button
          className="btn btn--icon btn--danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};