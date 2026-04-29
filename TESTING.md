# TaskFlow — Testing Documentation

This document covers all test suites used to validate the TaskFlow modernisation
from AngularJS 1.8 + Java 8 Spring Boot to React 18 + Node.js Express.

The same test suites run against both the legacy and modernised applications,
proving functional parity across the migration.

## Test Summary

| Layer | Suite | Location | Tests | Legacy App | New App |
|---|---|---|---|---|---|
| Backend API | Contract tests | `backend-tests/` | 20 | ✅ 20/20 | ✅ 20/20 |
| Frontend E2E | Playwright tests | `frontend-tests/` | 19 | ✅ 19/19 | ✅ 19/19 |
| Backend Unit | Vitest + Supertest | `new-backend/tests/` | 17 | — | ✅ 17/17 |
| Frontend Unit | Vitest + RTL | `new-frontend/src/components/` | 63 | — | ✅ 63/63 |
| **Total** | | | **119** | **39/39** | **119/119** |

---

## 1. Backend API Contract Tests (`backend-tests/`)

These tests prove **API functional parity** between the legacy Java/Spring Boot
backend and the new Node.js/Express backend. They are language-agnostic HTTP tests
parameterised by `BASE_URL` — the exact same 20 tests run against both backends.

### How to run

```bash
cd backend-tests
npm install

# Against the legacy Java backend
BASE_URL=https://legacy-app.deenadat.people.aws.dev npm test

# Against the new Node.js backend (local)
npm run test:new

# Against the new app deployed on AWS
BASE_URL=https://d2vy9bb5sjufmg.cloudfront.net npm test
```

### Test cases (20 tests)

| # | Category | Test Case | What it verifies |
|---|---|---|---|
| 1 | Health | GET /api/tasks returns 200 and an array | Connectivity and response shape |
| 2 | Create | Creates a task and returns 201 with the task body | POST with full payload |
| 3 | Create | Returns the correct field shape | All 9 fields: id, title, description, status, priority, assignee, dueDate, createdAt, updatedAt |
| 4 | Create | Defaults status to TODO when omitted | Default status behaviour |
| 5 | Create | Defaults priority to MEDIUM when omitted | Default priority behaviour |
| 6 | Read | Retrieves a task by id | GET /api/tasks/:id |
| 7 | Read | Returns 404 for a non-existent task | Not found handling |
| 8 | Update | Updates title and description | PUT with partial fields |
| 9 | Update | Updates priority | PUT priority change |
| 10 | Update | Returns 404 when updating a non-existent task | Not found on update |
| 11 | Status | Transitions TODO → IN_PROGRESS | PATCH status transition |
| 12 | Status | Transitions IN_PROGRESS → DONE | PATCH status transition |
| 13 | Status | Transitions DONE → TODO (reopen) | Reverse status transition |
| 14 | Delete | Deletes a task and returns 204 | DELETE and confirm gone via GET |
| 15 | Delete | Returns 404 when deleting a non-existent task | Not found on delete |
| 16 | Filter | Lists all tasks | GET /api/tasks returns full array |
| 17 | Filter | Filters by status | ?status=TODO returns only TODO tasks |
| 18 | Filter | Filters by priority | ?priority=HIGH returns only HIGH tasks |
| 19 | Filter | Filters by assignee | ?assignee=Alice returns only Alice's tasks |
| 20 | Lifecycle | Full CRUD + status lifecycle | Create → Read → Update → Status×2 → Delete → Confirm 404 |

### Results: Before (legacy) vs After (new)

#### Legacy app — Java 8 + Spring Boot (`https://legacy-app.deenadat.people.aws.dev`)

```
 ✓ api-contract.test.js (20 tests) 15351ms
   ✓ Health & connectivity > GET /api/tasks returns 200 and an array  791ms
   ✓ Create task > creates a task and returns 201 with the task body  747ms
   ✓ Create task > returns the correct field shape  332ms
   ✓ Create task > defaults status to TODO when omitted  271ms
   ✓ Create task > defaults priority to MEDIUM when omitted  284ms
   ✓ Read task > retrieves a task by id  592ms
   ✓ Read task > returns 404 for a non-existent task  273ms
   ✓ Update task > updates title and description  610ms
   ✓ Update task > updates priority  670ms
   ✓ Update task > returns 404 when updating a non-existent task  261ms
   ✓ Status transitions > transitions TODO → IN_PROGRESS  684ms
   ✓ Status transitions > transitions IN_PROGRESS → DONE  558ms
   ✓ Status transitions > transitions DONE → TODO (reopen)  568ms
   ✓ Delete task > deletes a task and returns 204  783ms
   ✓ Delete task > returns 404 when deleting a non-existent task  260ms
   ✓ List and filter tasks > lists all tasks  280ms
   ✓ List and filter tasks > filters by status  367ms
   ✓ List and filter tasks > filters by priority  282ms
   ✓ List and filter tasks > filters by assignee  269ms
   ✓ Full task lifecycle > completes a full CRUD + status lifecycle  1917ms

 Test Files  1 passed (1)
      Tests  20 passed (20)
   Duration  15.82s
```

#### New app — Node.js + Express (`http://localhost:3001`)

```
 ✓ api-contract.test.js (20 tests) 144ms
   ✓ Health & connectivity > GET /api/tasks returns 200 and an array  24ms
   ✓ Create task > creates a task and returns 201 with the task body  7ms
   ✓ Create task > returns the correct field shape  4ms
   ✓ Create task > defaults status to TODO when omitted  3ms
   ✓ Create task > defaults priority to MEDIUM when omitted  4ms
   ✓ Read task > retrieves a task by id  5ms
   ✓ Read task > returns 404 for a non-existent task  1ms
   ✓ Update task > updates title and description  8ms
   ✓ Update task > updates priority  7ms
   ✓ Update task > returns 404 when updating a non-existent task  2ms
   ✓ Status transitions > transitions TODO → IN_PROGRESS  7ms
   ✓ Status transitions > transitions IN_PROGRESS → DONE  6ms
   ✓ Status transitions > transitions DONE → TODO (reopen)  6ms
   ✓ Delete task > deletes a task and returns 204  6ms
   ✓ Delete task > returns 404 when deleting a non-existent task  2ms
   ✓ List and filter tasks > lists all tasks  2ms
   ✓ List and filter tasks > filters by status  1ms
   ✓ List and filter tasks > filters by priority  2ms
   ✓ List and filter tasks > filters by assignee  1ms
   ✓ Full task lifecycle > completes a full CRUD + status lifecycle  14ms

 Test Files  1 passed (1)
      Tests  20 passed (20)
   Duration  580ms
```

**Verdict: 20/20 on both — API contract preserved. ✅**

---

## 2. Frontend E2E Contract Tests (`frontend-tests/`)

These tests prove **frontend functional parity** between the legacy AngularJS app
and the new React app. They use Playwright to drive a real Chromium browser through
the key user workflows. The suite auto-detects routing scheme (AngularJS `#!/` vs
React `/`) so the same 19 tests work against both frontends without changes.

### How to run

```bash
cd frontend-tests
npm install
npx playwright install chromium

# Against the legacy AngularJS frontend
BASE_URL=https://legacy-app.deenadat.people.aws.dev npm test

# Against the new React frontend (local)
npm run test:new

# With browser visible
npm run test:headed
```

### Test cases (19 tests)

| # | Category | Test Case | What it verifies |
|---|---|---|---|
| 1 | Navigation | App loads and shows the brand/title | "TaskFlow" branding visible |
| 2 | Navigation | Sidebar has Dashboard, Board, Backlog links | Navigation links present |
| 3 | Navigation | Can navigate to Board view | Board columns render |
| 4 | Navigation | Can navigate to Backlog view | Backlog heading renders |
| 5 | Dashboard | Shows stat cards with task counts | Total, To Do, In Progress, Done cards |
| 6 | Dashboard | Shows recent tasks from seed data | Task links visible |
| 7 | Board | Shows three columns: To Do, In Progress, Done | Column headers present |
| 8 | Board | Displays task cards in columns | Cards with task links |
| 9 | Backlog | Shows tasks in a table | Table with data rows |
| 10 | Backlog | Table shows status and priority badges | Badge elements rendered |
| 11 | Backlog | Has filter dropdowns for status and priority | Select elements present |
| 12 | Backlog | Filtering by status works | Filter interaction and validation |
| 13 | Create | Create form has all required fields | Title, Description, Status, Priority, Assignee, Due Date |
| 14 | Create | Can create a new task and see it in the list | Full create flow end-to-end |
| 15 | Detail | Clicking a task opens its detail view | Navigation, title, Edit/Delete buttons |
| 16 | Detail | Detail view shows task metadata | Description, Priority, Status content |
| 17 | Edit | Edit form is pre-filled with existing task data | Title field populated from API |
| 18 | Delete | Can create and then delete a task | Create → Delete → Confirm gone |
| 19 | Lifecycle | Create → view → edit → verify update → delete | Full CRUD lifecycle through UI |

### Results: Before (legacy) vs After (new)

#### Legacy app — AngularJS 1.8 (`https://legacy-app.deenadat.people.aws.dev`)

```
  ✓   1 › App loads and navigation › app loads and shows the brand/title (2.7s)
  ✓   2 › App loads and navigation › sidebar has Dashboard, Board, Backlog links (2.8s)
  ✓   3 › App loads and navigation › can navigate to Board view (2.5s)
  ✓   4 › App loads and navigation › can navigate to Backlog view (2.6s)
  ✓   5 › Dashboard › shows stat cards with task counts (2.6s)
  ✓   6 › Dashboard › shows recent tasks from seed data (2.6s)
  ✓   7 › Board view › shows three columns (2.7s)
  ✓   8 › Board view › displays task cards in columns (2.5s)
  ✓   9 › Backlog › shows tasks in a table (2.5s)
  ✓  10 › Backlog › table shows status and priority badges (2.5s)
  ✓  11 › Backlog › has filter dropdowns (2.4s)
  ✓  12 › Backlog › filtering by status works (3.5s)
  ✓  13 › Create task › create form has all required fields (2.3s)
  ✓  14 › Create task › can create a new task and see it in the list (3.3s)
  ✓  15 › Task detail › clicking a task opens its detail view (2.5s)
  ✓  16 › Task detail › detail view shows task metadata (3.9s)
  ✓  17 › Edit task › edit form is pre-filled (3.8s)
  ✓  18 › Delete task › can create and then delete a task (4.3s)
  ✓  19 › Full UI lifecycle › create → view → edit → verify → delete (5.9s)

  19 passed (1.0m)
```

#### New app — React 18 (`http://localhost:5173`)

```
  ✓   1 › App loads and navigation › app loads and shows the brand/title (768ms)
  ✓   2 › App loads and navigation › sidebar has Dashboard, Board, Backlog links (741ms)
  ✓   3 › App loads and navigation › can navigate to Board view (744ms)
  ✓   4 › App loads and navigation › can navigate to Backlog view (753ms)
  ✓   5 › Dashboard › shows stat cards with task counts (728ms)
  ✓   6 › Dashboard › shows recent tasks from seed data (728ms)
  ✓   7 › Board view › shows three columns (736ms)
  ✓   8 › Board view › displays task cards in columns (729ms)
  ✓   9 › Backlog › shows tasks in a table (721ms)
  ✓  10 › Backlog › table shows status and priority badges (729ms)
  ✓  11 › Backlog › has filter dropdowns (741ms)
  ✓  12 › Backlog › filtering by status works (1.8s)
  ✓  13 › Create task › create form has all required fields (640ms)
  ✓  14 › Create task › can create a new task and see it in the list (2.3s)
  ✓  15 › Task detail › clicking a task opens its detail view (790ms)
  ✓  16 › Task detail › detail view shows task metadata (1.8s)
  ✓  17 › Edit task › edit form is pre-filled (1.8s)
  ✓  18 › Delete task › can create and then delete a task (3.9s)
  ✓  19 › Full UI lifecycle › create → view → edit → verify → delete (5.7s)

  19 passed (29.7s)
```

**Verdict: 19/19 on both — frontend functional parity preserved. ✅**

---

## 3. Unit Tests (New App Only)

The legacy application had no unit tests. The modernised application includes
comprehensive unit test coverage across both backend and frontend.

### 3.1 Backend Unit Tests (`new-backend/tests/`)

These tests validate the Node.js Express backend in isolation using an in-memory
test database. They use Supertest to make HTTP requests directly against the Express
app without starting a server.

#### How to run

```bash
cd new-backend
npm test
```

#### Test cases

##### `api.test.js` — API Endpoint Integration (12 tests)

| # | Test Case | What it verifies |
|---|---|---|
| 1 | GET /api/tasks returns 200 with array of task objects with all 9 fields | List endpoint returns correct shape |
| 2 | GET /api/tasks?status=TODO returns only tasks with status TODO | Status filter works |
| 3 | GET /api/tasks?priority=HIGH returns only tasks with priority HIGH | Priority filter works |
| 4 | GET /api/tasks?assignee=Alice returns only tasks assigned to Alice | Assignee filter works |
| 5 | GET /api/tasks/:id returns 200 with a single task object with all 9 fields | Single task retrieval |
| 6 | GET /api/tasks/999 returns 404 with correct error message | Not found handling |
| 7 | POST /api/tasks creates a task and returns 201 with all 9 fields | Task creation with defaults |
| 8 | POST /api/tasks without title returns 400 | Validation enforcement |
| 9 | PUT /api/tasks/:id updates a task and returns 200 with updated task | Task update |
| 10 | PATCH /api/tasks/:id/status updates status and returns 200 | Status transition |
| 11 | DELETE /api/tasks/:id returns 204 No Content | Task deletion |
| 12 | DELETE /api/tasks/999 returns 404 | Delete non-existent task |

##### `seed.test.js` — Seed Data Validation (5 tests)

| # | Test Case | What it verifies |
|---|---|---|
| 1 | Seed data has exactly 10 tasks | Matches original DataSeeder.java count |
| 2 | Seed data has correct status distribution: 2 DONE, 3 IN_PROGRESS, 5 TODO | Status distribution matches Java version |
| 3 | Seed task titles match the original DataSeeder.java | All 10 titles are identical |
| 4 | Status update flow: PATCH a task from TODO → IN_PROGRESS → DONE | Full status lifecycle via API |
| 5 | Status change persists after PATCH (GET returns updated status) | Persistence verification |

#### Results

```
 ✓ tests/seed.test.js (5 tests) 39ms
 ✓ tests/api.test.js (12 tests) 68ms

 Test Files  2 passed (2)
      Tests  17 passed (17)
   Duration  786ms
```

### 3.2 Frontend Unit Tests (`new-frontend/src/components/`)

These tests validate individual React components in isolation using Vitest with
jsdom, React Testing Library, and mocked API calls. They cover rendering, user
interactions, state management, and error handling.

#### How to run

```bash
cd new-frontend
npm test
```

#### Test cases

##### `Board.test.jsx` — Kanban Board (6 tests)

| # | Test Case | What it verifies |
|---|---|---|
| 1 | Shows loading state initially | Loading indicator renders |
| 2 | Shows error state on API failure | Error message displayed |
| 3 | Renders three columns with correct titles | To Do, In Progress, Done columns |
| 4 | Groups tasks into correct columns | Tasks sorted by status |
| 5 | Renders page title | "Board" heading present |
| 6 | Calls api.get with /tasks on mount | Correct API call on load |

##### `TaskCard.test.jsx` — Task Card Component (9 tests)

| # | Test Case | What it verifies |
|---|---|---|
| 1 | Renders task title as a link | Title links to /tasks/:id |
| 2 | Shows priority badge with correct class | CSS class matches priority |
| 3 | Shows assignee initials for single name | "Alice" → "A" |
| 4 | Shows assignee initials for full name | "Bob Smith" → "BS" |
| 5 | Shows formatted due date | Date formatting (e.g. "Dec 31") |
| 6 | Shows overdue indicator for past due dates on non-DONE tasks | Red styling for overdue |
| 7 | Does not show overdue for DONE tasks | No overdue on completed tasks |
| 8 | Hides assignee avatar when no assignee | Null assignee handled |
| 9 | Has aria-label with task info | Accessibility attribute |

##### `TaskList.test.jsx` — Backlog View (20 tests)

| # | Test Case | What it verifies |
|---|---|---|
| 1 | Shows loading state initially | Loading indicator |
| 2 | Shows error state on API failure | Error message |
| 3 | Renders page title "Backlog" | Heading present |
| 4 | Renders table with correct column headers | Title, Status, Priority, Assignee, Due Date, Actions |
| 5 | Renders all tasks in the table | All mock tasks visible |
| 6 | Renders clickable title links to task detail | Links to /tasks/:id |
| 7 | Renders status badges with correct CSS classes | badge--status-todo, etc. |
| 8 | Renders priority badges with correct CSS classes | badge--priority-high, etc. |
| 9 | Displays assignee name or dash for null assignee | Null handling |
| 10 | Formats due dates nicely and shows dash for null | Date formatting |
| 11 | Calls api.get with /tasks on mount | Correct API call |
| 12 | Renders filter dropdowns | Status, priority, assignee selects |
| 13 | Populates assignee dropdown with unique assignees | Dynamic options |
| 14 | Filters tasks by status | Status filter interaction |
| 15 | Filters tasks by priority | Priority filter interaction |
| 16 | Filters tasks by assignee | Assignee filter interaction |
| 17 | Renders Edit links pointing to edit route | Edit links correct |
| 18 | Renders Delete buttons | Delete buttons present |
| 19 | Deletes a task after confirmation | Delete + confirm flow |
| 20 | Does not delete when confirmation is cancelled | Cancel preserves task |

##### `TaskForm.test.jsx` — Create/Edit Form (13 tests)

| # | Test Case | What it verifies |
|---|---|---|
| 1 | Renders create form with correct heading | "Create Task" heading |
| 2 | Renders all form fields | Title, Description, Status, Priority, Assignee, Due Date |
| 3 | Has correct default values for status and priority | TODO + MEDIUM defaults |
| 4 | Submits form and navigates to /tasks on success | POST + navigation |
| 5 | Renders edit form with correct heading | "Edit Task" heading |
| 6 | Pre-fills form with existing task data | All fields populated |
| 7 | Submits updated form via PUT and navigates to task detail | PUT + navigation |
| 8 | Shows error when task fails to load | Error handling in edit mode |
| 9 | Shows error when title is empty on submit | Client-side validation |
| 10 | Clears title error when user types | Error clearing |
| 11 | Shows API error message on submission failure | Server error display |
| 12 | Disables submit button while submitting | Prevents double submit |
| 13 | Renders a cancel button | Cancel button present |

##### `TaskDetail.test.jsx` — Task Detail View (15 tests)

| # | Test Case | What it verifies |
|---|---|---|
| 1 | Shows loading message while fetching | Loading state |
| 2 | Shows error message when fetch fails | Error handling |
| 3 | Displays task title as heading | Title rendering |
| 4 | Displays status and priority badges | Badge rendering |
| 5 | Displays description | Description text |
| 6 | Displays assignee | Assignee name |
| 7 | Shows "No description" when description is empty | Empty state |
| 8 | Shows dash for missing assignee | Null handling |
| 9 | Fetches task by ID from route params | Correct API call |
| 10 | Renders Edit link that navigates to edit page | Edit link href |
| 11 | Renders Delete button | Delete button present |
| 12 | Deletes task and navigates to /tasks on confirm | Delete + confirm + navigate |
| 13 | Does not delete when confirm is cancelled | Cancel preserves task |
| 14 | Renders Change Status dropdown with current value | Status select pre-filled |
| 15 | Changes status via PATCH and updates display | Status change flow |

#### Results

```
 ✓ src/components/TaskCard.test.jsx  (9 tests)
 ✓ src/components/Board.test.jsx     (6 tests)
 ✓ src/components/TaskForm.test.jsx  (13 tests) 479ms
 ✓ src/components/TaskDetail.test.jsx (15 tests)
 ✓ src/components/TaskList.test.jsx  (20 tests) 391ms

 Test Files  5 passed (5)
      Tests  63 passed (63)
   Duration  2.43s
```

---

## Before & After Summary

### Backend: Java Spring Boot → Node.js Express

| Metric | Legacy (Java) | New (Node.js) |
|---|---|---|
| API contract tests | ✅ 20/20 | ✅ 20/20 |
| Unit tests | None | ✅ 17/17 |
| Test execution time (API) | 15.4s | 144ms |
| API response shape | 9 fields | 9 fields (identical) |
| Status codes | 200, 201, 204, 400, 404 | 200, 201, 204, 400, 404 (identical) |

### Frontend: AngularJS 1.8 → React 18

| Metric | Legacy (AngularJS) | New (React) |
|---|---|---|
| E2E tests | ✅ 19/19 | ✅ 19/19 |
| Unit tests | None | ✅ 63/63 |
| E2E execution time | 1.0m | 29.7s |
| Views tested | Dashboard, Board, Backlog, Create, Detail, Edit | Same 6 views |
| Workflows tested | Nav, CRUD, filter, lifecycle | Same workflows |

### Total test coverage

```
Backend API contract tests:    20 ✅  (runs on both old and new)
Frontend E2E tests:            19 ✅  (runs on both old and new)
Backend unit tests:            17 ✅  (new app only)
Frontend unit tests:           63 ✅  (new app only)
──────────────────────────────────
Total:                        119 ✅
Parity tests (old + new):     39 ✅
```
