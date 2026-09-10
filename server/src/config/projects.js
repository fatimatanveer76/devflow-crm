/**
 * DevFlow CRM — Project Management Domain Constants & Enums
 *
 * Centralized constants for Project statuses, priorities, and currencies.
 * Always import from this file; never hardcode strings across services or controllers.
 */

export const PROJECT_STATUS = Object.freeze({
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const ALL_PROJECT_STATUSES = Object.freeze(Object.values(PROJECT_STATUS));

export const PROJECT_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

export const ALL_PROJECT_PRIORITIES = Object.freeze(Object.values(PROJECT_PRIORITY));

export const isValidProjectStatus = (status) => ALL_PROJECT_STATUSES.includes(status);
export const isValidProjectPriority = (priority) => ALL_PROJECT_PRIORITIES.includes(priority);

export default {
  PROJECT_STATUS,
  ALL_PROJECT_STATUSES,
  PROJECT_PRIORITY,
  ALL_PROJECT_PRIORITIES,
  isValidProjectStatus,
  isValidProjectPriority,
};
