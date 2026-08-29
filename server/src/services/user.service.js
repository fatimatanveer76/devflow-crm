import { Op } from 'sequelize';
import { User } from '../database/models/index.js';
import { isValidRole, ROLES } from '../config/roles.js';

/**
 * Validates that a string is a valid UUID v4
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isValidUUID = (str) => UUID_REGEX.test(str);

export class UserService {
  /**
   * Finds a user by PK and throws 404 if not found or soft-deleted
   * @param {string} id
   * @returns {Promise<User>}
   */
  static async findUserOrFail(id) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid user ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const user = await User.findByPk(id);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    return user;
  }

  /**
   * Lists users with pagination and optional filters
   * @param {Object} options
   * @param {number} options.page
   * @param {number} options.limit
   * @param {string} [options.role] - Filter by role
   * @param {boolean|undefined} [options.isActive] - Filter by active status
   * @returns {Promise<{users: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async listUsers({ page = 1, limit = 20, role, isActive } = {}) {
    const sanitizedPage = Math.max(1, parseInt(page, 10) || 1);
    const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    const where = {};

    if (role && isValidRole(role)) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.is_active = isActive;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: sanitizedLimit,
      offset,
      order: [['created_at', 'DESC']],
      // defaultScope already excludes password_hash
    });

    return {
      users: rows.map((u) => u.toJSON()),
      total: count,
      page: sanitizedPage,
      limit: sanitizedLimit,
      totalPages: Math.ceil(count / sanitizedLimit),
    };
  }

  /**
   * Retrieves a single user by ID
   * @param {string} id
   * @returns {Promise<Object>} Safe user object
   */
  static async getUserById(id) {
    const user = await UserService.findUserOrFail(id);
    return user.toJSON();
  }

  /**
   * Changes a user's role — enforces admin self-protection
   * @param {string} targetId - ID of user being updated
   * @param {string} newRole - New role to assign
   * @param {string} requesterId - ID of the admin performing the update
   * @returns {Promise<Object>} Updated safe user object
   */
  static async updateUserRole(targetId, newRole, requesterId) {
    if (!isValidRole(newRole)) {
      const err = new Error(`Invalid role. Allowed roles: admin, manager, employee.`);
      err.statusCode = 400;
      err.code = 'INVALID_ROLE';
      throw err;
    }

    const user = await UserService.findUserOrFail(targetId);

    // Self-demotion guard: admin cannot remove their own admin role
    if (targetId === requesterId && newRole !== ROLES.ADMIN) {
      const err = new Error('Admins cannot demote their own role. Contact another admin.');
      err.statusCode = 409;
      err.code = 'SELF_DEMOTION_FORBIDDEN';
      throw err;
    }

    // Last-admin guard: if target is an admin and is the only one, block demotion
    if (user.role === ROLES.ADMIN && newRole !== ROLES.ADMIN) {
      const adminCount = await User.count({ where: { role: ROLES.ADMIN, is_active: true } });
      if (adminCount <= 1) {
        const err = new Error('Cannot change role of the last active admin.');
        err.statusCode = 409;
        err.code = 'LAST_ADMIN';
        throw err;
      }
    }

    await user.update({ role: newRole });
    return user.toJSON();
  }

  /**
   * Activates or deactivates a user account
   * @param {string} targetId
   * @param {boolean} isActive
   * @param {string} requesterId
   * @returns {Promise<Object>} Updated safe user object
   */
  static async updateUserStatus(targetId, isActive, requesterId) {
    if (typeof isActive !== 'boolean') {
      const err = new Error('isActive must be a boolean value.');
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const user = await UserService.findUserOrFail(targetId);

    // Self-deactivation guard
    if (targetId === requesterId && !isActive) {
      const err = new Error('You cannot deactivate your own account.');
      err.statusCode = 409;
      err.code = 'SELF_DEACTIVATION_FORBIDDEN';
      throw err;
    }

    // Last-admin guard: cannot deactivate the last active admin
    if (user.role === ROLES.ADMIN && !isActive) {
      const adminCount = await User.count({ where: { role: ROLES.ADMIN, is_active: true } });
      if (adminCount <= 1) {
        const err = new Error('Cannot deactivate the last active admin.');
        err.statusCode = 409;
        err.code = 'LAST_ADMIN';
        throw err;
      }
    }

    await user.update({ is_active: isActive });
    return user.toJSON();
  }

  /**
   * Soft-deletes a user (paranoid delete)
   * @param {string} targetId
   * @param {string} requesterId
   * @returns {Promise<void>}
   */
  static async softDeleteUser(targetId, requesterId) {
    const user = await UserService.findUserOrFail(targetId);

    // Self-deletion guard
    if (targetId === requesterId) {
      const err = new Error('You cannot delete your own account.');
      err.statusCode = 409;
      err.code = 'SELF_DELETION_FORBIDDEN';
      throw err;
    }

    // Last-admin guard
    if (user.role === ROLES.ADMIN) {
      const adminCount = await User.count({ where: { role: ROLES.ADMIN, is_active: true } });
      if (adminCount <= 1) {
        const err = new Error('Cannot delete the last active admin.');
        err.statusCode = 409;
        err.code = 'LAST_ADMIN';
        throw err;
      }
    }

    await user.destroy(); // paranoid soft-delete
  }
}
