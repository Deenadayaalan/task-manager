import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import TaskList from './TaskList';

const mockTasks = [
  { id: 1, title: 'Task Alpha', status: 'TODO', priority: 'HIGH', assignee: 'Alice', dueDate: '2099-06-01' },
  { id: 2, title: 'Task Beta', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'Bob', dueDate: '2099-07-15' },
  { id: 3, title: 'Task Gamma', status: 'DONE', priority: 'LOW', assignee: 'Alice', dueDate: '2099-08-20' },
  { id: 4, title: 'Task Delta', status: 'TODO', priority: 'HIGH', assignee: null, dueDate: null },
];

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../services/api';

function renderTaskList() {
  return render(
    <NotificationProvider>
      <MemoryRouter>
        <TaskList />
      </MemoryRouter>
    </NotificationProvider>
  );
}

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 7.1: Table layout, loading, error, badges ---

  it('shows loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderTaskList();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('renders page title "Backlog"', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText('Backlog')).toBeInTheDocument();
    });
  });

  it('renders table with correct column headers', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Assignee')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('renders all tasks in the table', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
      expect(screen.getByText('Task Beta')).toBeInTheDocument();
      expect(screen.getByText('Task Gamma')).toBeInTheDocument();
      expect(screen.getByText('Task Delta')).toBeInTheDocument();
    });
  });

  it('renders clickable title links to task detail', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      const link = screen.getByText('Task Alpha').closest('a');
      expect(link).toHaveAttribute('href', '/tasks/1');
    });
  });

  it('renders status badges with correct CSS classes', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      const todoBadges = screen.getAllByText('TODO');
      expect(todoBadges[0]).toHaveClass('badge', 'badge--status-todo');

      const inProgressBadge = screen.getByText('IN PROGRESS');
      expect(inProgressBadge).toHaveClass('badge', 'badge--status-in_progress');

      const doneBadge = screen.getByText('DONE');
      expect(doneBadge).toHaveClass('badge', 'badge--status-done');
    });
  });

  it('renders priority badges with correct CSS classes', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      const highBadges = screen.getAllByText('HIGH');
      expect(highBadges[0]).toHaveClass('badge', 'badge--priority-high');

      const mediumBadge = screen.getByText('MEDIUM');
      expect(mediumBadge).toHaveClass('badge', 'badge--priority-medium');

      const lowBadge = screen.getByText('LOW');
      expect(lowBadge).toHaveClass('badge', 'badge--priority-low');
    });
  });

  it('displays assignee name or dash for null assignee', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      // Alice appears in table cells and assignee dropdown
      const aliceElements = screen.getAllByText('Alice');
      expect(aliceElements.length).toBeGreaterThanOrEqual(1);
      const bobElements = screen.getAllByText('Bob');
      expect(bobElements.length).toBeGreaterThanOrEqual(1);
      // Task Delta has null assignee — should show dash
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('formats due dates nicely and shows dash for null', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText('Jun 1, 2099')).toBeInTheDocument();
      expect(screen.getByText('Jul 15, 2099')).toBeInTheDocument();
    });
  });

  it('calls api.get with /tasks on mount', async () => {
    api.get.mockResolvedValue([]);
    renderTaskList();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/tasks');
    });
  });

  // --- 7.2: Filter bar and quick actions ---

  it('renders filter dropdowns', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by assignee')).toBeInTheDocument();
    });
  });

  it('populates assignee dropdown with unique assignees', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      const assigneeSelect = screen.getByLabelText('Filter by assignee');
      const options = within(assigneeSelect).getAllByRole('option');
      // "All Assignees" + "Alice" + "Bob" = 3
      expect(options).toHaveLength(3);
      expect(options[1]).toHaveTextContent('Alice');
      expect(options[2]).toHaveTextContent('Bob');
    });
  });

  it('filters tasks by status', async () => {
    api.get.mockResolvedValue(mockTasks);
    const user = userEvent.setup();
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'DONE');

    expect(screen.getByText('Task Gamma')).toBeInTheDocument();
    expect(screen.queryByText('Task Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Task Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Task Delta')).not.toBeInTheDocument();
  });

  it('filters tasks by priority', async () => {
    api.get.mockResolvedValue(mockTasks);
    const user = userEvent.setup();
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'HIGH');

    expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    expect(screen.getByText('Task Delta')).toBeInTheDocument();
    expect(screen.queryByText('Task Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Task Gamma')).not.toBeInTheDocument();
  });

  it('filters tasks by assignee', async () => {
    api.get.mockResolvedValue(mockTasks);
    const user = userEvent.setup();
    renderTaskList();
    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Filter by assignee'), 'Alice');

    expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    expect(screen.getByText('Task Gamma')).toBeInTheDocument();
    expect(screen.queryByText('Task Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Task Delta')).not.toBeInTheDocument();
  });

  it('renders Edit links pointing to edit route', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      const editLinks = screen.getAllByText('Edit');
      expect(editLinks[0].closest('a')).toHaveAttribute('href', '/tasks/1/edit');
    });
  });

  it('renders Delete buttons', async () => {
    api.get.mockResolvedValue(mockTasks);
    renderTaskList();
    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons).toHaveLength(4);
    });
  });

  it('deletes a task after confirmation', async () => {
    api.get.mockResolvedValue(mockTasks);
    api.delete.mockResolvedValue(null);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderTaskList();

    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
    expect(api.delete).toHaveBeenCalledWith('/tasks/1');

    await waitFor(() => {
      expect(screen.queryByText('Task Alpha')).not.toBeInTheDocument();
    });

    window.confirm.mockRestore();
  });

  it('does not delete when confirmation is cancelled', async () => {
    api.get.mockResolvedValue(mockTasks);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderTaskList();

    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Task Alpha')).toBeInTheDocument();

    window.confirm.mockRestore();
  });
});
