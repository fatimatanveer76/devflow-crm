import { UserService } from '../services/user.service.js';
import { isValidRole } from '../config/roles.js';

/**
 * GET /api/v1/users
 * List users with pagination. Access: admin, manager
 */
export const listUsers = async (req, res, next) => {
  try {
    const { page, limit, role, isActive } = req.query;

    // Parse isActive query param
    let activeFilter;
    if (isActive === 'true') activeFilter = true;
    else if (isActive === 'false') activeFilter = false;

    const result = await UserService.listUsers({
      page,
      limit,
      role,
      isActive: activeFilter,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/:id
 * Get a single user by ID. Access: admin, manager
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/role
 * Update a user's role. Access: admin only
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || typeof role !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Role is required.',
        errors: [{ field: 'role', message: 'Role must be provided.' }],
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role.',
        errors: [{ field: 'role', message: 'Role must be one of: admin, manager, employee.' }],
      });
    }

    const user = await UserService.updateUserRole(id, role, req.userId);

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/status
 * Activate or deactivate a user. Access: admin only
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive is required.',
        errors: [{ field: 'isActive', message: 'isActive must be a boolean (true or false).' }],
      });
    }

    const user = await UserService.updateUserStatus(id, isActive, req.userId);

    return res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/users/:id
 * Soft-delete a user. Access: admin only
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserService.softDeleteUser(id, req.userId);

    return res.status(200).json({
      success: true,
      message: 'User has been removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
