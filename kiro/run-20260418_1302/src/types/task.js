// src/types/task.js

/**
 * Task status enumeration
 */
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Task priority enumeration
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Task category enumeration
 */
export const TaskCategory = {
  WORK: 'work',
  PERSONAL: 'personal',
  SHOPPING: 'shopping',
  HEALTH: 'health',
  EDUCATION: 'education',
  OTHER: 'other'
};

/**
 * Default task structure
 */
export const createDefaultTask = () => ({
  id: null,
  title: '',
  description: '',
  status: TaskStatus.PENDING,
  priority: TaskPriority.MEDIUM,
  category: TaskCategory.WORK,
  assignedTo: null,
  createdBy: null,
  dueDate: null,
  completedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
  attachments: [],
  comments: [],
  estimatedHours: null,
  actualHours: null,
  progress: 0
});

/**
 * Task validation schema
 */
export const validateTask = (task) => {
  const errors = {};
  
  if (!task.title || task.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (task.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }
  
  if (task.description && task.description.length > 2000) {
    errors.description = 'Description must be less than 2000 characters';
  }
  
  if (!Object.values(TaskStatus).includes(task.status)) {
    errors.status = 'Invalid task status';
  }
  
  if (!Object.values(TaskPriority).includes(task.priority)) {
    errors.priority = 'Invalid task priority';
  }
  
  if (task.dueDate && new Date(task.dueDate) < new Date()) {
    errors.dueDate = 'Due date cannot be in the past';
  }
  
  if (task.estimatedHours && (task.estimatedHours < 0 || task.estimatedHours > 1000)) {
    errors.estimatedHours = 'Estimated hours must be between 0 and 1000';
  }
  
  if (task.progress && (task.progress < 0 || task.progress > 100)) {
    errors.progress = 'Progress must be between 0 and 100';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Task utility functions
 */
export const TaskUtils = {
  /**
   * Check if task is overdue
   */
  isOverdue: (task) => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  },
  
  /**
   * Check if task is due today
   */
  isDueToday: (task) => {
    if (!task.dueDate) return false;
    const today = new Date().toDateString();
    return new Date(task.dueDate).toDateString() === today;
  },
  
  /**
   * Get task age in days
   */
  getTaskAge: (task) => {
    const created = new Date(task.createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  },
  
  /**
   * Get priority color
   */
  getPriorityColor: (priority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return '#DC2626';
      case TaskPriority.HIGH:
        return '#EF4444';
      case TaskPriority.MEDIUM:
        return '#F59E0B';
      case TaskPriority.LOW:
        return '#10B981';
      default:
        return '#6B7280';
    }
  },
  
  /**
   * Get status color
   */
  getStatusColor: (status) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return '#10B981';
      case TaskStatus.IN_PROGRESS:
        return '#3B82F6';
      case TaskStatus.PENDING:
        return '#F59E0B';
      case TaskStatus.CANCELLED:
        return '#EF4444';
      default:
        return '#6B7280';
    }
  },
  
  /**
   * Format task for display
   */
  formatTask: (task) => ({
    ...task,
    formattedDueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null,
    formattedCreatedAt: new Date(task.createdAt).toLocaleDateString(),
    isOverdue: TaskUtils.isOverdue(task),
    isDueToday: TaskUtils.isDueToday(task),
    age: TaskUtils.getTaskAge(task),
    priorityColor: TaskUtils.getPriorityColor(task.priority),
    statusColor: TaskUtils.getStatusColor(task.status)
  })
};