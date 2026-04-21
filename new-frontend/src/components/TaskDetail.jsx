import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/tasks/${id}`)
      .then((data) => {
        setTask(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load task');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      showNotification('Task deleted', 'success');
      navigate('/tasks');
    } catch (err) {
      showNotification(err.message || 'Failed to delete task', 'error');
      setError(err.message || 'Failed to delete task');
    }
  }

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    const previousTask = { ...task };
    // Optimistic update
    setTask((prev) => ({ ...prev, status: newStatus }));
    try {
      const updated = await api.patch(`/tasks/${id}/status`, { status: newStatus });
      setTask(updated);
      showNotification('Status updated', 'success');
    } catch (err) {
      // Revert on failure
      setTask(previousTask);
      showNotification(err.message || 'Failed to update status', 'error');
      setError(err.message || 'Failed to update status');
    }
  }

  if (loading) {
    return <p className="loading-message">Loading task...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!task) {
    return <p className="error-message">Task not found</p>;
  }

  return (
    <div className="task-detail">
      <div className="task-detail__header">
        <h2 className="page-title">{task.title}</h2>
        <div className="task-detail__actions">
          <Link to={`/tasks/${id}/edit`} className="btn btn--primary">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn--danger">
            Delete
          </button>
        </div>
      </div>
      <div className="task-detail__badges">
        <span className={`badge badge--status-${task.status?.toLowerCase()}`}>
          {task.status}
        </span>
        <span className={`badge badge--priority-${task.priority?.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>
      <div className="task-detail__body">
        <div className="detail-field">
          <label>Description</label>
          <p>{task.description || 'No description'}</p>
        </div>
        <div className="detail-row">
          <div className="detail-field">
            <label>Assignee</label>
            <p>{task.assignee || '—'}</p>
          </div>
          <div className="detail-field">
            <label>Due Date</label>
            <p>{formatDate(task.dueDate)}</p>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-field">
            <label>Created</label>
            <p>{formatDate(task.createdAt)}</p>
          </div>
          <div className="detail-field">
            <label>Updated</label>
            <p>{formatDate(task.updatedAt)}</p>
          </div>
        </div>
      </div>
      <div className="task-detail__status-change">
        <label htmlFor="status-select">Change Status:</label>
        <select
          id="status-select"
          value={task.status}
          onChange={handleStatusChange}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
    </div>
  );
}

export default TaskDetail;
