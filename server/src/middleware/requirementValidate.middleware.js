import {
  ALL_REQUIREMENT_STATUSES,
  ALL_REQUIREMENT_PRIORITIES,
  ALL_REQUIREMENT_TYPES,
  isValidRequirementStatus,
  isValidRequirementPriority,
  isValidRequirementType,
} from '../config/requirements.js';
import { isValidUUID } from './leadValidate.middleware.js';

/**
 * Validates requirement creation payload
 */
export const validateCreateRequirement = (req, res, next) => {
  const { title, description, type, priority, project_id, deal_id, tags } = req.body || {};
  const errors = [];

  // Title (required)
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Requirement title is required.' });
  } else if (title.trim().length > 300) {
    errors.push({ field: 'title', message: 'Requirement title cannot exceed 300 characters.' });
  }

  // Type
  if (type !== undefined && type !== null && !isValidRequirementType(type)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${ALL_REQUIREMENT_TYPES.join(', ')}.`,
    });
  }

  // Priority
  if (priority !== undefined && priority !== null && !isValidRequirementPriority(priority)) {
    errors.push({
      field: 'priority',
      message: `Priority must be one of: ${ALL_REQUIREMENT_PRIORITIES.join(', ')}.`,
    });
  }

  // Foreign keys
  if (project_id !== undefined && project_id !== null && project_id !== '') {
    if (!isValidUUID(project_id)) {
      errors.push({ field: 'project_id', message: 'Project ID must be a valid UUID.' });
    }
  }

  if (deal_id !== undefined && deal_id !== null && deal_id !== '') {
    if (!isValidUUID(deal_id)) {
      errors.push({ field: 'deal_id', message: 'Deal ID must be a valid UUID.' });
    }
  }

  // Tags
  if (tags !== undefined && tags !== null && !Array.isArray(tags)) {
    errors.push({ field: 'tags', message: 'Tags must be an array of strings.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  next();
};

/**
 * Validates requirement update payload
 */
export const validateUpdateRequirement = (req, res, next) => {
  const { title, type, priority, tags, change_summary } = req.body || {};
  const errors = [];

  // Title (optional on update)
  if (title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Requirement title cannot be empty.' });
    } else if (title.trim().length > 300) {
      errors.push({ field: 'title', message: 'Requirement title cannot exceed 300 characters.' });
    }
  }

  // Type
  if (type !== undefined && type !== null && !isValidRequirementType(type)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${ALL_REQUIREMENT_TYPES.join(', ')}.`,
    });
  }

  // Priority
  if (priority !== undefined && priority !== null && !isValidRequirementPriority(priority)) {
    errors.push({
      field: 'priority',
      message: `Priority must be one of: ${ALL_REQUIREMENT_PRIORITIES.join(', ')}.`,
    });
  }

  // Tags
  if (tags !== undefined && tags !== null && !Array.isArray(tags)) {
    errors.push({ field: 'tags', message: 'Tags must be an array of strings.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  next();
};

/**
 * Validates requirement status transition payload
 */
export const validateChangeRequirementStatus = (req, res, next) => {
  const { status, rejection_reason } = req.body || {};
  const errors = [];

  if (!status || typeof status !== 'string') {
    errors.push({ field: 'status', message: 'Status must be provided.' });
  } else if (!isValidRequirementStatus(status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${ALL_REQUIREMENT_STATUSES.join(', ')}.`,
    });
  }

  if (status === 'rejected' && (!rejection_reason || typeof rejection_reason !== 'string' || !rejection_reason.trim())) {
    errors.push({ field: 'rejection_reason', message: 'A rejection reason is required when rejecting a requirement.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  next();
};

/**
 * Validates requirement rejection
 */
export const validateRejectRequirement = (req, res, next) => {
  const { rejection_reason } = req.body || {};

  if (!rejection_reason || typeof rejection_reason !== 'string' || !rejection_reason.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: [{ field: 'rejection_reason', message: 'A rejection reason is required when rejecting a requirement.' }],
    });
  }

  next();
};
