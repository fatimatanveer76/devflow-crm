import { isValidUUID } from './leadValidate.middleware.js';

/**
 * Validates note creation payload
 */
export const validateCreateNote = (req, res, next) => {
  const { content, lead_id, deal_id, project_id, task_id } = req.body || {};

  const errors = [];

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push({ field: 'content', message: 'Note content is required.' });
  }

  // At least one parent entity or valid association check
  if (lead_id && !isValidUUID(lead_id)) {
    errors.push({ field: 'lead_id', message: 'Lead ID must be a valid UUID.' });
  }
  if (deal_id && !isValidUUID(deal_id)) {
    errors.push({ field: 'deal_id', message: 'Deal ID must be a valid UUID.' });
  }
  if (project_id && !isValidUUID(project_id)) {
    errors.push({ field: 'project_id', message: 'Project ID must be a valid UUID.' });
  }
  if (task_id && !isValidUUID(task_id)) {
    errors.push({ field: 'task_id', message: 'Task ID must be a valid UUID.' });
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
 * Validates note update payload
 */
export const validateUpdateNote = (req, res, next) => {
  const { content } = req.body || {};

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Note content cannot be empty.',
      errors: [{ field: 'content', message: 'Note content is required.' }],
    });
  }

  next();
};
