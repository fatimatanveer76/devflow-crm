import {
  ALL_DEAL_STAGES,
  ALL_DEAL_STATUSES,
  ALL_DEAL_CURRENCIES,
  isValidDealStage,
  isValidDealStatus,
  isValidCurrency,
} from '../config/deals.js';
import { isValidUUID } from './leadValidate.middleware.js';

/**
 * Validates deal creation request body
 */
export const validateCreateDeal = (req, res, next) => {
  const {
    title,
    value,
    currency,
    stage,
    probability,
    status,
    lead_id,
    assigned_user_id,
    expected_close_date,
  } = req.body || {};

  const errors = [];

  // Title (required)
  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push({ field: 'title', message: 'Deal title is required and must be at least 2 characters.' });
  } else if (title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Deal title cannot exceed 200 characters.' });
  }

  // Value (optional, defaults to 0)
  if (value !== undefined && value !== null) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      errors.push({ field: 'value', message: 'Deal value must be a non-negative number.' });
    }
  }

  // Currency (optional)
  if (currency !== undefined && currency !== null && !isValidCurrency(currency)) {
    errors.push({
      field: 'currency',
      message: `Currency must be one of: ${ALL_DEAL_CURRENCIES.join(', ')}.`,
    });
  }

  // Stage (optional)
  if (stage !== undefined && stage !== null && !isValidDealStage(stage)) {
    errors.push({
      field: 'stage',
      message: `Stage must be one of: ${ALL_DEAL_STAGES.join(', ')}.`,
    });
  }

  // Probability (optional, 0-100)
  if (probability !== undefined && probability !== null) {
    const probNum = Number(probability);
    if (isNaN(probNum) || probNum < 0 || probNum > 100) {
      errors.push({ field: 'probability', message: 'Probability must be an integer between 0 and 100.' });
    }
  }

  // Status (optional)
  if (status !== undefined && status !== null && !isValidDealStatus(status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${ALL_DEAL_STATUSES.join(', ')}.`,
    });
  }

  // Lead Relationship (optional UUID)
  if (lead_id !== undefined && lead_id !== null && lead_id !== '') {
    if (!isValidUUID(lead_id)) {
      errors.push({ field: 'lead_id', message: 'Lead ID must be a valid UUID.' });
    }
  }

  // Assigned User (optional UUID)
  if (assigned_user_id !== undefined && assigned_user_id !== null && assigned_user_id !== '') {
    if (!isValidUUID(assigned_user_id)) {
      errors.push({ field: 'assigned_user_id', message: 'Assigned user ID must be a valid UUID.' });
    }
  }

  // Expected Close Date (optional date string)
  if (expected_close_date !== undefined && expected_close_date !== null && expected_close_date !== '') {
    const parsedDate = new Date(expected_close_date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: 'expected_close_date', message: 'Expected close date must be a valid date format.' });
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
 * Validates deal update request body
 */
export const validateUpdateDeal = (req, res, next) => {
  const {
    title,
    value,
    currency,
    stage,
    probability,
    status,
    lead_id,
    assigned_user_id,
    expected_close_date,
  } = req.body || {};

  const errors = [];

  // Title (optional on update)
  if (title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      errors.push({ field: 'title', message: 'Deal title must be at least 2 characters.' });
    } else if (title.trim().length > 200) {
      errors.push({ field: 'title', message: 'Deal title cannot exceed 200 characters.' });
    }
  }

  // Value
  if (value !== undefined && value !== null) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      errors.push({ field: 'value', message: 'Deal value must be a non-negative number.' });
    }
  }

  // Currency
  if (currency !== undefined && currency !== null && !isValidCurrency(currency)) {
    errors.push({
      field: 'currency',
      message: `Currency must be one of: ${ALL_DEAL_CURRENCIES.join(', ')}.`,
    });
  }

  // Stage
  if (stage !== undefined && stage !== null && !isValidDealStage(stage)) {
    errors.push({
      field: 'stage',
      message: `Stage must be one of: ${ALL_DEAL_STAGES.join(', ')}.`,
    });
  }

  // Probability
  if (probability !== undefined && probability !== null) {
    const probNum = Number(probability);
    if (isNaN(probNum) || probNum < 0 || probNum > 100) {
      errors.push({ field: 'probability', message: 'Probability must be an integer between 0 and 100.' });
    }
  }

  // Status
  if (status !== undefined && status !== null && !isValidDealStatus(status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${ALL_DEAL_STATUSES.join(', ')}.`,
    });
  }

  // Lead Relationship
  if (lead_id !== undefined && lead_id !== null && lead_id !== '') {
    if (!isValidUUID(lead_id)) {
      errors.push({ field: 'lead_id', message: 'Lead ID must be a valid UUID.' });
    }
  }

  // Assigned User
  if (assigned_user_id !== undefined && assigned_user_id !== null && assigned_user_id !== '') {
    if (!isValidUUID(assigned_user_id)) {
      errors.push({ field: 'assigned_user_id', message: 'Assigned user ID must be a valid UUID.' });
    }
  }

  // Expected Close Date
  if (expected_close_date !== undefined && expected_close_date !== null && expected_close_date !== '') {
    const parsedDate = new Date(expected_close_date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: 'expected_close_date', message: 'Expected close date must be a valid date format.' });
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
 * Validates deal stage update request
 */
export const validateUpdateStage = (req, res, next) => {
  const { stage, probability } = req.body || {};
  const errors = [];

  if (!stage || typeof stage !== 'string') {
    errors.push({ field: 'stage', message: 'Stage is required.' });
  } else if (!isValidDealStage(stage)) {
    errors.push({ field: 'stage', message: `Stage must be one of: ${ALL_DEAL_STAGES.join(', ')}.` });
  }

  if (probability !== undefined && probability !== null) {
    const probNum = Number(probability);
    if (isNaN(probNum) || probNum < 0 || probNum > 100) {
      errors.push({ field: 'probability', message: 'Probability must be between 0 and 100.' });
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
 * Validates deal status update request
 */
export const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body || {};

  if (!status || typeof status !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Status is required.',
      errors: [{ field: 'status', message: 'Status must be provided.' }],
    });
  }

  if (!isValidDealStatus(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status.',
      errors: [{ field: 'status', message: `Status must be one of: ${ALL_DEAL_STATUSES.join(', ')}.` }],
    });
  }

  next();
};

/**
 * Validates deal assignment request
 */
export const validateAssignDeal = (req, res, next) => {
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
