import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fetchTasks = useCallback(() => {
    setLoading(true);
    api.get('/tasks')
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter, priorityFilter, assigneeFilter, searchQuery]);

  const uniqueAssignees = useMemo(() => {
    const assignees = tasks
      .map((t) => t.assignee)
      .filter((a) => a != null && a !== '');
    return [...new Set(assignees)].sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (assigneeFilter && task.assignee !== assigneeFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title && task.title.toLowerCase().includes(query);
        const descMatch = task.description && task.description.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ');
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredTasks.map((t) => t.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIds);
    }
  };

  const toggleSelectOne = (taskId) => {
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkDone = async () => {
    try {
      await api.post('/tasks/bulk-status', { taskIds: [...selectedIds], status: 'DONE' });
      showNotification(`${selectedIds.length} task(s) marked as Done`, 'success');
      setSelectedIds([]);
      fetchTasks();
    } catch (err) {
      showNotification(err.message || 'Failed to update tasks', 'error');
    }
  };

  const handleBulkInProgress = async () => {
    try {
      await api.post('/tasks/bulk-status', { taskIds: [...selectedIds], status: 'IN_PROGRESS' });
      showNotification(`${selectedIds.length} task(s) marked as In Progress`, 'success');
      setSelectedIds([]);
      fetchTasks();
    } catch (err) {
      showNotification(err.message || 'Failed to update tasks', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} task(s)?`)) return;
    try {
      await api.post('/tasks/bulk-delete', { taskIds: [...selectedIds] });
      showNotification(`${selectedIds.length} task(s) deleted`, 'success');
      setSelectedIds([]);
      fetchTasks();
    } catch (err) {
      showNotification(err.message || 'Failed to delete tasks', 'error');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showNotification('Task deleted', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete task', 'error');
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="task-list-page">
      <div className="task-list-header">
        <h2 className="page-title">Backlog</h2>
      </div>
      <div className="search-bar">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search tasks"
        />
      </div>
      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          aria-label="Filter by assignee"
        >
          <option value="">All Assignees</option>
          {uniqueAssignees.map((assignee) => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>
      </div>
      {selectedIds.length > 0 && (
        <div className="bulk-toolbar">
          <span>{selectedIds.length} task(s) selected</span>
          <button onClick={handleBulkDone} className="btn btn--sm btn--primary">Mark as Done</button>
          <button onClick={handleBulkInProgress} className="btn btn--sm">Mark as In Progress</button>
          <button onClick={handleBulkDelete} className="btn btn--sm btn--danger">Delete Selected</button>
        </div>
      )}
      <table className="task-table">
        <thead>
          <tr>
            <th className="checkbox-cell">
              <input
                type="checkbox"
                checked={filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.includes(t.id))}
                onChange={toggleSelectAll}
                aria-label="Select all tasks"
              />
            </th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => (
            <tr key={task.id}>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task.id)}
                  onChange={() => toggleSelectOne(task.id)}
                  aria-label={`Select ${task.title}`}
                />
              </td>
              <td>
                <Link to={`/tasks/${task.id}`}>{task.title}</Link>
              </td>
              <td>
                <span className={`badge badge--status-${task.status.toLowerCase()}`}>
                  {formatStatus(task.status)}
                </span>
              </td>
              <td>
                <span className={`badge badge--priority-${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
              </td>
              <td>{task.assignee || '—'}</td>
              <td>{formatDate(task.dueDate)}</td>
              <td className="actions-cell">
                <Link to={`/tasks/${task.id}/edit`} className="btn btn--sm">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="btn btn--sm btn--danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TaskList;
