import axiosClient from './axiosClient';

/**
 * Notes API service
 * Interacts with /api/v1/notes
 */
export const notesApi = {
  /**
   * GET /api/v1/notes
   * List notes for entity
   */
  listNotes: (params = {}) => axiosClient.get('/notes', { params }),

  /**
   * POST /api/v1/notes
   * Create a new note
   */
  createNote: (data) => axiosClient.post('/notes', data),

  /**
   * PATCH /api/v1/notes/:id
   * Update note content
   */
  updateNote: (id, data) => axiosClient.patch(`/notes/${id}`, data),

  /**
   * DELETE /api/v1/notes/:id
   * Delete note
   */
  deleteNote: (id) => axiosClient.delete(`/notes/${id}`),
};

export default notesApi;
