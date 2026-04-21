# TaskFlow Modernisation — Design

## Migration: AngularJS 1.8 + Java 8 Spring Boot → React + Node.js Express

## Architecture Overview

**Frontend:** React 18 SPA with React Router v6, hosted via static files
**Backend:** Node.js + Express REST API (same `/api/tasks` contract)
**Database:** SQLite via better-sqlite3 (replaces H2 in-memory)
**Deployment:** Docker multi-stage build

## Component Architecture

### Frontend (React)

```
App
├── Layout (Sidebar, MainContent)
├── Dashboard (StatCards, TaskSummary)
├── Board (BoardColumn × 3, TaskCard, DragDropContext)
├── TaskList (FilterBar, TaskTable, TaskRow)
├── TaskForm (create + edit mode)
└── TaskDetail (read-only view with actions)
```

### Backend (Express)

```
server.js
├── routes/tasks.js        — REST endpoints (same contract as Spring Boot)
├── services/taskService.js — Business logic (mirrors Java TaskService)
├── models/task.js          — Data model + DB operations
└── seed.js                 — Initial data (mirrors DataSeeder.java)
```

## Component Mapping (Source → Target)

| Original (AngularJS + Java) | Modernised (React + Node.js) | Notes |
|------------------------------|------------------------------|-------|
| `BoardController` | `<Board>` + `<BoardColumn>` + `<TaskCard>` | Add drag-and-drop via @dnd-kit |
| `DashboardController` | `<Dashboard>` + `<StatCard>` | React state, no $scope |
| `TaskListController` | `<TaskList>` + `<FilterBar>` | useState + useEffect |
| `TaskFormController` | `<TaskForm>` | Controlled form with validation |
| `TaskDetailController` | `<TaskDetail>` | useParams for route param |
| `TaskService` (Angular) | `api.js` (fetch wrapper) | fetch() replaces $http |
| `TaskService.java` | `taskService.js` | Same CRUD logic |
| `TaskController.java` | `routes/tasks.js` | Same REST endpoints |
| `Task.java` (JPA entity) | `models/task.js` (SQLite) | Same fields |
| `DataSeeder.java` | `seed.js` | Same 10 seed tasks |

## API Contract (Preserved)

```
GET    /api/tasks              — List all (optional: ?status=, ?priority=, ?assignee=)
GET    /api/tasks/:id          — Get by ID
POST   /api/tasks              — Create
PUT    /api/tasks/:id          — Update
PATCH  /api/tasks/:id/status   — Update status only
DELETE /api/tasks/:id          — Delete
```

## State Management

- Local component state via `useState` (no Redux needed for this app size)
- API calls via custom `useApi` hook or direct fetch wrapper
- Board drag-and-drop state managed by @dnd-kit

## Key Business Rules (Extracted from Java Service)

1. Default status: `TODO`, default priority: `MEDIUM`
2. Status values: `TODO`, `IN_PROGRESS`, `DONE`
3. Priority values: `LOW`, `MEDIUM`, `HIGH`
4. Task not found → 404 response
5. Partial updates supported (null fields skipped)
6. Timestamps: `createdAt` set on create, `updatedAt` on every save
