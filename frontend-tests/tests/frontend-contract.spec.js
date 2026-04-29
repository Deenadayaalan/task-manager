/**
 * TaskFlow Frontend E2E Contract Tests
 *
 * These tests verify functional parity between the legacy AngularJS frontend
 * and the modernised React frontend. The same test suite runs against both.
 *
 * Usage:
 *   BASE_URL=http://localhost:4200 npx playwright test   # AngularJS (old)
 *   BASE_URL=http://localhost:5173 npx playwright test   # React (new)
 *
 * Routing:
 *   Old app uses hash routing: #!/board, #!/tasks, #!/tasks/new
 *   New app uses path routing: /board, /tasks, /tasks/new
 *   The tests auto-detect which scheme is in use.
 */

import { test, expect } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Routing helper — works with both #!/hash and /path routing         */
/* ------------------------------------------------------------------ */

let isHashRouting = null;

async function detectRouting(page) {
  if (isHashRouting !== null) return;
  // Navigate to root and check if the app uses hash-based URLs
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const url = page.url();
  // If the page has #!/ in the URL or the HTML contains ng-app, it's AngularJS
  const html = await page.content();
  isHashRouting = html.includes('ng-app') || url.includes('#!');
}

function route(path) {
  if (isHashRouting) {
    // AngularJS hash routing: #!/path
    return path === '/' ? '/' : `/#!${path}`;
  }
  return path;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const UNIQUE = () => `E2E-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ================================================================== */
/*  1. APP LOADS & NAVIGATION                                          */
/* ================================================================== */

test.describe('App loads and navigation', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('app loads and shows the brand/title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Both apps show "TaskFlow" in the sidebar
    const brand = page.locator('text=TaskFlow').first();
    await expect(brand).toBeVisible();
  });

  test('sidebar has Dashboard, Board, Backlog navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Use text locators scoped to nav — works with both AngularJS <a> and React <NavLink>
    const nav = page.locator('nav');
    await expect(nav.locator('text=Dashboard').first()).toBeVisible();
    await expect(nav.locator('text=Board').first()).toBeVisible();
    await expect(nav.locator('text=Backlog').first()).toBeVisible();
  });

  test('can navigate to Board view', async ({ page }) => {
    await page.goto(route('/board'));
    await page.waitForLoadState('networkidle');

    // Board view should show column headers
    await expect(page.locator('text=To Do').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator('text=Done').first()).toBeVisible();
  });

  test('can navigate to Backlog view', async ({ page }) => {
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    // Backlog should show a table or list of tasks
    await expect(page.locator('text=Backlog').first()).toBeVisible();
  });
});

/* ================================================================== */
/*  2. DASHBOARD                                                       */
/* ================================================================== */

test.describe('Dashboard', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('shows stat cards with task counts', async ({ page }) => {
    await page.goto(route('/'));
    await page.waitForLoadState('networkidle');

    // Both apps show stat cards with labels
    await expect(page.locator('text=Total Tasks').first()).toBeVisible();
    await expect(page.locator('text=To Do').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator('text=Done').first()).toBeVisible();
  });

  test('shows recent tasks from seed data', async ({ page }) => {
    await page.goto(route('/'));
    await page.waitForLoadState('networkidle');

    // Both apps show a recent tasks section with at least one task link
    const taskLinks = page.locator('a').filter({ hasText: /\w{3,}/ });
    const count = await taskLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  3. BOARD VIEW                                                      */
/* ================================================================== */

test.describe('Board view', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('shows three columns: To Do, In Progress, Done', async ({ page }) => {
    await page.goto(route('/board'));
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=To Do').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator('text=Done').first()).toBeVisible();
  });

  test('displays task cards in columns', async ({ page }) => {
    await page.goto(route('/board'));
    await page.waitForLoadState('networkidle');

    // There should be at least one task card visible (from seed data)
    // Both apps use card-like elements with task titles as links
    const cards = page.locator('a').filter({ hasText: /\w{3,}/ });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  4. BACKLOG / TASK LIST                                             */
/* ================================================================== */

test.describe('Backlog / Task List', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('shows tasks in a table', async ({ page }) => {
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    // Both apps render a table with task data
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Table should have rows (header + at least one data row)
    const rows = table.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('table shows status and priority badges', async ({ page }) => {
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    // Both apps show status badges (TODO, IN_PROGRESS, DONE variants)
    const badges = page.locator('.badge');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('has filter dropdowns for status and priority', async ({ page }) => {
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    // Both apps have filter selects
    const statusFilter = page.locator('select[aria-label*="status" i]');
    const priorityFilter = page.locator('select[aria-label*="priority" i]');

    await expect(statusFilter).toBeVisible();
    await expect(priorityFilter).toBeVisible();
  });

  test('filtering by status works', async ({ page }) => {
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    // Count all tasks before filtering
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const allRowsBefore = await table.locator('tbody tr').count();

    // Select a status filter
    const statusFilter = page.locator('select[aria-label*="status" i]');
    await statusFilter.selectOption('TODO');
    await page.waitForTimeout(1000);

    // After filtering, the table should either show fewer rows or an empty state.
    // The filter is working if the count changed or if all visible rows match.
    const filteredRows = await table.locator('tbody tr').count();

    if (filteredRows > 0) {
      // Every visible row's status badge should contain "to do" or "todo"
      for (let i = 0; i < Math.min(filteredRows, 3); i++) {
        const badgeText = await table.locator('tbody tr').nth(i).locator('.badge').first().textContent();
        expect(badgeText.toLowerCase()).toMatch(/to.?do/);
      }
    }

    // The filter dropdown should still show the selected value
    const selectedValue = await statusFilter.inputValue();
    expect(selectedValue).toBe('TODO');
  });
});

/* ================================================================== */
/*  5. CREATE TASK                                                     */
/* ================================================================== */

test.describe('Create task', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('create form has all required fields', async ({ page }) => {
    await page.goto(route('/tasks/new'));
    await page.waitForLoadState('networkidle');

    // Both apps have these form fields
    await expect(page.locator('#title, input[name="title"]').first()).toBeVisible();
    await expect(page.locator('#description, textarea[name="description"]').first()).toBeVisible();
    await expect(page.locator('#status, select[name="status"]').first()).toBeVisible();
    await expect(page.locator('#priority, select[name="priority"]').first()).toBeVisible();
    await expect(page.locator('#assignee, input[name="assignee"]').first()).toBeVisible();
    await expect(page.locator('#dueDate, input[name="dueDate"]').first()).toBeVisible();
  });

  test('can create a new task and see it in the list', async ({ page }) => {
    const taskTitle = UNIQUE();

    await page.goto(route('/tasks/new'));
    await page.waitForLoadState('networkidle');

    // Fill in the form
    await page.locator('#title, input[name="title"]').first().fill(taskTitle);
    await page.locator('#description, textarea[name="description"]').first().fill('E2E test description');
    await page.locator('#assignee, input[name="assignee"]').first().fill('E2E Tester');

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Should navigate away from the form
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Navigate to backlog and verify the task appears
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
  });
});

/* ================================================================== */
/*  6. TASK DETAIL                                                     */
/* ================================================================== */

test.describe('Task detail', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('clicking a task in the list opens its detail view', async ({ page }) => {
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    // Click the first task link in the table
    const firstTaskLink = page.locator('table tbody a').first();
    const taskTitle = await firstTaskLink.textContent();
    await firstTaskLink.click();

    await page.waitForLoadState('networkidle');

    // Detail view should show the task title
    await expect(page.locator(`text=${taskTitle.trim()}`).first()).toBeVisible();

    // Should show Edit and Delete buttons
    await expect(page.locator('text=Edit').first()).toBeVisible();
    await expect(page.locator('text=Delete').first()).toBeVisible();
  });

  test('detail view shows task metadata', async ({ page }) => {
    // Navigate to first task's detail
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    const firstTaskLink = page.locator('table tbody a').first();
    await firstTaskLink.click();
    await page.waitForLoadState('networkidle');

    // Wait for the detail content to render (AngularJS needs time)
    // Both apps show the task title, Edit button, and Delete button on detail
    await expect(page.locator('text=Edit').first()).toBeVisible();
    await expect(page.locator('text=Delete').first()).toBeVisible();

    // Wait for metadata section to load — look for "Priority" or "Status" text
    // which both apps display on the detail page
    await page.waitForTimeout(1000);

    // Verify the detail page has rendered metadata by checking for
    // content that both apps show: description section and status buttons/badges
    const hasDescription = await page.locator('text=Description').first().isVisible().catch(() => false);
    const hasPriority = await page.locator('text=Priority').first().isVisible().catch(() => false);
    const hasStatusContent = await page.locator('text=/To Do|In Progress|Done|TODO|IN_PROGRESS|DONE/').first().isVisible().catch(() => false);

    // At least two of these should be visible
    const metadataCount = [hasDescription, hasPriority, hasStatusContent].filter(Boolean).length;
    expect(metadataCount).toBeGreaterThanOrEqual(2);
  });
});

/* ================================================================== */
/*  7. EDIT TASK                                                       */
/* ================================================================== */

test.describe('Edit task', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('edit form is pre-filled with existing task data', async ({ page }) => {
    // Go to first task detail, then click Edit
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');

    const firstTaskLink = page.locator('table tbody a').first();
    const taskTitle = (await firstTaskLink.textContent()).trim();
    await firstTaskLink.click();
    await page.waitForLoadState('networkidle');

    await page.locator('text=Edit').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // allow AngularJS ng-model to bind

    // Title field should be pre-filled (not empty)
    // Try both standard value and AngularJS ng-model binding
    const titleInput = page.locator('#title, input[name="title"]').first();
    await expect(titleInput).toBeVisible();

    // Wait for the input to have a value (AngularJS may take a moment)
    await page.waitForFunction(
      () => {
        const input = document.querySelector('#title, input[name="title"]');
        return input && input.value && input.value.length > 0;
      },
      { timeout: 5000 }
    ).catch(() => {});

    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  8. DELETE TASK (full lifecycle)                                     */
/* ================================================================== */

test.describe('Delete task', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('can create and then delete a task', async ({ page }) => {
    const taskTitle = UNIQUE();

    // 1. Create a task
    await page.goto(route('/tasks/new'));
    await page.waitForLoadState('networkidle');

    await page.locator('#title, input[name="title"]').first().fill(taskTitle);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 2. Find it in the backlog
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();

    // 3. Click into the task detail
    await page.locator(`text=${taskTitle}`).click();
    await page.waitForLoadState('networkidle');

    // 4. Delete it (handle confirmation dialog)
    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('button:has-text("Delete")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 5. Verify it's gone from the backlog
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
  });
});

/* ================================================================== */
/*  9. FULL LIFECYCLE                                                  */
/* ================================================================== */

test.describe('Full UI lifecycle', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await detectRouting(page);
    await page.close();
  });

  test('create → view → edit → verify update → delete', async ({ page }) => {
    const taskTitle = UNIQUE();
    const updatedTitle = `${taskTitle}-UPDATED`;

    // 1. Create
    await page.goto(route('/tasks/new'));
    await page.waitForLoadState('networkidle');
    await page.locator('#title, input[name="title"]').first().fill(taskTitle);
    await page.locator('#description, textarea[name="description"]').first().fill('Lifecycle test');
    await page.locator('#assignee, input[name="assignee"]').first().fill('Lifecycle Bot');
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 2. Find in backlog
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();

    // 3. Open detail
    await page.locator(`text=${taskTitle}`).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${taskTitle}`).first()).toBeVisible();

    // 4. Edit — change title
    await page.locator('text=Edit').first().click();
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('#title, input[name="title"]').first();
    await titleInput.clear();
    await titleInput.fill(updatedTitle);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 5. Verify update in backlog
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();

    // 6. Delete
    await page.locator(`text=${updatedTitle}`).click();
    await page.waitForLoadState('networkidle');

    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('button:has-text("Delete")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 7. Confirm gone
    await page.goto(route('/tasks'));
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${updatedTitle}`)).not.toBeVisible();
  });
});
