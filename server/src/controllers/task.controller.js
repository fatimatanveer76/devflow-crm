import { TaskService } from '../services/task.service.js';

/**
 * POST /api/v1/tasks
 * Create a new task
 */
export const createTask = async (req, res, next) => {
  try {
    const task = await TaskService.createTask(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tasks
 * List tasks with filters, search, pagination, and summary metrics
 */
export const listTasks = async (req, res, next) => {
  try {
    const result = await TaskService.listTasks(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tasks/:id
 * Retrieve a single task by ID
 */
export const getTaskById = async (req, res, next) => {
  try {
    const task = await TaskService.getTaskById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/tasks/:id
 * Update an existing task
 */
export const updateTask = async (req, res, next) => {
  try {
    const task = await TaskService.updateTask(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/tasks/:id/status
 * Update task status
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await TaskService.updateTaskStatus(req.params.id, status, req.user);
    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/tasks/:id/assign
 * Assign or reassign task
 */
export const assignTask = async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    const task = await TaskService.assignTask(req.params.id, assigned_user_id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Task assigned successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/tasks/:id
 * Soft-delete a task (Admin only)
 */
export const deleteTask = async (req, res, next) => {
  try {
    await TaskService.deleteTask(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
