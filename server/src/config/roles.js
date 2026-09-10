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
 * Defines what each role is explicitly allowed to do across DevFlow CRM modules.
 */
export const PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: Object.freeze({
    // User management
    canListUsers: true,
    canViewUser: true,
    canChangeRole: true,
    canChangeStatus: true,
    canDeleteUser: true,
    // Lead management
    canListLeads: true,
    canViewLead: true,
    canCreateLead: true,
    canUpdateLead: true,
    canDeleteLead: true,
    canAssignLead: true,
    canUpdateLeadStatus: true,
    // Deal management
    canListDeals: true,
    canViewDeal: true,
    canCreateDeal: true,
    canUpdateDeal: true,
    canDeleteDeal: true,
    canAssignDeal: true,
    canUpdateDealStage: true,
    canUpdateDealStatus: true,
    // Project management
    canListProjects: true,
    canViewProject: true,
    canCreateProject: true,
    canUpdateProject: true,
    canDeleteProject: true,
    canAssignProject: true,
    canUpdateProjectStatus: true,
    // Task management
    canListTasks: true,
    canViewTask: true,
    canCreateTask: true,
    canUpdateTask: true,
    canDeleteTask: true,
    canAssignTask: true,
    canUpdateTaskStatus: true,
    // Note management
    canListNotes: true,
    canViewNote: true,
    canCreateNote: true,
    canUpdateNote: true,
    canDeleteNote: true,
    // Activity management
    canListActivities: true,
  }),
  [ROLES.MANAGER]: Object.freeze({
    // User management
    canListUsers: true,
    canViewUser: true,
    canChangeRole: false,
    canChangeStatus: false,
    canDeleteUser: false,
    // Lead management
    canListLeads: true,
    canViewLead: true,
    canCreateLead: true,
    canUpdateLead: true,
    canDeleteLead: false, // only admin can delete leads
    canAssignLead: true,
    canUpdateLeadStatus: true,
    // Deal management
    canListDeals: true,
    canViewDeal: true,
    canCreateDeal: true,
    canUpdateDeal: true,
    canDeleteDeal: false, // only admin can delete deals
    canAssignDeal: true,
    canUpdateDealStage: true,
    canUpdateDealStatus: true,
    // Project management
    canListProjects: true,
    canViewProject: true,
    canCreateProject: true,
    canUpdateProject: true,
    canDeleteProject: false, // only admin can delete projects
    canAssignProject: true,
    canUpdateProjectStatus: true,
    // Task management
    canListTasks: true,
    canViewTask: true,
    canCreateTask: true,
    canUpdateTask: true,
    canDeleteTask: false, // only admin can delete tasks
    canAssignTask: true,
    canUpdateTaskStatus: true,
    // Note management
    canListNotes: true,
    canViewNote: true,
    canCreateNote: true,
    canUpdateNote: true,
    canDeleteNote: true,
    // Activity management
    canListActivities: true,
  }),
  [ROLES.EMPLOYEE]: Object.freeze({
    // User management
    canListUsers: false,
    canViewUser: false,
    canChangeRole: false,
    canChangeStatus: false,
    canDeleteUser: false,
    // Lead management (scoped to assigned leads at service level)
    canListLeads: true,
    canViewLead: true,
    canCreateLead: true,
    canUpdateLead: true,
    canDeleteLead: false,
    canAssignLead: false,
    canUpdateLeadStatus: true,
    // Deal management (scoped to assigned deals at service level)
    canListDeals: true,
    canViewDeal: true,
    canCreateDeal: true,
    canUpdateDeal: true,
    canDeleteDeal: false,
    canAssignDeal: false,
    canUpdateDealStage: true,
    canUpdateDealStatus: true,
    // Project management (scoped to assigned projects at service level)
    canListProjects: true,
    canViewProject: true,
    canCreateProject: true,
    canUpdateProject: true,
    canDeleteProject: false,
    canAssignProject: false,
    canUpdateProjectStatus: true,
    // Task management (scoped to assigned tasks at service level)
    canListTasks: true,
    canViewTask: true,
    canCreateTask: true,
    canUpdateTask: true,
    canDeleteTask: false,
    canAssignTask: false,
    canUpdateTaskStatus: true,
    // Note management
    canListNotes: true,
    canViewNote: true,
    canCreateNote: true,
    canUpdateNote: true,
    canDeleteNote: false,
    // Activity management
    canListActivities: true,
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
  canListLeads: false,
  canViewLead: false,
  canCreateLead: false,
  canUpdateLead: false,
  canDeleteLead: false,
  canAssignLead: false,
  canUpdateLeadStatus: false,
  canListDeals: false,
  canViewDeal: false,
  canCreateDeal: false,
  canUpdateDeal: false,
  canDeleteDeal: false,
  canAssignDeal: false,
  canUpdateDealStage: false,
  canUpdateDealStatus: false,
  canListProjects: false,
  canViewProject: false,
  canCreateProject: false,
  canUpdateProject: false,
  canDeleteProject: false,
  canAssignProject: false,
  canUpdateProjectStatus: false,
  canListTasks: false,
  canViewTask: false,
  canCreateTask: false,
  canUpdateTask: false,
  canDeleteTask: false,
  canAssignTask: false,
  canUpdateTaskStatus: false,
  canListNotes: false,
  canViewNote: false,
  canCreateNote: false,
  canUpdateNote: false,
  canDeleteNote: false,
  canListActivities: false,
};
