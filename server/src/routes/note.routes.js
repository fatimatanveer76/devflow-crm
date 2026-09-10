import { Router } from 'express';
import {
  createNote,
  listNotes,
  updateNote,
  deleteNote,
} from '../controllers/note.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import {
  validateCreateNote,
  validateUpdateNote,
} from '../middleware/noteValidate.middleware.js';

const router = Router();

// All note routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/notes
 * Create note
 * Access: canCreateNote
 */
router.post('/', requirePermission('canCreateNote'), validateCreateNote, createNote);

/**
 * GET /api/v1/notes
 * List notes
 * Access: canListNotes
 */
router.get('/', requirePermission('canListNotes'), listNotes);

/**
 * PATCH /api/v1/notes/:id
 * Update note
 * Access: canUpdateNote
 */
router.patch('/:id', requirePermission('canUpdateNote'), validateUpdateNote, updateNote);

/**
 * DELETE /api/v1/notes/:id
 * Delete note
 * Access: canDeleteNote
 */
router.delete('/:id', requirePermission('canDeleteNote'), deleteNote);

export default router;
