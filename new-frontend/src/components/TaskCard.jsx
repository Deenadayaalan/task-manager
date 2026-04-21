import React from 'react';
import { Link } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatShortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'DONE') return false;
  return new Date(dateStr) < new Date();
}

function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const overdue = isOverdue(task.dueDate, task.status);
  const priority = (task.priority || 'MEDIUM').toLowerCase();

  return (
    <div
      ref={setNodeRef}
      className={`task-card${isDragging ? ' dragging' : ''}`}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`Task: ${task.title}, Priority: ${task.priority}, Status: ${task.status}`}
    >
      <Link
        to={`/tasks/${task.id}`}
        className="task-card__title"
        onClick={(e) => e.stopPropagation()}
      >
        {task.title}
      </Link>
      <div className="task-card__meta">
        <span className={`badge badge--priority-${priority}`}>
          {(task.priority || 'MEDIUM').toUpperCase()}
        </span>
        {task.dueDate && (
          <span className={`task-card__date${overdue ? ' task-card__date--overdue' : ''}`}>
            {overdue && '⚠ '}
            {formatShortDate(task.dueDate)}
          </span>
        )}
        {task.assignee && (
          <span className="task-card__avatar" title={task.assignee}>
            {getInitials(task.assignee)}
          </span>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
