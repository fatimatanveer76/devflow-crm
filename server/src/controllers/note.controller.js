import { NoteService } from '../services/note.service.js';

/**
 * POST /api/v1/notes
 * Create a new note
 */
export const createNote = async (req, res, next) => {
  try {
    const note = await NoteService.createNote(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Note added successfully.',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notes
 * List notes (optionally filtered by lead_id, deal_id, project_id, task_id)
 */
export const listNotes = async (req, res, next) => {
  try {
    const result = await NoteService.listNotes(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notes/:id
 * Update note content
 */
export const updateNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    const note = await NoteService.updateNote(req.params.id, content, req.user);
    return res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/notes/:id
 * Delete note
 */
export const deleteNote = async (req, res, next) => {
  try {
    await NoteService.deleteNote(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
