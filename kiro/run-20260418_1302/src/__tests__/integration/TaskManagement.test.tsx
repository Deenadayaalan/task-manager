import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import { App } from '../../App';

describe('Task Management Integration', () => {
  it('completes full task lifecycle', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText(/task manager/i)).toBeInTheDocument();
    });
    
    // Navigate to tasks page
    await user.click(screen.getByRole('link', { name: /tasks/i }));
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    
    // Create new task
    await user.click(screen.getByRole('button', { name: /add task/i }));
    
    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'Integration Test Task');
    await user.type(screen.getByLabelText(/description/i), 'Created via integration test');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'HIGH');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify task was created
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });
    
    // Edit the task
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[editButtons.length - 1]);
    
    // Update title
    const titleInput = screen.getByDisplayValue('Integration Test Task');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Integration Test Task');
    
    // Submit update
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify task was updated
    await waitFor(() => {
      expect(screen.getByText('Updated Integration Test Task')).toBeInTheDocument();
    });
    
    // Delete the task
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[deleteButtons.length - 1]);
    
    // Confirm deletion
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    
    // Verify task was deleted
    await waitFor(() => {
      expect(screen.queryByText('Updated Integration Test Task')).not.toBeInTheDocument();
    });
  });

  it('handles authentication flow', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Should show login form initially
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Fill login form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    
    // Submit login
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Should redirect to dashboard after login
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
    
    // Should show user menu
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    // Logout
    await user.click(screen.getByRole('button', { name: /logout/i }));
    
    // Should return to login page
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});