import './commands';

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch;
  win.fetch = function (...args) {
    return originalFetch.apply(this, args);
  };
});

// Custom command to login
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('not.include', '/login');
});

// Custom command to create task
Cypress.Commands.add('createTask', (task) => {
  cy.get('[data-testid="add-task-button"]').click();
  cy.get('[data-testid="task-title-input"]').type(task.title);
  if (task.description) {
    cy.get('[data-testid="task-description-input"]').type(task.description);
  }
  if (task.priority) {
    cy.get('[data-testid="task-priority-select"]').select(task.priority);
  }
  cy.get('[data-testid="save-task-button"]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      createTask(task: { title: string; description?: string; priority?: string }): Chainable<void>;
    }
  }
}