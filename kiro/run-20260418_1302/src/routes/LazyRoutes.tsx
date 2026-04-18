// src/routes/LazyRoutes.tsx
import { createLazyComponent } from '../components/LazyLoader';

// Lazy load main components
export const LazyTaskList = createLazyComponent(
  () => import('../components/TaskList/TaskList'),
  { fallback: <div>Loading tasks...</div> }
);

export const LazyTaskForm = createLazyComponent(
  () => import('../components/TaskForm/TaskForm'),
  { fallback: <div>Loading form...</div> }
);

export const LazyTaskDetail = createLazyComponent(
  () => import('../components/TaskDetail/TaskDetail'),
  { fallback: <div>Loading task details...</div> }
);

export const LazyDashboard = createLazyComponent(
  () => import('../components/Dashboard/Dashboard'),
  { fallback: <div>Loading dashboard...</div> }
);

export const LazyBoard = createLazyComponent(
  () => import('../components/Board/Board'),
  { fallback: <div>Loading board...</div> }
);

// Analytics components (loaded on demand)
export const LazyAnalytics = createLazyComponent(
  () => import('../components/Analytics/Analytics'),
  { fallback: <div>Loading analytics...</div> }
);

export const LazyReports = createLazyComponent(
  () => import('../components/Reports/Reports'),
  { fallback: <div>Loading reports...</div> }
);