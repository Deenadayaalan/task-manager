import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTaskService } from '../useTaskService';
import { TaskStatus, TaskPriority } from '../../types/task';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTaskService', () => {
  it('fetches tasks successfully', async () => {
    const { result } = renderHook(() => useTaskService(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.tasks.isSuccess).toBe(true);
    });
    
    expect(result.current.tasks.data).toHaveLength(2);
    expect(result.current.tasks.data?.[0].title).toBe('Test Task 1');
  });

  it('creates task successfully', async () => {
    const { result } = renderHook(() => useTaskService(), {
      wrapper: createWrapper(),
    });
    
    const newTask = {
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      tags: ['test']
    };
    
    await waitFor(() => {
      result.current.createTask.mutate(newTask);
    });
    
    await waitFor(() => {
      expect(result.current.createTask.isSuccess).toBe(true);
    });
    
    expect(result.current.createTask.data?.title).toBe('New Task');
  });

  it('updates task successfully', async () => {
    const { result } = renderHook(() => useTaskService(), {
      wrapper: createWrapper(),
    });
    
    const updates = {
      id: '1',
      title: 'Updated Task',
      status: TaskStatus.COMPLETED
    };
    
    await waitFor(() => {
      result.current.updateTask.mutate(updates);
    });
    
    await waitFor(() => {
      expect(result.current.updateTask.isSuccess).toBe(true);
    });
    
    expect(result.current.updateTask.data?.title).toBe('Updated Task');
  });

  it('deletes task successfully', async () => {
    const { result } = renderHook(() => useTaskService(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      result.current.deleteTask.mutate('1');
    });
    
    await waitFor(() => {
      expect(result.current.deleteTask.isSuccess).toBe(true);
    });
  });

  it('handles error states', async () => {
    // Mock network error
    const { result } = renderHook(() => useTaskService(), {
      wrapper: createWrapper(),
    });
    
    // This would trigger an error in real scenario
    await waitFor(() => {
      result.current.createTask.mutate({} as any);
    });
    
    await waitFor(() => {
      expect(result.current.createTask.isError).toBe(true);
    });
  });
});