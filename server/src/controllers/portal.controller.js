import { PortalService } from '../services/portal.service.js';

/**
 * GET /api/v1/portal/dashboard
 * Retrieves dashboard metrics and recent projects strictly for the authenticated client.
 */
export const getDashboard = async (req, res, next) => {
  try {
    const data = await PortalService.getDashboard(req.clientId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/portal/projects
 * Lists all projects owned by the authenticated client.
 */
export const listProjects = async (req, res, next) => {
  try {
    const data = await PortalService.listProjects(req.clientId, req.query);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/portal/projects/:id
 * Retrieves details, progress, and approved specifications for a client's project.
 */
export const getProjectById = async (req, res, next) => {
  try {
    const project = await PortalService.getProjectById(req.clientId, req.params.id);
    return res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/portal/requirements
 * Lists approved and published requirements for the client's projects.
 */
export const listRequirements = async (req, res, next) => {
  try {
    const data = await PortalService.listRequirements(req.clientId, req.query);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/portal/requirements/:id
 * Retrieves a single approved/published specification with version snapshots.
 */
export const getRequirementById = async (req, res, next) => {
  try {
    const requirement = await PortalService.getRequirementById(req.clientId, req.params.id);
    return res.status(200).json({
      success: true,
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/portal/profile
 * Retrieves authenticated client's company profile and contact details.
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await PortalService.getProfile(req.clientId);
    return res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/portal/profile
 * Updates authenticated client's profile information.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const profile = await PortalService.updateProfile(req.clientId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};
