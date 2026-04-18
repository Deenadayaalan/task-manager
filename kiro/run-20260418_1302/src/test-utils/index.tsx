import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { TaskProvider } from '../contexts/TaskContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TaskProvider>
            {children}
          </TaskProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock user for testing
export const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User'
};

// Mock tasks for testing
export const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test Description 1',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user1',
    tags: ['test', 'urgent']
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Test Description 2',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: new Date('2024-12-25'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    userId: 'user1',
    tags: ['test']
  }
];