import { ROLES } from '../config/roles.js';

/**
 * Enforces client role and binds tenant identity to req.clientId.
 * Prevents non-clients from entering the portal and strictly prevents
 * client identity spoofing by reading solely from the authenticated session.
 */
export const requireClientRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required to access the client portal.',
      code: 'UNAUTHORIZED',
    });
  }

  if (req.user.role !== ROLES.CLIENT) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. The Client Portal is reserved exclusively for verified client accounts.',
      code: 'PORTAL_CLIENT_REQUIRED',
    });
  }

  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Your client account is currently inactive. Please contact support.',
      code: 'ACCOUNT_INACTIVE',
    });
  }

  // Bind verified tenant identity to request object
  req.clientId = req.user.id;
  next();
};

export default { requireClientRole };
