import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';

/**
 * RoleGuard — renders children only when the authenticated user's role
 * is included in the `allowedRoles` array.
 *
 * IMPORTANT: This is a UX-only guard. Real authorization is enforced
 * server-side by RBAC middleware. Never rely on this as a security boundary.
 *
 * @param {string[]} allowedRoles - Roles permitted to see the children
 * @param {React.ReactNode} children - Content to conditionally render
 * @param {React.ReactNode} [fallback=null] - Optional content for unauthorized users
 *
 * @example
 * <RoleGuard allowedRoles={['admin']}>
 *   <AdminOnlyButton />
 * </RoleGuard>
 */
const RoleGuard = ({ allowedRoles = [], children, fallback = null }) => {
  const user = useSelector(selectCurrentUser);

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback;
  }

  return children;
};

export default RoleGuard;
