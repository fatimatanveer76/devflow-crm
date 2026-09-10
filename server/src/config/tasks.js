/**
 * DevFlow CRM — Task Management Domain Constants & Enums
 */

export const TASK_STATUS = Object.freeze({
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
});

export const ALL_TASK_STATUSES = Object.freeze(Object.values(TASK_STATUS));

export const TASK_PRIORITY = Object.freeze({
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
  URGENT: 'urgent',
});

export const ALL_TASK_PRIORITIES = Object.freeze(Object.values(TASK_PRIORITY));

export const isValidTaskStatus   = (s) => ALL_TASK_STATUSES.includes(s);
export const isValidTaskPriority = (p) => ALL_TASK_PRIORITIES.includes(p);

export default { TASK_STATUS, ALL_TASK_STATUSES, TASK_PRIORITY, ALL_TASK_PRIORITIES, isValidTaskStatus, isValidTaskPriority };
