# TaskFlow Backend API Contract Tests

These tests prove **functional parity** between the legacy Java/Spring Boot backend
and the modernised Node.js/Express backend. The exact same test suite runs against
both backends — if all tests pass on both, the API contract is preserved.

## What's tested

| Category | Tests | Description |
|---|---|---|
| Health | 1 | `GET /api/tasks` returns 200 + array |
| Create | 4 | POST with full payload, field shape, default status/priority |
| Read | 2 | GET by id, 404 for missing task |
| Update | 3 | PUT title/description, priority, 404 for missing |
| Status transitions | 3 | TODO→IN_PROGRESS, IN_PROGRESS→DONE, DONE→TODO |
| Delete | 2 | DELETE + confirm gone, 404 for missing |
| Filters | 4 | List all, filter by status/priority/assignee |
| Full lifecycle | 1 | Create→Read→Update→Status×2→Delete→Confirm 404 |
| **Total** | **20** | |

## Running

```bash
# Install dependencies (once)
npm install

# Against the legacy Java backend (port 8080)
npm run test:old

# Against the new Node.js backend (port 3001)
npm run test:new

# Custom URL
BASE_URL=https://your-deployed-app.example.com npm test
```

## Demo flow

1. Start the Java backend on port 8080
2. Run `npm run test:old` — all 20 tests pass ✅
3. Stop Java, start the Node.js backend on port 3001
4. Run `npm run test:new` — all 20 tests pass ✅
5. Same contract, same results → functional parity proven
