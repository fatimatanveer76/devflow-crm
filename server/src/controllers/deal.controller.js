import { DealService } from '../services/deal.service.js';

/**
 * POST /api/v1/deals
 * Create a new deal
 */
export const createDeal = async (req, res, next) => {
  try {
    const deal = await DealService.createDeal(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Deal created successfully.',
      data: { deal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/deals
 * List deals with search, stage/status filters, pagination, and pipeline summary
 */
export const listDeals = async (req, res, next) => {
  try {
    const result = await DealService.listDeals(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/deals/:id
 * Retrieve a single deal by ID
 */
export const getDealById = async (req, res, next) => {
  try {
    const deal = await DealService.getDealById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      data: { deal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/deals/:id
 * Update an existing deal
 */
export const updateDeal = async (req, res, next) => {
  try {
    const deal = await DealService.updateDeal(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Deal updated successfully.',
      data: { deal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/deals/:id/stage
 * Update deal pipeline stage and probability
 */
export const updateDealStage = async (req, res, next) => {
  try {
    const { stage, probability } = req.body;
    const deal = await DealService.updateDealStage(req.params.id, stage, probability, req.user);
    return res.status(200).json({
      success: true,
      message: 'Deal stage updated successfully.',
      data: { deal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/deals/:id/status
 * Update deal status (open / won / lost)
 */
export const updateDealStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const deal = await DealService.updateDealStatus(req.params.id, status, req.user);
    return res.status(200).json({
      success: true,
      message: 'Deal status updated successfully.',
      data: { deal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/deals/:id/assign
 * Assign or reassign deal (Admin/Manager only)
 */
export const assignDeal = async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    const deal = await DealService.assignDeal(req.params.id, assigned_user_id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Deal assigned successfully.',
      data: { deal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/deals/:id
 * Soft-delete deal (Admin only)
 */
export const deleteDeal = async (req, res, next) => {
  try {
    await DealService.deleteDeal(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Deal deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
