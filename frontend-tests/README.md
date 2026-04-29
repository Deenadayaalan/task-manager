# TaskFlow Frontend E2E Tests

These tests prove **frontend functional parity** between the legacy AngularJS app
and the modernised React app. The same Playwright test suite runs against both — 
if all tests pass on both, the UI contract is preserved.

## What's tested

| Category | Tests | Description |
|---|---|---|
| App loads & nav | 4 | Brand visible, sidebar links, navigate to Board/Backlog |
| Dashboard | 2 | Stat cards with counts, recent tasks listed |
| Board view | 2 | Three columns visible, task cards displayed |
| Backlog / Task List | 4 | Table with tasks, badges, filter dropdowns, filter works |
| Create task | 2 | Form has all fields, create + verify in list |
| Task detail | 2 | Click opens detail, metadata visible |
| Edit task | 1 | Form pre-filled with existing data |
| Delete task | 1 | Create → delete → confirm gone |
| Full lifecycle | 1 | Create → view → edit → verify → delete → confirm gone |
| **Total** | **19** | |

## Running

```bash
# Install dependencies (once)
npm install
npx playwright install chromium

# Against the legacy AngularJS frontend (port 4200)
npm run test:old

# Against the new React frontend (port 5173)
npm run test:new

# With browser visible
npm run test:headed

# View HTML report
npm run report
```

## Routing compatibility

The tests auto-detect which routing scheme is in use:
- **AngularJS**: hash routing (`#!/board`, `#!/tasks`)
- **React**: path routing (`/board`, `/tasks`)

No test changes needed when switching between apps.

## Demo flow

1. Start the AngularJS frontend on port 4200
2. Run `npm run test:old` — all 19 tests pass ✅
3. Stop AngularJS, start the React frontend on port 5173
4. Run `npm run test:new` — all 19 tests pass ✅
5. Same tests, same results → frontend functional parity proven
