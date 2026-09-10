import axiosClient from './axiosClient';

/**
 * Tasks management API service
 * Interacts with /api/v1/tasks
 */
export const tasksApi = {
  /**
   * GET /api/v1/tasks
   * List tasks with pagination, filters, search, and metrics
   */
  listTasks: (params = {}) => axiosClient.get('/tasks', { params }),

  /**
   * GET /api/v1/tasks/:id
   * Get single task details
   */
  getTaskById: (id) => axiosClient.get(`/tasks/${id}`),

  /**
   * POST /api/v1/tasks
   * Create a new task
   */
  createTask: (data) => axiosClient.post('/tasks', data),

  /**
   * PATCH /api/v1/tasks/:id
   * Update task details
   */
  updateTask: (id, data) => axiosClient.patch(`/tasks/${id}`, data),

  /**
   * PATCH /api/v1/tasks/:id/status
   * Update task status
   */
  updateStatus: (id, status) => axiosClient.patch(`/tasks/${id}/status`, { status }),

  /**
   * PATCH /api/v1/tasks/:id/assign
   * Assign or reassign task
   */
  assignTask: (id, assigned_user_id) => axiosClient.patch(`/tasks/${id}/assign`, { assigned_user_id }),

  /**
   * DELETE /api/v1/tasks/:id
   * Delete task (Admin only)
   */
  deleteTask: (id) => axiosClient.delete(`/tasks/${id}`),
};

export default tasksApi;
