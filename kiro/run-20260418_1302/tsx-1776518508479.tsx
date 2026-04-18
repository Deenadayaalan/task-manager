import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types/task.types';
import { useTaskService } from '../../hooks/useTaskService';
import './TaskForm.scss';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Partial<Task>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const { createTask, updateTask, loading, error } = useTaskService();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    dueDate: '',
    assignedTo: '',
    tags: [] as string[],
    estimatedHours: 0
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (task && isEditing) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || TaskPriority.MEDIUM,
        status: task.status || TaskStatus.TODO,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedTo: task.assignedTo || '',
        tags: task.tags || [],
        estimatedHours: task.estimatedHours || 0
      });
    }
  }, [task, isEditing]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (formData.estimatedHours < 0) {
      errors.estimatedHours = 'Estimated hours cannot be negative';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      errors.dueDate = 'Due date cannot be in the past';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' ? Number(value) : value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
      };

      if (isEditing && task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }

      onSubmit(taskData);
    } catch (err) {
      console.error('Error submitting task:', err);
    }
  };

  return (
    <div className="task-form">
      <div className="task-form__header">
        <h2>{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="task-form__form">
        {error && (
          <div className="task-form__error" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`form-input ${formErrors.title ? 'form-input--error' : ''}`}
            placeholder="Enter task title"
            maxLength={100}
            required
          />
          {formErrors.title && (
            <span className="form-error">{formErrors.title}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={`form-textarea ${formErrors.description ? 'form-input--error' : ''}`}
            placeholder="Enter task description"
            rows={4}
            maxLength={500}
            required
          />
          {formErrors.description && (
            <span className="form-error">{formErrors.description}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority" className="form-label">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.REVIEW}>Review</option>
              <option value={TaskStatus.DONE}>Done</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className={`form-input ${formErrors.dueDate ? 'form-input--error' : ''}`}
              min={new Date().toISOString().split('T')[0]}
            />
            {formErrors.dueDate && (
              <span className="form-error">{formErrors.dueDate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="estimatedHours" className="form-label">
              Estimated Hours
            </label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleInputChange}
              className={`form-input ${formErrors.estimatedHours ? 'form-input--error' : ''}`}
              min="0"
              step="0.5"
            />
            {formErrors.estimatedHours && (
              <span className="form-error">{formErrors.estimatedHours}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="assignedTo" className="form-label">
            Assigned To
          </label>
          <input
            type="email"
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter assignee email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags</label>
          <div className="tag-input">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="form-input"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn--secondary btn--small"
            >
              Add
            </button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="tag-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag__remove"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn--secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;