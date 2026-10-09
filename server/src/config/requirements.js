/**
 * DevFlow CRM — Requirement Vault Domain Constants & Enums
 *
 * Centralized constants for Requirement statuses, priorities, and types.
 * Always import from this file; never hardcode strings across services or controllers.
 */

/**
 * Requirement status lifecycle
 * draft → under_review → approved | rejected → archived
 */
export const REQUIREMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  UNDER_REVIEW: 'under_review', // alias for in_review
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
});

export const ALL_REQUIREMENT_STATUSES = Object.freeze(Object.values(REQUIREMENT_STATUS));

/**
 * Requirement status transitions map
 */
export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [REQUIREMENT_STATUS.DRAFT]: [
    REQUIREMENT_STATUS.IN_REVIEW,
    REQUIREMENT_STATUS.UNDER_REVIEW,
    REQUIREMENT_STATUS.ARCHIVED,
  ],
  [REQUIREMENT_STATUS.IN_REVIEW]: [
    REQUIREMENT_STATUS.APPROVED,
    REQUIREMENT_STATUS.REJECTED,
    REQUIREMENT_STATUS.DRAFT,
    REQUIREMENT_STATUS.ARCHIVED,
  ],
  [REQUIREMENT_STATUS.UNDER_REVIEW]: [
    REQUIREMENT_STATUS.APPROVED,
    REQUIREMENT_STATUS.REJECTED,
    REQUIREMENT_STATUS.DRAFT,
    REQUIREMENT_STATUS.ARCHIVED,
  ],
  [REQUIREMENT_STATUS.APPROVED]: [
    REQUIREMENT_STATUS.PUBLISHED,
    REQUIREMENT_STATUS.DRAFT,
    REQUIREMENT_STATUS.ARCHIVED,
  ],
  [REQUIREMENT_STATUS.PUBLISHED]: [
    REQUIREMENT_STATUS.DRAFT,
    REQUIREMENT_STATUS.ARCHIVED,
  ],
  [REQUIREMENT_STATUS.REJECTED]: [
    REQUIREMENT_STATUS.DRAFT,
    REQUIREMENT_STATUS.IN_REVIEW,
    REQUIREMENT_STATUS.UNDER_REVIEW,
    REQUIREMENT_STATUS.ARCHIVED,
  ],
  [REQUIREMENT_STATUS.ARCHIVED]: [
    REQUIREMENT_STATUS.DRAFT,
  ],
});

/**
 * Requirement priority levels
 */
export const REQUIREMENT_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

export const ALL_REQUIREMENT_PRIORITIES = Object.freeze(Object.values(REQUIREMENT_PRIORITY));

/**
 * Requirement type categories
 */
export const REQUIREMENT_TYPE = Object.freeze({
  FUNCTIONAL: 'functional',
  NON_FUNCTIONAL: 'non_functional',
  TECHNICAL: 'technical',
  BUSINESS: 'business',
  UI_UX: 'ui_ux',
  SECURITY: 'security',
  INTEGRATION: 'integration',
});

export const ALL_REQUIREMENT_TYPES = Object.freeze(Object.values(REQUIREMENT_TYPE));

export const isValidRequirementStatus = (s) => ALL_REQUIREMENT_STATUSES.includes(s);
export const isValidRequirementPriority = (p) => ALL_REQUIREMENT_PRIORITIES.includes(p);
export const isValidRequirementType = (t) => ALL_REQUIREMENT_TYPES.includes(t);

export default {
  REQUIREMENT_STATUS,
  ALL_REQUIREMENT_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  REQUIREMENT_PRIORITY,
  ALL_REQUIREMENT_PRIORITIES,
  REQUIREMENT_TYPE,
  ALL_REQUIREMENT_TYPES,
  isValidRequirementStatus,
  isValidRequirementPriority,
  isValidRequirementType,
};

