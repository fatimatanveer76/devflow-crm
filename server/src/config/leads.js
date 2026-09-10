/**
 * DevFlow CRM — Lead Domain Constants & Enums
 *
 * Centralized constants for Lead entity statuses, priorities, and sources.
 * Always import from this file; never hardcode strings across services or controllers.
 */

export const LEAD_STATUS = Object.freeze({
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFYING: 'qualifying',
  QUALIFIED: 'qualified',
  UNQUALIFIED: 'unqualified',
  CONVERTED: 'converted',
});

export const ALL_LEAD_STATUSES = Object.freeze(Object.values(LEAD_STATUS));

export const LEAD_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

export const ALL_LEAD_PRIORITIES = Object.freeze(Object.values(LEAD_PRIORITY));

export const LEAD_SOURCE = Object.freeze({
  WEBSITE: 'website',
  REFERRAL: 'referral',
  COLD_OUTREACH: 'cold_outreach',
  SOCIAL_MEDIA: 'social_media',
  EVENT: 'event',
  OTHER: 'other',
});

export const ALL_LEAD_SOURCES = Object.freeze(Object.values(LEAD_SOURCE));

export const isValidLeadStatus = (status) => ALL_LEAD_STATUSES.includes(status);
export const isValidLeadPriority = (priority) => ALL_LEAD_PRIORITIES.includes(priority);
export const isValidLeadSource = (source) => ALL_LEAD_SOURCES.includes(source);

export default {
  LEAD_STATUS,
  ALL_LEAD_STATUSES,
  LEAD_PRIORITY,
  ALL_LEAD_PRIORITIES,
  LEAD_SOURCE,
  ALL_LEAD_SOURCES,
  isValidLeadStatus,
  isValidLeadPriority,
  isValidLeadSource,
};
