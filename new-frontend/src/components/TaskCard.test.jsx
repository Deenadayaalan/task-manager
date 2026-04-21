import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import TaskCard from './TaskCard';

function renderCard(task) {
  return render(
    <MemoryRouter>
      <DndContext>
        <TaskCard task={task} />
      </DndContext>
    </MemoryRouter>
  );
}

const baseTask = {
  id: 1,
  title: 'Test Task',
  status: 'TODO',
  priority: 'HIGH',
  assignee: 'Alice',
  dueDate: '2099-12-31',
};

describe('TaskCard', () => {
  it('renders task title as a link', () => {
    renderCard(baseTask);
    const link = screen.getByText('Test Task');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/tasks/1');
  });

  it('shows priority badge with correct class', () => {
    renderCard(baseTask);
    const badge = screen.getByText('HIGH');
    expect(badge).toHaveClass('badge--priority-high');
  });

  it('shows assignee initials for single name', () => {
    renderCard(baseTask);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows assignee initials for full name', () => {
    renderCard({ ...baseTask, assignee: 'Bob Smith' });
    expect(screen.getByText('BS')).toBeInTheDocument();
  });

  it('shows formatted due date', () => {
    renderCard(baseTask);
    expect(screen.getByText('Dec 31')).toBeInTheDocument();
  });

  it('shows overdue indicator for past due dates on non-DONE tasks', () => {
    renderCard({ ...baseTask, dueDate: '2020-01-01' });
    const dateEl = screen.getByText(/Jan 1/);
    expect(dateEl).toHaveClass('task-card__date--overdue');
  });

  it('does not show overdue for DONE tasks', () => {
    renderCard({ ...baseTask, status: 'DONE', dueDate: '2020-01-01' });
    const dateEl = screen.getByText(/Jan 1/);
    expect(dateEl).not.toHaveClass('task-card__date--overdue');
  });

  it('hides assignee avatar when no assignee', () => {
    renderCard({ ...baseTask, assignee: null });
    expect(screen.queryByTitle('Alice')).not.toBeInTheDocument();
  });

  it('has aria-label with task info', () => {
    renderCard(baseTask);
    const card = screen.getByLabelText(/Task: Test Task/);
    expect(card).toBeInTheDocument();
  });
});
