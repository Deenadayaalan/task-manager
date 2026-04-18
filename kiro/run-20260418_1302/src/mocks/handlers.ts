import { rest } from 'msw';
import { Task, TaskStatus, TaskPriority } from '../types/task';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test Description 1',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
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
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2024-12-25'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    userId: 'user1',
    tags: ['test']
  }
];

export const handlers = [
  // Get all tasks
  rest.get('/api/tasks', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const priority = req.url.searchParams.get('priority');
    
    let filteredTasks = mockTasks;
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    return res(ctx.json(filteredTasks));
  }),

  // Get single task
  rest.get('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const task = mockTasks.find(t => t.id === id);
    
    if (!task) {
      return res(ctx.status(404), ctx.json({ message: 'Task not found' }));
    }
    
    return res(ctx.json(task));
  }),

  // Create task
  rest.post('/api/tasks', async (req, res, ctx) => {
    const newTask = await req.json() as Partial<Task>;
    const task: Task = {
      id: String(mockTasks.length + 1),
      title: newTask.title || '',
      description: newTask.description || '',
      status: newTask.status || TaskStatus.TODO,
      priority: newTask.priority || TaskPriority.MEDIUM,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user1',
      tags: newTask.tags || []
    };
    
    mockTasks.push(task);
    return res(ctx.status(201), ctx.json(task));
  }),

  // Update task
  rest.put('/api/tasks/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const updates = await req.json() as Partial<Task>;
    const taskIndex = mockTasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res(ctx.status(404), ctx.json({ message: 'Task not found' }));
    }
    
    mockTasks[taskIndex] = {
      ...mockTasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    return res(ctx.json(mockTasks[taskIndex]));
  }),

  // Delete task
  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const taskIndex = mockTasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res(ctx.status(404), ctx.json({ message: 'Task not found' }));
    }
    
    mockTasks.splice(taskIndex, 1);
    return res(ctx.status(204));
  }),

  // Auth endpoints
  rest.post('/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json();
    
    if (email === 'test@example.com' && password === 'password') {
      return res(ctx.json({
        user: { id: 'user1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-jwt-token'
      }));
    }
    
    return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
  }),

  rest.post('/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200));
  })
];