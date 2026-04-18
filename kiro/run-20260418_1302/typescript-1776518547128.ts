import { useState, useCallback, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/task.types';
import { useTaskService } from './useTaskService';
import { useNotification } from './useNotification';

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assigneeId?: string;
  tags: string[];
  estimatedHours?: number;
}

interface UseTaskFormOptions {
  task?: Task;
  mode: 'create' | 'edit';
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
}

interface UseTaskFormReturn {
  formData: TaskFormData;
  validationErrors: Partial<TaskFormData>;
  isLoading: boolean;
  isDirty: boolean;
  isValid: boolean;
  updateField: (field: keyof TaskFormData, value: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  validateForm: () => boolean;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.TODO,
  dueDate: '',
  tags: [],
  estimatedHours: undefined,
};

export const useTaskForm = ({
  task,
  mode,
  onSuccess,
  onError
}: UseTaskFormOptions): UseTaskFormReturn => {
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Partial<TaskFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { createTask, updateTask } = useTaskService();
  const { showNotification } = useNotification();

  // Initialize form data
  useEffect(() => {
    if (task && mode === 'edit') {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || TaskPriority.MEDIUM,
        status: task.status || TaskStatus.TODO,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assigneeId: task.assigneeId || '',
        tags: task.tags || [],
        estimatedHours: task.estimatedHours || undefined,
      });
    } else {
      setFormData(initialFormData);
    }
    setIsDirty(false);
    setValidationErrors({});
  }, [task, mode]);

  const updateField = useCallback((field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<TaskFormData> = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    // Due date validation
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }

    // Estimated hours validation
    if (formData.estimatedHours !== undefined) {
      if (formData.estimatedHours < 0) {
        errors.estimatedHours = 'Estimated hours cannot be negative';
      } else if (formData.estimatedHours > 1000) {
        errors.estimatedHours = 'Estimated hours seems too high';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const taskData: Partial<Task> = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        updatedAt: new Date(),
      };

      let result: Task;

      if (mode === 'create') {
        taskData.createdAt = new Date();
        result = await createTask(taskData as Omit<Task, 'id'>);
        showNotification({
          type: 'success',
          title: 'Task Created',
          message: 'Task has been created successfully'
        });
      } else {
        taskData.id = task?.id;
        result = await updateTask(taskData as Task);
        showNotification({
          type: 'success',
          title: 'Task Updated',
          message: 'Task has been updated successfully'
        });
      }

      onSuccess?.(result);
      setIsDirty(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      onError?.(errorMessage);
      showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, mode, task, createTask, updateTask, onSuccess, onError, showNotification]);

  const handleReset = useCallback(() => {
    if (mode === 'edit' && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || TaskPriority.MEDIUM,
        status: task.status || TaskStatus.TODO,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assigneeId: task.assigneeId || '',
        tags: task.tags || [],
        estimatedHours: task.estimatedHours || undefined,
      });
    } else {
      setFormData(initialFormData);
    }
    setValidationErrors({});
    setIsDirty(false);
  }, [mode, task]);

  const isValid = Object.keys(validationErrors).length === 0 && formData.title.trim().length > 0;

  return {
    formData,
    validationErrors,
    isLoading,
    isDirty,
    isValid,
    updateField,
    handleSubmit,
    handleReset,
    validateForm,
  };
};