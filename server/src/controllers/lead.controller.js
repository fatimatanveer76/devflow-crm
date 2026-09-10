import { LeadService } from '../services/lead.service.js';

/**
 * POST /api/v1/leads
 * Create a new lead
 */
export const createLead = async (req, res, next) => {
  try {
    const lead = await LeadService.createLead(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Lead created successfully.',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leads
 * List leads with search, filters, pagination, and sorting
 */
export const listLeads = async (req, res, next) => {
  try {
    const result = await LeadService.listLeads(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leads/:id
 * Retrieve a single lead by ID
 */
export const getLeadById = async (req, res, next) => {
  try {
    const lead = await LeadService.getLeadById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/leads/:id
 * Update an existing lead
 */
export const updateLead = async (req, res, next) => {
  try {
    const lead = await LeadService.updateLead(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully.',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/leads/:id/status
 * Update only the status of a lead
 */
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const lead = await LeadService.updateLeadStatus(req.params.id, status, req.user);
    return res.status(200).json({
      success: true,
      message: 'Lead status updated successfully.',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/leads/:id/assign
 * Assign or reassign a lead (Admin/Manager only)
 */
export const assignLead = async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    const lead = await LeadService.assignLead(req.params.id, assigned_user_id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Lead assigned successfully.',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/leads/:id
 * Soft-delete a lead (Admin only)
 */
export const deleteLead = async (req, res, next) => {
  try {
    await LeadService.deleteLead(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Lead deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
