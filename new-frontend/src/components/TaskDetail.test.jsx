import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import TaskDetail from './TaskDetail';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../services/api';

const NavigationTracker = () => <p data-testid="navigated">Navigated</p>;

const mockTask = {
  id: 3,
  title: 'Implement login',
  description: 'Add OAuth2 login flow',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  assignee: 'Alice',
  dueDate: '2025-07-15T00:00:00.000Z',
  createdAt: '2025-06-01T10:30:00.000Z',
  updatedAt: '2025-06-10T14:00:00.000Z',
};

function renderDetail(id = '3') {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[`/tasks/${id}`]}>
        <Routes>
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/tasks/:id/edit" element={<NavigationTracker />} />
          <Route path="/tasks" element={<NavigationTracker />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>
  );
}

describe('TaskDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and error states', () => {
    it('shows loading message while fetching', () => {
      api.get.mockReturnValue(new Promise(() => {})); // never resolves
      renderDetail();
      expect(screen.getByText('Loading task...')).toBeInTheDocument();
    });

    it('shows error message when fetch fails', async () => {
      api.get.mockRejectedValueOnce(new Error('Task not found'));
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('Task not found')).toBeInTheDocument();
      });
    });
  });

  describe('Read-only display (9.1)', () => {
    it('displays task title as heading', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Implement login' })).toBeInTheDocument();
      });
    });

    it('displays status and priority badges', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
      });
    });

    it('displays description', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('Add OAuth2 login flow')).toBeInTheDocument();
      });
    });

    it('displays assignee', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });

    it('shows "No description" when description is empty', async () => {
      api.get.mockResolvedValueOnce({ ...mockTask, description: '' });
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('No description')).toBeInTheDocument();
      });
    });

    it('shows dash for missing assignee', async () => {
      api.get.mockResolvedValueOnce({ ...mockTask, assignee: null });
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });
      // The assignee field should show a dash
      const assigneeLabel = screen.getByText('Assignee');
      const assigneeValue = assigneeLabel.closest('.detail-field').querySelector('p');
      expect(assigneeValue.textContent).toBe('—');
    });

    it('fetches task by ID from route params', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail('3');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/tasks/3');
      });
    });
  });

  describe('Action buttons (9.2)', () => {
    it('renders Edit link that navigates to edit page', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail();

      await waitFor(() => {
        const editLink = screen.getByRole('link', { name: 'Edit' });
        expect(editLink).toBeInTheDocument();
        expect(editLink).toHaveAttribute('href', '/tasks/3/edit');
      });
    });

    it('renders Delete button', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      });
    });

    it('deletes task and navigates to /tasks on confirm', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      api.delete.mockResolvedValueOnce(null);
      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
      const user = userEvent.setup();
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/tasks/3');
      });
      await waitFor(() => {
        expect(screen.getByTestId('navigated')).toBeInTheDocument();
      });

      window.confirm.mockRestore();
    });

    it('does not delete when confirm is cancelled', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
      const user = userEvent.setup();
      renderDetail();

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(api.delete).not.toHaveBeenCalled();
      window.confirm.mockRestore();
    });

    it('renders Change Status dropdown with current value', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      renderDetail();

      await waitFor(() => {
        const select = screen.getByLabelText('Change Status:');
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue('IN_PROGRESS');
      });
    });

    it('changes status via PATCH and updates display', async () => {
      api.get.mockResolvedValueOnce(mockTask);
      api.patch.mockResolvedValueOnce({ ...mockTask, status: 'DONE' });
      const user = userEvent.setup();
      renderDetail();

      await waitFor(() => {
        expect(screen.getByLabelText('Change Status:')).toHaveValue('IN_PROGRESS');
      });

      await user.selectOptions(screen.getByLabelText('Change Status:'), 'DONE');

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/tasks/3/status', { status: 'DONE' });
      });
      await waitFor(() => {
        expect(screen.getByLabelText('Change Status:')).toHaveValue('DONE');
      });
    });
  });
});
