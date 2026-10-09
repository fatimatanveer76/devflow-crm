import { Op } from 'sequelize';
import { Note, User, Lead, Deal, Project, Task } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';
import { ActivityService } from './activity.service.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role'];

export class NoteService {
  /**
   * Verifies that the authenticated user is authorized to interact with the parent entity.
   * Admins and Managers have global access; Employees must be assigned to the record.
   * @param {string} entityType - 'lead' | 'deal' | 'project' | 'task'
   * @param {string} entityId - UUID of the parent entity
   * @param {Object} user - Authenticated user identity (req.user)
   * @param {string} operation - Name of operation for contextual error messaging
   * @returns {Promise<Object>} The verified parent model instance
   */
  static async verifyParentAccess(entityType, entityId, user, operation = 'access') {
    if (!isValidUUID(entityId)) {
      const err = new Error(`Invalid ${entityType} ID format.`);
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    let entity = null;

    if (entityType === 'lead') {
      entity = await Lead.findByPk(entityId);
      if (!entity) {
        const err = new Error('Lead not found.');
        err.statusCode = 404;
        err.code = 'LEAD_NOT_FOUND';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && entity.assigned_user_id !== user.id) {
        const err = new Error(`You do not have permission to ${operation} notes for this lead.`);
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    } else if (entityType === 'deal') {
      entity = await Deal.findByPk(entityId);
      if (!entity) {
        const err = new Error('Deal not found.');
        err.statusCode = 404;
        err.code = 'DEAL_NOT_FOUND';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && entity.assigned_user_id !== user.id) {
        const err = new Error(`You do not have permission to ${operation} notes for this deal.`);
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    } else if (entityType === 'project') {
      entity = await Project.findByPk(entityId);
      if (!entity) {
        const err = new Error('Project not found.');
        err.statusCode = 404;
        err.code = 'PROJECT_NOT_FOUND';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && entity.assigned_user_id !== user.id) {
        const err = new Error(`You do not have permission to ${operation} notes for this project.`);
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    } else if (entityType === 'task') {
      entity = await Task.findByPk(entityId);
      if (!entity) {
        const err = new Error('Task not found.');
        err.statusCode = 404;
        err.code = 'TASK_NOT_FOUND';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && entity.assigned_user_id !== user.id && entity.created_by_id !== user.id) {
        const err = new Error(`You do not have permission to ${operation} notes for this task.`);
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    return entity;
  }

  /**
   * Creates a note attached to a verified parent entity.
   * Client-supplied creator and ownership fields are discarded; creator is bound to req.user.id.
   * @param {Object} data - { content, lead_id, deal_id, project_id, task_id }
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Object>} Created note with safe creator association
   */
  static async createNote(data, user) {
    const { content, lead_id, deal_id, project_id, task_id } = data;

    const parentEntities = [
      lead_id ? { type: 'lead', id: lead_id } : null,
      deal_id ? { type: 'deal', id: deal_id } : null,
      project_id ? { type: 'project', id: project_id } : null,
      task_id ? { type: 'task', id: task_id } : null,
    ].filter(Boolean);

    if (parentEntities.length === 0) {
      const err = new Error('A note must be associated with a valid lead, deal, project, or task.');
      err.statusCode = 400;
      err.code = 'PARENT_ENTITY_REQUIRED';
      throw err;
    }

    // Verify user authorization for all referenced parent entities
    for (const parent of parentEntities) {
      await NoteService.verifyParentAccess(parent.type, parent.id, user, 'create');
    }

    // Ensure content is non-empty
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const err = new Error('Note content cannot be empty.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const note = await Note.create({
      content: content.trim(),
      created_by_id: user.id, // Strictly authenticated user identity
      lead_id: lead_id || null,
      deal_id: deal_id || null,
      project_id: project_id || null,
      task_id: task_id || null,
    });

    await ActivityService.log({
      type: 'note_added',
      description: `Note added by ${user.name || user.email}.`,
      user_id: user.id,
      lead_id: note.lead_id,
      deal_id: note.deal_id,
      project_id: note.project_id,
      task_id: note.task_id,
    });

    await note.reload({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: SAFE_USER_ATTRIBUTES,
        },
      ],
    });

    return note.toJSON();
  }

  /**
   * Reads a single note by ID with full parent access authorization check
   * @param {string} id - Note UUID
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Object>} Safe note representation
   */
  static async getNoteById(id, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid note ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const note = await Note.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES },
      ],
    });

    if (!note) {
      const err = new Error('Note not found.');
      err.statusCode = 404;
      err.code = 'NOTE_NOT_FOUND';
      throw err;
    }

    // Enforce parent authorization for employees
    if (user.role === ROLES.EMPLOYEE) {
      if (note.lead_id) await NoteService.verifyParentAccess('lead', note.lead_id, user, 'view');
      if (note.deal_id) await NoteService.verifyParentAccess('deal', note.deal_id, user, 'view');
      if (note.project_id) await NoteService.verifyParentAccess('project', note.project_id, user, 'view');
      if (note.task_id) await NoteService.verifyParentAccess('task', note.task_id, user, 'view');

      // If a note has no parent entity (legacy data), only the creator may view
      if (!note.lead_id && !note.deal_id && !note.project_id && !note.task_id && note.created_by_id !== user.id) {
        const err = new Error('You do not have permission to view this note.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    return note.toJSON();
  }

  /**
   * Lists notes with strict parent entity access checks and employee scoping.
   * Prevents employees from accessing notes attached to records assigned to others.
   * @param {Object} query - Filter query { lead_id, deal_id, project_id, task_id }
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<{notes: Array, total: number}>}
   */
  static async listNotes(query = {}, user) {
    const where = {};
    let parentSpecified = false;

    if (query.lead_id) {
      await NoteService.verifyParentAccess('lead', query.lead_id, user, 'list');
      where.lead_id = query.lead_id;
      parentSpecified = true;
    }
    if (query.deal_id) {
      await NoteService.verifyParentAccess('deal', query.deal_id, user, 'list');
      where.deal_id = query.deal_id;
      parentSpecified = true;
    }
    if (query.project_id) {
      await NoteService.verifyParentAccess('project', query.project_id, user, 'list');
      where.project_id = query.project_id;
      parentSpecified = true;
    }
    if (query.task_id) {
      await NoteService.verifyParentAccess('task', query.task_id, user, 'list');
      where.task_id = query.task_id;
      parentSpecified = true;
    }

    // Default scoping for employees when no specific entity was specified:
    // Only return notes attached to entities assigned to them or authored by them.
    if (!parentSpecified && user.role === ROLES.EMPLOYEE) {
      const [assignedLeads, assignedDeals, assignedProjects, assignedTasks] = await Promise.all([
        Lead.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
        Deal.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
        Project.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
        Task.findAll({
          where: { [Op.or]: [{ assigned_user_id: user.id }, { created_by_id: user.id }] },
          attributes: ['id'],
          raw: true,
        }),
      ]);

      const leadIds = assignedLeads.map((l) => l.id);
      const dealIds = assignedDeals.map((d) => d.id);
      const projectIds = assignedProjects.map((p) => p.id);
      const taskIds = assignedTasks.map((t) => t.id);

      const orConditions = [
        { created_by_id: user.id },
        ...(leadIds.length > 0 ? [{ lead_id: { [Op.in]: leadIds } }] : []),
        ...(dealIds.length > 0 ? [{ deal_id: { [Op.in]: dealIds } }] : []),
        ...(projectIds.length > 0 ? [{ project_id: { [Op.in]: projectIds } }] : []),
        ...(taskIds.length > 0 ? [{ task_id: { [Op.in]: taskIds } }] : []),
      ];

      where[Op.or] = orConditions;
    }

    const notes = await Note.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: SAFE_USER_ATTRIBUTES,
        },
      ],
    });

    return {
      notes: notes.map((n) => n.toJSON()),
      total: notes.length,
    };
  }

  /**
   * Updates note content with parent access check and author verification.
   * @param {string} id - Note UUID
   * @param {string} content - Updated content
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Object>} Updated note
   */
  static async updateNote(id, content, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid note ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const note = await Note.findByPk(id);
    if (!note) {
      const err = new Error('Note not found.');
      err.statusCode = 404;
      err.code = 'NOTE_NOT_FOUND';
      throw err;
    }

    // 1. Verify parent entity access
    if (user.role === ROLES.EMPLOYEE) {
      if (note.lead_id) await NoteService.verifyParentAccess('lead', note.lead_id, user, 'edit');
      if (note.deal_id) await NoteService.verifyParentAccess('deal', note.deal_id, user, 'edit');
      if (note.project_id) await NoteService.verifyParentAccess('project', note.project_id, user, 'edit');
      if (note.task_id) await NoteService.verifyParentAccess('task', note.task_id, user, 'edit');

      // 2. Only the note author can edit their own note
      if (note.created_by_id !== user.id) {
        const err = new Error('You do not have permission to edit this note.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const err = new Error('Note content cannot be empty.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    note.content = content.trim();
    await note.save();

    await ActivityService.log({
      type: 'note_updated',
      description: `Note updated by ${user.name || user.email}.`,
      user_id: user.id,
      lead_id: note.lead_id,
      deal_id: note.deal_id,
      project_id: note.project_id,
      task_id: note.task_id,
    });

    await note.reload({
      include: [{ model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES }],
    });
    return note.toJSON();
  }

  /**
   * Deletes a note with parent access check and author / moderator verification.
   * @param {string} id - Note UUID
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<boolean>}
   */
  static async deleteNote(id, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid note ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const note = await Note.findByPk(id);
    if (!note) {
      const err = new Error('Note not found.');
      err.statusCode = 404;
      err.code = 'NOTE_NOT_FOUND';
      throw err;
    }

    // 1. Verify parent entity access
    if (user.role === ROLES.EMPLOYEE) {
      if (note.lead_id) await NoteService.verifyParentAccess('lead', note.lead_id, user, 'delete');
      if (note.deal_id) await NoteService.verifyParentAccess('deal', note.deal_id, user, 'delete');
      if (note.project_id) await NoteService.verifyParentAccess('project', note.project_id, user, 'delete');
      if (note.task_id) await NoteService.verifyParentAccess('task', note.task_id, user, 'delete');

      // 2. Only the author can delete their note (Admins and Managers can moderate all notes)
      if (note.created_by_id !== user.id) {
        const err = new Error('You do not have permission to delete this note.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    await note.destroy();
    return true;
  }
}

export default NoteService;
