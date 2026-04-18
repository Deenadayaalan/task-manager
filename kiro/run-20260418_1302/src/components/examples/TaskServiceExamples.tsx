// src/components/examples/TaskServiceExamples.tsx
import React from 'react';
import { useOptimizedTaskService } from '../../hooks/useOptimizedTaskService';
import { TaskStatus, TaskPriority } from '../../types/task.types';

export const TaskServiceExamples: React.FC = () => {
  const {
    tasks,
    loading,
    error,
    metrics,
    taskGroups,
    createTask,
    updateTask,
    deleteTask,
    bulkOperations,
  } = useOptimizedTaskService();

  const handleCreateTask = async () => {
    try {
      await createTask({
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleBulkComplete = async () => {
    const todoTasks = taskGroups.byStatus[TaskStatus.TODO] || [];
    const taskIds = todoTasks.map(task => task.id);
    
    try {
      await bulkOperations.markAsComplete(taskIds);
    } catch (error) {
      console.error('Failed to complete tasks:', error);
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="task-service-examples">
      <h2>Task Service Examples</h2>
      
      {/* Metrics Display */}
      <div className="metrics">
        <h3>Task Metrics</h3>
        <p>Total: {metrics.totalTasks}</p>
        <p>Completed: {metrics.completedTasks}</p>
        <p>Pending: {metrics.pendingTasks}</p>
        <p>Overdue: {metrics.overdueTasks}</p>
      </div>

      {/* Actions */}
      <div className="actions">
        <button onClick={handleCreateTask}>Create Task</button>
        <button onClick={handleBulkComplete}>Complete All TODO Tasks</button>
      </div>

      {/* Task Groups */}
      <div className="task-groups">
        {Object.entries(taskGroups.byStatus).map(([status, statusTasks]) => (
          <div key={status} className="status-group">
            <h4>{status} ({statusTasks.length})</h4>
            {statusTasks.map(task => (
              <div key={task.id} className="task-item">
                <span>{task.title}</span>
                <button onClick={() => updateTask(task.id, { status: TaskStatus.DONE })}>
                  Complete
                </button>
                <button onClick={() => deleteTask(task.id)}>Delete</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};