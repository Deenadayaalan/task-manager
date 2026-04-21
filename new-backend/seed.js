const db = require('./db');

const seedTasks = [
  {
    title: 'Set up project repository',
    description: 'Initialize Git repo, configure branch protection rules, and set up CI/CD pipeline',
    status: 'DONE',
    priority: 'HIGH',
    assignee: 'Alice',
    dueDaysFromNow: -10,
  },
  {
    title: 'Design database schema',
    description: 'Create ERD diagram and define table relationships for the task management system',
    status: 'DONE',
    priority: 'HIGH',
    assignee: 'Bob',
    dueDaysFromNow: -8,
  },
  {
    title: 'Implement user authentication',
    description: 'Set up JWT-based auth with login, registration, and password reset flows',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: 'Alice',
    dueDaysFromNow: 3,
  },
  {
    title: 'Build REST API endpoints',
    description: 'Create CRUD endpoints for tasks, projects, and user management',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: 'Charlie',
    dueDaysFromNow: 5,
  },
  {
    title: 'Create task board UI',
    description: 'Build a Kanban-style drag and drop board with columns for each status',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignee: 'Diana',
    dueDaysFromNow: 7,
  },
  {
    title: 'Add search and filtering',
    description: 'Implement full-text search and advanced filtering by status, priority, assignee, and date range',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: 'Bob',
    dueDaysFromNow: 10,
  },
  {
    title: 'Write unit tests',
    description: 'Achieve 80% code coverage for service layer and controllers',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: 'Charlie',
    dueDaysFromNow: 12,
  },
  {
    title: 'Set up monitoring and logging',
    description: 'Configure application logging, health checks, and performance monitoring dashboards',
    status: 'TODO',
    priority: 'LOW',
    assignee: 'Alice',
    dueDaysFromNow: 14,
  },
  {
    title: 'Performance optimization',
    description: 'Profile and optimize database queries, add caching layer, and lazy loading',
    status: 'TODO',
    priority: 'LOW',
    assignee: 'Diana',
    dueDaysFromNow: 18,
  },
  {
    title: 'Write API documentation',
    description: 'Create OpenAPI/Swagger docs for all REST endpoints with examples',
    status: 'TODO',
    priority: 'LOW',
    assignee: 'Bob',
    dueDaysFromNow: 20,
  },
];

function seed() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
  if (row.count > 0) {
    console.log('Database already seeded — skipping.');
    return;
  }

  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, assignee, dueDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((tasks) => {
    for (const t of tasks) {
      const due = new Date();
      due.setDate(due.getDate() + t.dueDaysFromNow);
      insert.run(
        t.title,
        t.description,
        t.status,
        t.priority,
        t.assignee,
        due.toISOString(),
        now,
        now
      );
    }
  });

  insertMany(seedTasks);
  console.log(`Seeded ${seedTasks.length} tasks.`);
}

module.exports = seed;
