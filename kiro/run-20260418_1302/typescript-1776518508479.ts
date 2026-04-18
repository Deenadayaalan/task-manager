import { useState, useCallback } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/task.types';

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
  tags: string[];
  estimatedHours: number;
}

export interface TaskFormErrors {
  [key: string]: string;
}

export const useTaskForm = (initialTask?: Task) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    priority: initialTask?.priority || TaskPriority.MEDIUM,
    status: initialTask?.status || TaskStatus.TODO,
    dueDate: initialTask?.dueDate 
      ? new Date(initialTask.dueDate).toISOString().split('T')[0] 
      : '',
    assignedTo: initialTask?.assignedTo || '',
    tags: initialTask?.tags || [],
    estimatedHours: initialTask?.estimatedHours || 0
  });

  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback((field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  const addTag = useCallback((tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      updateField('tags', [...formData.tags, tag.trim()]);
    }
  }, [formData.tags, updateField]);

  const removeTag = useCallback((tagToRemove: string) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, updateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: TaskFormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    // Estimated hours validation
    if (formData.estimatedHours < 0) {
      newErrors.estimatedHours = 'Estimated hours cannot be negative';
    } else if (formData.estimatedHours > 1000) {
      newErrors.estimatedHours = 'Estimated hours seems too high';
    }

    // Due date validation
    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    // Assigned to validation (if provided, should be valid email)
    if (formData.assignedTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.assignedTo)) {
      newErrors.assignedTo = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: '',
      assignedTo: '',
      tags: [],
      estimatedHours: 0
    });
    setErrors({});
    setIsDirty(false);
  }, []);

  const getTaskData = useCallback((): Partial<Task> => {
    return {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    };
  }, [formData]);

  return {
    formData,
    errors,
    isDirty,
    updateField,
    addTag,
    removeTag,
    validateForm,
    resetForm,
    getTaskData
  };
};