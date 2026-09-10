import {
  ALL_TASK_STATUSES,
  ALL_TASK_PRIORITIES,
  isValidTaskStatus,
  isValidTaskPriority,
} from '../config/tasks.js';
import { isValidUUID } from './leadValidate.middleware.js';

/**
 * Validates task creation payload
 */
export const validateCreateTask = (req, res, next) => {
  const {
    title,
    description,
    status,
    priority,
    due_date,
    assigned_user_id,
    lead_id,
    deal_id,
    project_id,
  } = req.body || {};

  const errors = [];

  // Title (required)
  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push({ field: 'title', message: 'Task title is required and must be at least 2 characters.' });
  } else if (title.trim().length > 300) {
    errors.push({ field: 'title', message: 'Task title cannot exceed 300 characters.' });
  }

  // Status
  if (status !== undefined && status !== null && !isValidTaskStatus(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${ALL_TASK_STATUSES.join(', ')}.` });
  }

  // Priority
  if (priority !== undefined && priority !== null && !isValidTaskPriority(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${ALL_TASK_PRIORITIES.join(', ')}.` });
  }

  // Due date
  if (due_date !== undefined && due_date !== null && due_date !== '') {
    const d = new Date(due_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'due_date', message: 'Due date must be a valid date format.' });
    }
  }

  // Entity and user associations
  if (assigned_user_id !== undefined && assigned_user_id !== null && assigned_user_id !== '') {
    if (!isValidUUID(assigned_user_id)) {
      errors.push({ field: 'assigned_user_id', message: 'Assigned user ID must be a valid UUID.' });
    }
  }

  if (lead_id !== undefined && lead_id !== null && lead_id !== '') {
    if (!isValidUUID(lead_id)) {
      errors.push({ field: 'lead_id', message: 'Lead ID must be a valid UUID.' });
    }
  }

  if (deal_id !== undefined && deal_id !== null && deal_id !== '') {
    if (!isValidUUID(deal_id)) {
      errors.push({ field: 'deal_id', message: 'Deal ID must be a valid UUID.' });
    }
  }

  if (project_id !== undefined && project_id !== null && project_id !== '') {
    if (!isValidUUID(project_id)) {
      errors.push({ field: 'project_id', message: 'Project ID must be a valid UUID.' });
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
 * Validates task update payload
 */
export const validateUpdateTask = (req, res, next) => {
  const {
    title,
    description,
    status,
    priority,
    due_date,
    assigned_user_id,
    lead_id,
    deal_id,
    project_id,
  } = req.body || {};

  const errors = [];

  if (title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      errors.push({ field: 'title', message: 'Task title must be at least 2 characters.' });
    } else if (title.trim().length > 300) {
      errors.push({ field: 'title', message: 'Task title cannot exceed 300 characters.' });
    }
  }

  if (status !== undefined && status !== null && !isValidTaskStatus(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${ALL_TASK_STATUSES.join(', ')}.` });
  }

  if (priority !== undefined && priority !== null && !isValidTaskPriority(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${ALL_TASK_PRIORITIES.join(', ')}.` });
  }

  if (due_date !== undefined && due_date !== null && due_date !== '') {
    const d = new Date(due_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'due_date', message: 'Due date must be a valid date format.' });
    }
  }

  if (assigned_user_id !== undefined && assigned_user_id !== null && assigned_user_id !== '') {
    if (!isValidUUID(assigned_user_id)) {
      errors.push({ field: 'assigned_user_id', message: 'Assigned user ID must be a valid UUID.' });
    }
  }

  if (lead_id !== undefined && lead_id !== null && lead_id !== '') {
    if (!isValidUUID(lead_id)) {
      errors.push({ field: 'lead_id', message: 'Lead ID must be a valid UUID.' });
    }
  }

  if (deal_id !== undefined && deal_id !== null && deal_id !== '') {
    if (!isValidUUID(deal_id)) {
      errors.push({ field: 'deal_id', message: 'Deal ID must be a valid UUID.' });
    }
  }

  if (project_id !== undefined && project_id !== null && project_id !== '') {
    if (!isValidUUID(project_id)) {
      errors.push({ field: 'project_id', message: 'Project ID must be a valid UUID.' });
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
 * Validates task status update
 */
export const validateUpdateTaskStatus = (req, res, next) => {
  const { status } = req.body || {};

  if (!status || typeof status !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Status is required.',
      errors: [{ field: 'status', message: 'Status must be provided.' }],
    });
  }

  if (!isValidTaskStatus(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task status.',
      errors: [{ field: 'status', message: `Status must be one of: ${ALL_TASK_STATUSES.join(', ')}.` }],
    });
  }

  next();
};

/**
 * Validates task assignment
 */
export const validateAssignTask = (req, res, next) => {
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
