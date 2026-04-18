import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TaskForm } from '../../components/TaskForm/TaskForm';
import { useTaskForm } from '../../hooks/useTaskForm';
import { useTask } from '../../hooks/useTask';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage/ErrorMessage';
import { Task } from '../../types/task.types';

interface TaskFormContainerProps {
  mode?: 'create' | 'edit';
}

export const TaskFormContainer: React.FC<TaskFormContainerProps> = ({
  mode = 'create'
}) => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  
  const {
    task,
    isLoading: taskLoading,
    error: taskError
  } = useTask(mode === 'edit' ? taskId : undefined);

  const {
    formData,
    validationErrors,
    isLoading: formLoading,
    isDirty,
    isValid,
    updateField,
    handleSubmit,
    handleReset,
  } = useTaskForm({
    task,
    mode,
    onSuccess: (savedTask: Task) => {
      navigate(`/tasks/${savedTask.id}`);
    },
    onError: (error: string) => {
      console.error('Task form error:', error);
    }
  });

  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmLeave) return;
    }
    
    navigate(mode === 'edit' && task ? `/tasks/${task.id}` : '/tasks');
  };

  const handleFormSubmit = (taskData: Partial<Task>) => {
    // The useTaskForm hook handles the actual submission
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  if (mode === 'edit' && taskLoading) {
    return (
      <div className="task-form-container__loading">
        <LoadingSpinner size="large" />
        <p>Loading task...</p>
      </div>
    );
  }

  if (mode === 'edit' && taskError) {
    return (
      <div className="task-form-container__error">
        <ErrorMessage 
          message={taskError} 
          title="Failed to load task"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (mode === 'edit' && !task && !taskLoading) {
    return (
      <div className="task-form-container__not-found">
        <ErrorMessage 
          message="Task not found"
          title="Task Not Found"
          onRetry={() => navigate('/tasks')}
          retryLabel="Go to Tasks"
        />
      </div>
    );
  }

  return (
    <div className="task-form-container">
      <TaskForm
        task={task}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isLoading={formLoading}
        mode={mode}
      />
    </div>
  );
};

export default TaskFormContainer;