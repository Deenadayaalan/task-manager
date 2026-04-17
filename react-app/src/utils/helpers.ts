/**
 * Get initials from a name string.
 * Returns first letter of each word, max 2 characters, uppercase.
 * Returns '?' if name is null/undefined/empty.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Map task status enum value to display label.
 * TODO → 'To Do', IN_PROGRESS → 'In Progress', DONE → 'Done'
 */
const statusLabels: Record<string, string> = {
  'TODO': 'To Do',
  'IN_PROGRESS': 'In Progress',
  'DONE': 'Done',
};

export function taskStatusLabel(status: string): string {
  return statusLabels[status] || status;
}

/**
 * Format a date string to match AngularJS 'mediumDate' filter.
 * Example: "Apr 17, 2026"
 */
export function formatMediumDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to match AngularJS 'medium' filter.
 * Example: "Apr 17, 2026, 1:30:00 PM"
 */
export function formatMedium(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
