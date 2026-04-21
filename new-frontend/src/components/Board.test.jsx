import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import Board from './Board';

const mockTasks = [
  { id: 1, title: 'Task A', status: 'TODO', priority: 'HIGH', assignee: 'Alice', dueDate: '2099-06-01' },
  { id: 2, title: 'Task B', status: 'TODO', priority: 'LOW', assignee: 'Bob', dueDate: '2099-07-01' },
  { id: 3, title: 'Task C', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'Charlie', dueDate: '2099-08-01' },
  { id: 4, title: 'Task D', status: 'DONE', priority: 'HIGH', assignee: 'Diana', dueDate: '2099-09-01' },
  { id: 5, title: 'Task E', status: 'DONE', priority: 'LOW', assignee: null, dueDate: null },
];

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../services/api';

function renderBoard() {
  return render(
    <NotificationProvider>
      <MemoryRouter>
        <Board />
      </MemoryRouter>
    </NotificationProvider>
  );
}

describe('Board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    renderBoard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('renders three columns with correct titles', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  it('groups tasks into correct columns', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('Task A')).toBeInTheDocument();
      expect(screen.getByText('Task B')).toBeInTheDocument();
      expect(screen.getByText('Task C')).toBeInTheDocument();
      expect(screen.getByText('Task D')).toBeInTheDocument();
      expect(screen.getByText('Task E')).toBeInTheDocument();
    });

    // Check column task counts: TODO=2, IN_PROGRESS=1, DONE=2
    const todoColumn = screen.getByLabelText(/To Do column, 2 tasks/);
    expect(todoColumn).toBeInTheDocument();

    const inProgressColumn = screen.getByLabelText(/In Progress column, 1 tasks/);
    expect(inProgressColumn).toBeInTheDocument();

    const doneColumn = screen.getByLabelText(/Done column, 2 tasks/);
    expect(doneColumn).toBeInTheDocument();
  });

  it('renders page title', async () => {
    api.get.mockResolvedValue([]);
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('Board')).toBeInTheDocument();
    });
  });

  it('calls api.get with /tasks on mount', async () => {
    api.get.mockResolvedValue([]);
    renderBoard();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/tasks');
    });
  });
});
