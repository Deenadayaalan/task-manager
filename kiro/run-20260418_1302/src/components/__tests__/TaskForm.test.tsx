import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import { TaskForm } from '../TaskForm';

describe('TaskForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'New Task');
    await user.type(screen.getByLabelText(/description/i), 'Task description');
    await user.selectOptions(screen.getByLabelText(/status/i), 'TODO');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'HIGH');
    await user.type(screen.getByLabelText(/due date/i), '2024-12-31');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task description',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2024-12-31',
        tags: []
      });
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles cancel action', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('pre-fills form when editing existing task', () => {
    const existingTask = {
      id: '1',
      title: 'Existing Task',
      description: 'Existing description',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: new Date('2024-12-25'),
      tags: ['existing']
    };
    
    render(
      <TaskForm 
        task={existingTask} 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MEDIUM')).toBeInTheDocument();
  });

  it('handles tag management', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Add tag
    const tagInput = screen.getByLabelText(/tags/i);
    await user.type(tagInput, 'urgent');
    await user.keyboard('{Enter}');
    
    expect(screen.getByText('urgent')).toBeInTheDocument();
    
    // Remove tag
    const removeTagButton = screen.getByRole('button', { name: /remove urgent/i });
    await user.click(removeTagButton);
    
    expect(screen.queryByText('urgent')).not.toBeInTheDocument();
  });
});