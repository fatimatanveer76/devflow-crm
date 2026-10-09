import { RequirementService } from '../services/requirement.service.js';

/**
 * POST /api/v1/requirements
 * Create a new requirement in Draft status
 */
export const createRequirement = async (req, res, next) => {
  try {
    const requirement = await RequirementService.createRequirement(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Requirement created successfully.',
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/requirements
 * List requirements with search, filters, pagination, and scoping
 */
export const listRequirements = async (req, res, next) => {
  try {
    const result = await RequirementService.listRequirements(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/requirements/:id
 * Retrieve a requirement by ID with full version history
 */
export const getRequirementById = async (req, res, next) => {
  try {
    const requirement = await RequirementService.getRequirementById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/requirements/:id
 * Update requirement and create a new immutable version snapshot
 */
export const updateRequirement = async (req, res, next) => {
  try {
    const requirement = await RequirementService.updateRequirement(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Requirement updated successfully. New version snapshot created.',
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/requirements/:id/status
 * Transition requirement status
 */
export const changeRequirementStatus = async (req, res, next) => {
  try {
    const { status, rejection_reason } = req.body;
    const requirement = await RequirementService.changeStatus(req.params.id, status, rejection_reason, req.user);
    return res.status(200).json({
      success: true,
      message: `Requirement status transitioned to "${requirement.status}".`,
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/requirements/:id/approve
 * Approve requirement (Admin/Manager only)
 */
export const approveRequirement = async (req, res, next) => {
  try {
    const requirement = await RequirementService.approveRequirement(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Requirement approved successfully.',
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/requirements/:id/reject
 * Reject requirement with explanation (Admin/Manager only)
 */
export const rejectRequirement = async (req, res, next) => {
  try {
    const { rejection_reason } = req.body;
    const requirement = await RequirementService.rejectRequirement(req.params.id, rejection_reason, req.user);
    return res.status(200).json({
      success: true,
      message: 'Requirement rejected.',
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/requirements/:id/publish
 * Publish approved requirement (Admin/Manager only)
 */
export const publishRequirement = async (req, res, next) => {
  try {
    const requirement = await RequirementService.publishRequirement(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Requirement published successfully.',
      data: { requirement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/requirements/:id
 * Soft-delete requirement (Admin only)
 */
export const deleteRequirement = async (req, res, next) => {
  try {
    await RequirementService.deleteRequirement(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/requirements/:id/versions
 * Retrieve immutable version history snapshots for a requirement
 */
export const getVersionHistory = async (req, res, next) => {
  try {
    const versions = await RequirementService.getVersionHistory(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      data: { versions },
    });
  } catch (error) {
    next(error);
  }
};
