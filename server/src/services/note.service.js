import { Note, User, Lead, Deal, Project, Task } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';
import { ActivityService } from './activity.service.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role'];

export class NoteService {
  /**
   * Creates a note attached to an entity
   */
  static async createNote(data, user) {
    const { content, lead_id, deal_id, project_id, task_id } = data;

    // Check entity existence if supplied
    if (lead_id) {
      const lead = await Lead.findByPk(lead_id);
      if (!lead) {
        const err = new Error('Lead not found.');
        err.statusCode = 404;
        err.code = 'LEAD_NOT_FOUND';
        throw err;
      }
    }
    if (deal_id) {
      const deal = await Deal.findByPk(deal_id);
      if (!deal) {
        const err = new Error('Deal not found.');
        err.statusCode = 404;
        err.code = 'DEAL_NOT_FOUND';
        throw err;
      }
    }
    if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        const err = new Error('Project not found.');
        err.statusCode = 404;
        err.code = 'PROJECT_NOT_FOUND';
        throw err;
      }
    }
    if (task_id) {
      const task = await Task.findByPk(task_id);
      if (!task) {
        const err = new Error('Task not found.');
        err.statusCode = 404;
        err.code = 'TASK_NOT_FOUND';
        throw err;
      }
    }

    const note = await Note.create({
      content: content.trim(),
      created_by_id: user.id,
      lead_id: lead_id || null,
      deal_id: deal_id || null,
      project_id: project_id || null,
      task_id: task_id || null,
    });

    // Log activity
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
   * Lists notes for a specific parent entity or all scoped notes
   */
  static async listNotes(query = {}, user) {
    const where = {};

    if (query.lead_id && isValidUUID(query.lead_id)) {
      where.lead_id = query.lead_id;
    }
    if (query.deal_id && isValidUUID(query.deal_id)) {
      where.deal_id = query.deal_id;
    }
    if (query.project_id && isValidUUID(query.project_id)) {
      where.project_id = query.project_id;
    }
    if (query.task_id && isValidUUID(query.task_id)) {
      where.task_id = query.task_id;
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
   * Updates note content
   */
  static async updateNote(id, content, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid note ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const note = await Note.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES }],
    });

    if (!note) {
      const err = new Error('Note not found.');
      err.statusCode = 404;
      err.code = 'NOTE_NOT_FOUND';
      throw err;
    }

    // Only creator or admin/manager can update
    if (user.role === ROLES.EMPLOYEE && note.created_by_id !== user.id) {
      const err = new Error('You do not have permission to edit this note.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
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

    await note.reload();
    return note.toJSON();
  }

  /**
   * Deletes a note
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

    // Admin, Manager, or Note author can delete
    if (user.role === ROLES.EMPLOYEE && note.created_by_id !== user.id) {
      const err = new Error('You do not have permission to delete this note.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    await note.destroy();
    return true;
  }
}

export default NoteService;
