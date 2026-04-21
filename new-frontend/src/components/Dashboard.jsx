import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function StatCard({ title, value, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <p className="stat-card__title">{title}</p>
      <p className="stat-card__value">{value}</p>
    </div>
  );
}

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  const total = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  const now = new Date();
  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
  ).length;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard">
      <h2 className="page-title">Dashboard</h2>
      <div className="stat-cards">
        <StatCard title="Total Tasks" value={total} color="primary" />
        <StatCard title="To Do" value={todoCount} color="blue" />
        <StatCard title="In Progress" value={inProgressCount} color="yellow" />
        <StatCard title="Done" value={doneCount} color="green" />
        <StatCard title="Overdue" value={overdueCount} color="red" />
      </div>
      <div className="recent-tasks">
        <h3>Recent Tasks</h3>
        <div className="task-list-simple">
          {recentTasks.map((task) => (
            <div key={task.id} className="task-item">
              <Link to={`/tasks/${task.id}`} className="task-item__title">
                {task.title}
              </Link>
              <span className={`badge badge--status-${task.status.toLowerCase()}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`badge badge--priority-${task.priority.toLowerCase()}`}>
                {task.priority}
              </span>
              <span className="task-item__assignee">{task.assignee || '—'}</span>
              <span className="task-item__date">{formatDate(task.dueDate)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
