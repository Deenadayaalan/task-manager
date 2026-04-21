import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import TaskForm from './TaskForm';

// Mock the api module
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '../services/api';

// Helper to capture navigation
const NavigationTracker = () => {
  return <p data-testid="navigated">Navigated</p>;
};

function renderCreateForm() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/tasks/new']}>
        <Routes>
          <Route path="/tasks/new" element={<TaskForm />} />
          <Route path="/tasks" element={<NavigationTracker />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>
  );
}

function renderEditForm(id = '5') {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[`/tasks/${id}/edit`]}>
        <Routes>
          <Route path="/tasks/:id/edit" element={<TaskForm />} />
          <Route path="/tasks/:id" element={<NavigationTracker />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>
  );
}

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create mode', () => {
    it('renders create form with correct heading', () => {
      renderCreateForm();
      expect(screen.getByRole('heading', { name: 'Create Task' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Task' })).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      renderCreateForm();
      expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Priority/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Assignee/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Due Date/)).toBeInTheDocument();
    });

    it('has correct default values for status and priority', () => {
      renderCreateForm();
      expect(screen.getByLabelText(/Status/)).toHaveValue('TODO');
      expect(screen.getByLabelText(/Priority/)).toHaveValue('MEDIUM');
    });

    it('submits form and navigates to /tasks on success', async () => {
      api.post.mockResolvedValueOnce({ id: 99, title: 'New Task' });
      const user = userEvent.setup();
      renderCreateForm();

      await user.type(screen.getByLabelText(/Title/), 'New Task');
      await user.type(screen.getByLabelText(/Description/), 'A description');
      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/tasks', expect.objectContaining({
          title: 'New Task',
          description: 'A description',
          status: 'TODO',
          priority: 'MEDIUM',
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('navigated')).toBeInTheDocument();
      });
    });
  });

  describe('Edit mode', () => {
    const mockTask = {
      id: 5,
      title: 'Existing Task',
      description: 'Existing description',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignee: 'Alice',
      dueDate: '2025-06-15T00:00:00.000Z',
    };

    it('renders edit form with correct heading', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderEditForm();

      await waitFor(() => {
        expect(screen.getByText('Edit Task')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Update Task' })).toBeInTheDocument();
    });

    it('pre-fills form with existing task data', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderEditForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toHaveValue('Existing Task');
      });
      expect(screen.getByLabelText(/Description/)).toHaveValue('Existing description');
      expect(screen.getByLabelText(/Status/)).toHaveValue('IN_PROGRESS');
      expect(screen.getByLabelText(/Priority/)).toHaveValue('HIGH');
      expect(screen.getByLabelText(/Assignee/)).toHaveValue('Alice');
      expect(screen.getByLabelText(/Due Date/)).toHaveValue('2025-06-15');
    });

    it('submits updated form via PUT and navigates to task detail', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      api.put.mockResolvedValueOnce({ ...mockTask, title: 'Updated Task' });
      const user = userEvent.setup();
      renderEditForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toHaveValue('Existing Task');
      });

      await user.clear(screen.getByLabelText(/Title/));
      await user.type(screen.getByLabelText(/Title/), 'Updated Task');
      await user.click(screen.getByRole('button', { name: 'Update Task' }));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/tasks/5', expect.objectContaining({
          title: 'Updated Task',
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('navigated')).toBeInTheDocument();
      });
    });

    it('shows error when task fails to load', async () => {
      api.get.mockRejectedValueOnce(new Error('Task not found'));
      renderEditForm();

      await waitFor(() => {
        expect(screen.getByText('Task not found')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('shows error when title is empty on submit', async () => {
      const user = userEvent.setup();
      renderCreateForm();

      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('clears title error when user types', async () => {
      const user = userEvent.setup();
      renderCreateForm();

      await user.click(screen.getByRole('button', { name: 'Create Task' }));
      expect(screen.getByText('Title is required')).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Title/), 'A');
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });

    it('shows API error message on submission failure', async () => {
      api.post.mockRejectedValueOnce(new Error('Server error'));
      const user = userEvent.setup();
      renderCreateForm();

      await user.type(screen.getByLabelText(/Title/), 'Test');
      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('disables submit button while submitting', async () => {
      let resolvePost;
      api.post.mockImplementationOnce(() => new Promise((resolve) => { resolvePost = resolve; }));
      const user = userEvent.setup();
      renderCreateForm();

      await user.type(screen.getByLabelText(/Title/), 'Test');
      await user.click(screen.getByRole('button', { name: 'Create Task' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
      });

      resolvePost({ id: 1, title: 'Test' });
    });
  });

  describe('Cancel button', () => {
    it('renders a cancel button', () => {
      renderCreateForm();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });
});
