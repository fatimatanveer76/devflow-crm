import { ProjectService } from '../services/project.service.js';

/**
 * POST /api/v1/projects
 * Create a new project
 */
export const createProject = async (req, res, next) => {
  try {
    const project = await ProjectService.createProject(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/projects
 * List projects with search, status/priority filters, pagination, and metrics
 */
export const listProjects = async (req, res, next) => {
  try {
    const result = await ProjectService.listProjects(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/projects/:id
 * Retrieve a single project by ID
 */
export const getProjectById = async (req, res, next) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/projects/:id
 * Update an existing project
 */
export const updateProject = async (req, res, next) => {
  try {
    const project = await ProjectService.updateProject(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/projects/:id/status
 * Update project status
 */
export const updateProjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const project = await ProjectService.updateProjectStatus(req.params.id, status, req.user);
    return res.status(200).json({
      success: true,
      message: 'Project status updated successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/projects/:id/assign
 * Assign or reassign project (Admin/Manager only)
 */
export const assignProject = async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    const project = await ProjectService.assignProject(req.params.id, assigned_user_id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Project assigned successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/projects/:id
 * Soft-delete a project (Admin only)
 */
export const deleteProject = async (req, res, next) => {
  try {
    await ProjectService.deleteProject(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
