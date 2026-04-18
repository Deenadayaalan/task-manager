// src/components/TaskDetail/TaskDetail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { useTaskService } from '../../hooks/useTaskService';
import { Button } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';
import { Select } from '../ui/Select/Select';
import { TextArea } from '../ui/TextArea/TextArea';
import { LoadingSpinner } from '../ui/LoadingSpinner/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage/ErrorMessage';
import { ConfirmDialog } from '../ui/ConfirmDialog/ConfirmDialog';
import './TaskDetail.scss';

interface TaskDetailProps {
  task: Task | null;
  isEditing?: boolean;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onCloseDetail: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  isEditing: initialEditing = false,
  onTaskUpdated,
  onTaskDeleted,
  onCloseDetail
}) => {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { updateTask, deleteTask, isLoading } = useTaskService();

  // Initialize edit form when task changes
  useEffect(() => {
    if (task) {
      setEditForm({ ...task });
    }
  }, [task]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof Task, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  }, []);

  // Handle edit mode toggle
  const handleEdit = useCallback(() => {
    if (task) {
      setIsEditing(true);
      setEditForm({ ...task });
      setError(null);
    }
  }, [task]);

  // Handle save operation
  const handleSave = useCallback(async () => {
    if (!editForm || !task) return;

    try {
      const updatedTask = await updateTask(task.id, editForm as Task);
      setIsEditing(false);
      onTaskUpdated(updatedTask);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [editForm, task, updateTask, onTaskUpdated]);

  // Handle delete operation
  const handleDelete = useCallback(async () => {
    if (!task) return;

    try {
      await deleteTask(task.id);
      onTaskDeleted(task.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      setShowDeleteConfirm(false);
    }
  }, [task, deleteTask, onTaskDeleted]);

  // Handle cancel operation
  const handleCancel = useCallback(() => {
    if (task) {
      setIsEditing(false);
      setEditForm({ ...task });
      setError(null);
    }
  }, [task]);

  // Handle close operation
  const handleClose = useCallback(() => {
    onCloseDetail();
  }, [onCloseDetail]);

  // Validate form
  const isFormValid = useCallback(() => {
    return editForm.title?.trim() && editForm.description?.trim();
  }, [editForm]);

  if (!task) {
    return (
      <div className="task-detail task-detail--empty">
        <div className="task-detail__empty-state">
          <h3>No Task Selected</h3>
          <p>Select a task to view its details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-detail">
      <div className="task-detail__header">
        <h2 className="task-detail__title">
          {isEditing ? 'Edit Task' : 'Task Details'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="task-detail__close-btn"
          aria-label="Close task details"
        >
          ×
        </Button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          className="task-detail__error"
        />
      )}

      <div className="task-detail__content">
        {isEditing ? (
          <form className="task-detail__form" onSubmit={(e) => e.preventDefault()}>
            <div className="task-detail__field">
              <label htmlFor="task-title" className="task-detail__label">
                Title *
              </label>
              <Input
                id="task-title"
                value={editForm.title || ''}
                onChange={(value) => handleFieldChange('title', value)}
                placeholder="Enter task title"
                required
                disabled={isLoading}
              />
            </div>

            <div className="task-detail__field">
              <label htmlFor="task-description" className="task-detail__label">
                Description *
              </label>
              <TextArea
                id="task-description"
                value={editForm.description || ''}
                onChange={(value) => handleFieldChange('description', value)}
                placeholder="Enter task description"
                rows={4}
                required
                disabled={isLoading}
              />
            </div>

            <div className="task-detail__field-row">
              <div className="task-detail__field">
                <label htmlFor="task-status" className="task-detail__label">
                  Status
                </label>
                <Select
                  id="task-status"
                  value={editForm.status || TaskStatus.TODO}
                  onChange={(value) => handleFieldChange('status', value)}
                  disabled={isLoading}
                  options={[
                    { value: TaskStatus.TODO, label: 'To Do' },
                    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
                    { value: TaskStatus.DONE, label: 'Done' }
                  ]}
                />
              </div>

              <div className="task-detail__field">
                <label htmlFor="task-priority" className="task-detail__label">
                  Priority
                </label>
                <Select
                  id="task-priority"
                  value={editForm.priority || TaskPriority.MEDIUM}
                  onChange={(value) => handleFieldChange('priority', value)}
                  disabled={isLoading}
                  options={[
                    { value: TaskPriority.LOW, label: 'Low' },
                    { value: TaskPriority.MEDIUM, label: 'Medium' },
                    { value: TaskPriority.HIGH, label: 'High' }
                  ]}
                />
              </div>
            </div>

            <div className="task-detail__field-row">
              <div className="task-detail__field">
                <label htmlFor="task-due-date" className="task-detail__label">
                  Due Date
                </label>
                <Input
                  id="task-due-date"
                  type="datetime-local"
                  value={editForm.dueDate ? new Date(editForm.dueDate).toISOString().slice(0, 16) : ''}
                  onChange={(value) => handleFieldChange('dueDate', value ? new Date(value) : null)}
                  disabled={isLoading}
                />
              </div>

              <div className="task-detail__field">
                <label htmlFor="task-assignee" className="task-detail__label">
                  Assignee
                </label>
                <Input
                  id="task-assignee"
                  value={editForm.assigneeId || ''}
                  onChange={(value) => handleFieldChange('assigneeId', value)}
                  placeholder="Enter assignee ID"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="task-detail__actions">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="task-detail__view">
            <div className="task-detail__field">
              <label className="task-detail__label">Title</label>
              <div className="task-detail__value">{task.title}</div>
            </div>

            <div className="task-detail__field">
              <label className="task-detail__label">Description</label>
              <div className="task-detail__value task-detail__value--description">
                {task.description}
              </div>
            </div>

            <div className="task-detail__field-row">
              <div className="task-detail__field">
                <label className="task-detail__label">Status</label>
                <div className={`task-detail__badge task-detail__badge--${task.status.toLowerCase()}`}>
                  {task.status.replace('_', ' ')}
                </div>
              </div>

              <div className="task-detail__field">
                <label className="task-detail__label">Priority</label>
                <div className={`task-detail__badge task-detail__badge--${task.priority.toLowerCase()}`}>
                  {task.priority}
                </div>
              </div>
            </div>

            <div className="task-detail__field-row">
              <div className="task-detail__field">
                <label className="task-detail__label">Due Date</label>
                <div className="task-detail__value">
                  {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}
                </div>
              </div>

              <div className="task-detail__field">
                <label className="task-detail__label">Assignee</label>
                <div className="task-detail__value">
                  {task.assigneeId || 'Unassigned'}
                </div>
              </div>
            </div>

            <div className="task-detail__field-row">
              <div className="task-detail__field">
                <label className="task-detail__label">Created</label>
                <div className="task-detail__value">
                  {new Date(task.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="task-detail__field">
                <label className="task-detail__label">Updated</label>
                <div className="task-detail__value">
                  {new Date(task.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="task-detail__actions">
              <Button
                variant="primary"
                onClick={handleEdit}
                disabled={isLoading}
              >
                Edit Task
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                Delete Task
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </div>
  );
};

export default TaskDetail;