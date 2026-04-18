import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockTasks } from '../../test-utils';
import { TaskList } from '../TaskList';

describe('TaskList', () => {
  it('renders task list correctly', async () => {
    render(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  it('filters tasks by status', async () => {
    const user = userEvent.setup();
    render(<TaskList />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    
    // Filter by TODO status
    const todoFilter = screen.getByRole('button', { name: /todo/i });
    await user.click(todoFilter);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
    });
  });

  it('handles task deletion', async () => {
    const user = userEvent.setup();
    render(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    // Mock empty response
    const mockEmptyTasks = jest.fn().mockResolvedValue([]);
    
    render(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    render(<TaskList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock error response
    const mockError = new Error('Failed to fetch tasks');
    
    render(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading tasks/i)).toBeInTheDocument();
    });
  });
});