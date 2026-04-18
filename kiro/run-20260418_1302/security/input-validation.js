// security/input-validation.js
import DOMPurify from 'dompurify';
import validator from 'validator';

export class InputValidator {
  static sanitizeHtml(input) {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  static validateEmail(email) {
    return validator.isEmail(email) && email.length <= 254;
  }

  static validateTaskTitle(title) {
    if (!title || typeof title !== 'string') return false;
    const sanitized = this.sanitizeHtml(title.trim());
    return sanitized.length >= 1 && sanitized.length <= 200;
  }

  static validateTaskDescription(description) {
    if (!description) return true; // Optional field
    if (typeof description !== 'string') return false;
    const sanitized = this.sanitizeHtml(description.trim());
    return sanitized.length <= 2000;
  }

  static validateTaskPriority(priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority);
  }

  static validateTaskStatus(status) {
    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    return validStatuses.includes(status);
  }

  static validateId(id) {
    return validator.isUUID(id) || validator.isAlphanumeric(id);
  }

  static sanitizeInput(input, type = 'text') {
    if (typeof input !== 'string') return '';
    
    let sanitized = input.trim();
    
    switch (type) {
      case 'html':
        return this.sanitizeHtml(sanitized);
      case 'email':
        return validator.normalizeEmail(sanitized) || '';
      case 'url':
        return validator.isURL(sanitized) ? sanitized : '';
      default:
        return validator.escape(sanitized);
    }
  }

  static validateTaskData(taskData) {
    const errors = [];
    
    if (!this.validateTaskTitle(taskData.title)) {
      errors.push('Invalid task title');
    }
    
    if (!this.validateTaskDescription(taskData.description)) {
      errors.push('Invalid task description');
    }
    
    if (!this.validateTaskPriority(taskData.priority)) {
      errors.push('Invalid task priority');
    }
    
    if (!this.validateTaskStatus(taskData.status)) {
      errors.push('Invalid task status');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: {
        title: this.sanitizeInput(taskData.title),
        description: this.sanitizeInput(taskData.description, 'html'),
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null
      }
    };
  }
}