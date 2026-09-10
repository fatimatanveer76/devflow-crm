import {
  ALL_PROJECT_STATUSES,
  ALL_PROJECT_PRIORITIES,
  isValidProjectStatus,
  isValidProjectPriority,
} from '../config/projects.js';
import { ALL_DEAL_CURRENCIES, isValidCurrency } from '../config/deals.js';
import { isValidUUID } from './leadValidate.middleware.js';

/**
 * Validates project creation payload
 */
export const validateCreateProject = (req, res, next) => {
  const {
    name,
    description,
    status,
    priority,
    budget,
    currency,
    start_date,
    due_date,
    deal_id,
    lead_id,
    assigned_user_id,
  } = req.body || {};

  const errors = [];

  // Name (required)
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Project name is required and must be at least 2 characters.' });
  } else if (name.trim().length > 200) {
    errors.push({ field: 'name', message: 'Project name cannot exceed 200 characters.' });
  }

  // Budget
  if (budget !== undefined && budget !== null) {
    const num = Number(budget);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'budget', message: 'Project budget must be a non-negative number.' });
    }
  }

  // Currency
  if (currency !== undefined && currency !== null && !isValidCurrency(currency)) {
    errors.push({ field: 'currency', message: `Currency must be one of: ${ALL_DEAL_CURRENCIES.join(', ')}.` });
  }

  // Status
  if (status !== undefined && status !== null && !isValidProjectStatus(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${ALL_PROJECT_STATUSES.join(', ')}.` });
  }

  // Priority
  if (priority !== undefined && priority !== null && !isValidProjectPriority(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${ALL_PROJECT_PRIORITIES.join(', ')}.` });
  }

  // Dates
  if (start_date !== undefined && start_date !== null && start_date !== '') {
    const d = new Date(start_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'start_date', message: 'Start date must be a valid date format.' });
    }
  }

  if (due_date !== undefined && due_date !== null && due_date !== '') {
    const d = new Date(due_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'due_date', message: 'Due date must be a valid date format.' });
    }
  }

  // Foreign keys
  if (deal_id !== undefined && deal_id !== null && deal_id !== '') {
    if (!isValidUUID(deal_id)) {
      errors.push({ field: 'deal_id', message: 'Deal ID must be a valid UUID.' });
    }
  }

  if (lead_id !== undefined && lead_id !== null && lead_id !== '') {
    if (!isValidUUID(lead_id)) {
      errors.push({ field: 'lead_id', message: 'Lead ID must be a valid UUID.' });
    }
  }

  if (assigned_user_id !== undefined && assigned_user_id !== null && assigned_user_id !== '') {
    if (!isValidUUID(assigned_user_id)) {
      errors.push({ field: 'assigned_user_id', message: 'Assigned user ID must be a valid UUID.' });
    }
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
 * Validates project update payload
 */
export const validateUpdateProject = (req, res, next) => {
  const {
    name,
    description,
    status,
    priority,
    budget,
    currency,
    start_date,
    due_date,
    deal_id,
    lead_id,
    assigned_user_id,
  } = req.body || {};

  const errors = [];

  // Name (optional on update)
  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Project name must be at least 2 characters.' });
    } else if (name.trim().length > 200) {
      errors.push({ field: 'name', message: 'Project name cannot exceed 200 characters.' });
    }
  }

  // Budget
  if (budget !== undefined && budget !== null) {
    const num = Number(budget);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'budget', message: 'Project budget must be a non-negative number.' });
    }
  }

  // Currency
  if (currency !== undefined && currency !== null && !isValidCurrency(currency)) {
    errors.push({ field: 'currency', message: `Currency must be one of: ${ALL_DEAL_CURRENCIES.join(', ')}.` });
  }

  // Status
  if (status !== undefined && status !== null && !isValidProjectStatus(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${ALL_PROJECT_STATUSES.join(', ')}.` });
  }

  // Priority
  if (priority !== undefined && priority !== null && !isValidProjectPriority(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${ALL_PROJECT_PRIORITIES.join(', ')}.` });
  }

  // Dates
  if (start_date !== undefined && start_date !== null && start_date !== '') {
    const d = new Date(start_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'start_date', message: 'Start date must be a valid date format.' });
    }
  }

  if (due_date !== undefined && due_date !== null && due_date !== '') {
    const d = new Date(due_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'due_date', message: 'Due date must be a valid date format.' });
    }
  }

  // Foreign keys
  if (deal_id !== undefined && deal_id !== null && deal_id !== '') {
    if (!isValidUUID(deal_id)) {
      errors.push({ field: 'deal_id', message: 'Deal ID must be a valid UUID.' });
    }
  }

  if (lead_id !== undefined && lead_id !== null && lead_id !== '') {
    if (!isValidUUID(lead_id)) {
      errors.push({ field: 'lead_id', message: 'Lead ID must be a valid UUID.' });
    }
  }

  if (assigned_user_id !== undefined && assigned_user_id !== null && assigned_user_id !== '') {
    if (!isValidUUID(assigned_user_id)) {
      errors.push({ field: 'assigned_user_id', message: 'Assigned user ID must be a valid UUID.' });
    }
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
 * Validates project status update
 */
export const validateUpdateProjectStatus = (req, res, next) => {
  const { status } = req.body || {};

  if (!status || typeof status !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Status is required.',
      errors: [{ field: 'status', message: 'Status must be provided.' }],
    });
  }

  if (!isValidProjectStatus(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project status.',
      errors: [{ field: 'status', message: `Status must be one of: ${ALL_PROJECT_STATUSES.join(', ')}.` }],
    });
  }

  next();
};

/**
 * Validates project assignment
 */
export const validateAssignProject = (req, res, next) => {
  const { assigned_user_id } = req.body || {};

  if (assigned_user_id !== null && assigned_user_id !== undefined && assigned_user_id !== '') {
    if (!isValidUUID(assigned_user_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
        errors: [{ field: 'assigned_user_id', message: 'Assigned user ID must be a valid UUID or null.' }],
      });
    }
  }

  next();
};
