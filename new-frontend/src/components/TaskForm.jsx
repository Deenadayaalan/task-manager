import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  assignee: '',
  dueDate: '',
};

function toDateInputValue(isoString) {
  if (!isoString) return '';
  return isoString.slice(0, 10);
}

function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { showNotification } = useNotification();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;

    let cancelled = false;
    api.get(`/tasks/${id}`)
      .then((task) => {
        if (cancelled) return;
        setForm({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'TODO',
          priority: task.priority || 'MEDIUM',
          assignee: task.assignee || '',
          dueDate: toDateInputValue(task.dueDate),
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load task');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || null,
        assignee: form.assignee || null,
        description: form.description || null,
      };

      if (isEdit) {
        await api.put(`/tasks/${id}`, payload);
        showNotification('Task updated successfully', 'success');
        navigate(`/tasks/${id}`);
      } else {
        await api.post('/tasks', payload);
        showNotification('Task created successfully', 'success');
        navigate('/tasks');
      }
    } catch (err) {
      showNotification('Failed to save task', 'error');
      setError(err.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading task…</p>;
  }

  return (
    <div className="task-form-page">
      <h2 className="page-title">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assignee">Assignee</label>
            <input
              id="assignee"
              name="assignee"
              type="text"
              value={form.assignee}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskForm;
