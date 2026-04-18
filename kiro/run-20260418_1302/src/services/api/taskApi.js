// src/services/api/taskApi.js
import { apiClient } from './apiClient';

export const taskApi = {
  /**
   * Get all tasks for the current user
   */
  getTasks: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/tasks${queryParams ? `?${queryParams}` : ''}`);
  },

  /**
   * Get a specific task by ID
   */
  getTask: async (taskId) => {
    return apiClient.get(`/tasks/${taskId}`);
  },

  /**
   * Create a new task
   */
  createTask: async (taskData) => {
    return apiClient.post('/tasks', taskData);
  },

  /**
   * Update an existing task
   */
  updateTask: async (taskId, updates) => {
    return apiClient.put(`/tasks/${taskId}`, updates);
  },

  /**
   * Partially update a task
   */
  patchTask: async (taskId, updates) => {
    return apiClient.patch(`/tasks/${taskId}`, updates);
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId) => {
    return apiClient.delete(`/tasks/${taskId}`);
  },

  /**
   * Add a comment to a task
   */
  addComment: async (taskId, comment) => {
    return apiClient.post(`/tasks/${taskId}/comments`, comment);
  },

  /**
   * Update a comment
   */
  updateComment: async (taskId, commentId, updates) => {
    return apiClient.put(`/tasks/${taskId}/comments/${commentId}`, updates);
  },

  /**
   * Delete a comment
   */
  deleteComment: async (taskId, commentId) => {
    return apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
  },

  /**
   * Upload attachment to task
   */
  uploadAttachment: async (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Delete attachment from task
   */
  deleteAttachment: async (taskId, attachmentId) => {
    return apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  },

  /**
   * Get task history/audit log
   */
  getTaskHistory: async (taskId) => {
    return apiClient.get(`/tasks/${taskId}/history`);
  },

  /**
   * Bulk update tasks
   */
  bulkUpdateTasks: async (taskIds, updates) => {
    return apiClient.patch('/tasks/bulk', {
      taskIds,
      updates
    });
  },

  /**
   * Bulk delete tasks
   */
  bulkDeleteTasks: async (taskIds) => {
    return apiClient.delete('/tasks/bulk', {
      data: { taskIds }
    });
  }
};