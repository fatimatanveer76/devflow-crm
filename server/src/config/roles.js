/**
 * DevFlow CRM — System Role Definitions
 *
 * Centralized role constants for the RBAC system.
 * Import from this module everywhere roles are referenced.
 * Never scatter role strings throughout the codebase.
 */

/**
 * System roles in priority order (highest → lowest)
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
});

/**
 * All valid system role values as an array
 */
export const ALL_ROLES = Object.freeze(Object.values(ROLES));

/**
 * Role hierarchy — maps each role to a numeric level.
 * Higher number = higher privilege.
 */
const ROLE_HIERARCHY = Object.freeze({
  [ROLES.ADMIN]: 100,
  [ROLES.MANAGER]: 50,
  [ROLES.EMPLOYEE]: 10,
});

/**
 * Returns true if userRole has at least the same privilege level as requiredRole.
 * @param {string} userRole - The role of the authenticated user
 * @param {string} requiredRole - The minimum required role
 * @returns {boolean}
 */
export const hasMinimumRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? Infinity;
  return userLevel >= requiredLevel;
};

/**
 * Returns true if a role string is a valid system role.
 * @param {string} role
 * @returns {boolean}
 */
export const isValidRole = (role) => ALL_ROLES.includes(role);

/**
 * Permissions matrix per role.
 * Defines what each role is explicitly allowed to do in Phase 4.
 */
export const PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: Object.freeze({
    canListUsers: true,
    canViewUser: true,
    canChangeRole: true,
    canChangeStatus: true,
    canDeleteUser: true,
  }),
  [ROLES.MANAGER]: Object.freeze({
    canListUsers: true,
    canViewUser: true,
    canChangeRole: false,
    canChangeStatus: false,
    canDeleteUser: false,
  }),
  [ROLES.EMPLOYEE]: Object.freeze({
    canListUsers: false,
    canViewUser: false,
    canChangeRole: false,
    canChangeStatus: false,
    canDeleteUser: false,
  }),
});

/**
 * Returns the permission object for the given role.
 * Returns empty-permission object for unknown roles.
 * @param {string} role
 * @returns {Object}
 */
export const getPermissions = (role) => PERMISSIONS[role] ?? {
  canListUsers: false,
  canViewUser: false,
  canChangeRole: false,
  canChangeStatus: false,
  canDeleteUser: false,
};
