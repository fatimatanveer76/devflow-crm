import {
  ALL_LEAD_STATUSES,
  ALL_LEAD_PRIORITIES,
  ALL_LEAD_SOURCES,
  isValidLeadStatus,
  isValidLeadPriority,
  isValidLeadSource,
} from '../config/leads.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUUID = (str) => UUID_REGEX.test(str);

/**
 * Validates lead creation request body
 */
export const validateCreateLead = (req, res, next) => {
  const { name, email, phone, company, source, status, priority, assigned_user_id } = req.body || {};
  const errors = [];

  // Name (required)
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Lead name is required and must be at least 2 characters.' });
  } else if (name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Lead name cannot exceed 150 characters.' });
  }

  // Email (optional, but if provided must be valid)
  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.push({ field: 'email', message: 'A valid email address is required.' });
    } else if (email.trim().length > 255) {
      errors.push({ field: 'email', message: 'Email cannot exceed 255 characters.' });
    }
  }

  // Phone (optional)
  if (phone !== undefined && phone !== null && typeof phone === 'string' && phone.trim().length > 50) {
    errors.push({ field: 'phone', message: 'Phone number cannot exceed 50 characters.' });
  }

  // Company (optional)
  if (company !== undefined && company !== null && typeof company === 'string' && company.trim().length > 150) {
    errors.push({ field: 'company', message: 'Company name cannot exceed 150 characters.' });
  }

  // Source (optional)
  if (source !== undefined && source !== null && !isValidLeadSource(source)) {
    errors.push({
      field: 'source',
      message: `Source must be one of: ${ALL_LEAD_SOURCES.join(', ')}.`,
    });
  }

  // Status (optional)
  if (status !== undefined && status !== null && !isValidLeadStatus(status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${ALL_LEAD_STATUSES.join(', ')}.`,
    });
  }

  // Priority (optional)
  if (priority !== undefined && priority !== null && !isValidLeadPriority(priority)) {
    errors.push({
      field: 'priority',
      message: `Priority must be one of: ${ALL_LEAD_PRIORITIES.join(', ')}.`,
    });
  }

  // Assigned User (optional UUID)
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
 * Validates lead update request body
 */
export const validateUpdateLead = (req, res, next) => {
  const { name, email, phone, company, source, status, priority, assigned_user_id } = req.body || {};
  const errors = [];

  // Name (optional on update)
  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Lead name must be at least 2 characters.' });
    } else if (name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Lead name cannot exceed 150 characters.' });
    }
  }

  // Email (optional on update)
  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.push({ field: 'email', message: 'A valid email address is required.' });
    } else if (email.trim().length > 255) {
      errors.push({ field: 'email', message: 'Email cannot exceed 255 characters.' });
    }
  }

  // Phone
  if (phone !== undefined && phone !== null && typeof phone === 'string' && phone.trim().length > 50) {
    errors.push({ field: 'phone', message: 'Phone number cannot exceed 50 characters.' });
  }

  // Company
  if (company !== undefined && company !== null && typeof company === 'string' && company.trim().length > 150) {
    errors.push({ field: 'company', message: 'Company name cannot exceed 150 characters.' });
  }

  // Source
  if (source !== undefined && source !== null && !isValidLeadSource(source)) {
    errors.push({
      field: 'source',
      message: `Source must be one of: ${ALL_LEAD_SOURCES.join(', ')}.`,
    });
  }

  // Status
  if (status !== undefined && status !== null && !isValidLeadStatus(status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${ALL_LEAD_STATUSES.join(', ')}.`,
    });
  }

  // Priority
  if (priority !== undefined && priority !== null && !isValidLeadPriority(priority)) {
    errors.push({
      field: 'priority',
      message: `Priority must be one of: ${ALL_LEAD_PRIORITIES.join(', ')}.`,
    });
  }

  // Assigned User
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
 * Validates lead status update request
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

  if (!isValidLeadStatus(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status.',
      errors: [{ field: 'status', message: `Status must be one of: ${ALL_LEAD_STATUSES.join(', ')}.` }],
    });
  }

  next();
};

/**
 * Validates lead assignment request
 */
export const validateAssignLead = (req, res, next) => {
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
