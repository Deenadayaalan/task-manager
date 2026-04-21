# TaskFlow Modernisation — Requirements

## Functional Requirements

### FR-1: Task Management Core Features
- Create tasks with title, description, priority, assignee, and due date
- Update task details and status
- Delete tasks with confirmation
- View task details in dedicated view
- Support task status transitions: TODO → IN_PROGRESS → DONE
- Filter tasks by status, priority, and assignee
- Sort tasks by creation date, due date, and priority

### FR-2: Dashboard and Analytics
- Display task count by status (TODO, In Progress, Done)
- Show overdue tasks with visual indicators
- Display recent task activity
- Provide task completion trends
- Show assignee workload distribution

### FR-3: Board Management (Kanban View)
- Display tasks in columns by status
- Support drag-and-drop task movement between columns
- Update task status automatically when moved
- Maintain board state across sessions
- Visual task cards with priority indicators and assignee avatars

### FR-4: Task List (Backlog View)
- Tabular list of all tasks with sorting
- Inline status and priority badges
- Quick actions (edit, delete, change status)
- Filtering by status, priority, assignee

### FR-5: Task Form
- Create and edit tasks via form
- Field validation (title required, date format)
- Priority and status dropdowns
- Assignee selection

## Non-Functional Requirements

### Performance
- Page Load Time: < 2 seconds
- API Response Time: < 500ms for 95th percentile
- Bundle Size: < 1MB gzipped

### Security
- CORS configuration
- Input validation on all endpoints
- XSS protection via React's default escaping

### Accessibility
- Semantic HTML and ARIA labels
- Keyboard navigation for drag-and-drop
- Screen reader support for status changes
