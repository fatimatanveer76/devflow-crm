import { verifyAccessToken } from '../services/jwt.service.js';
import { User } from '../database/models/index.js';

/**
 * Middleware to authenticate requests via Bearer JWT access token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing.',
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh your session.',
        });
      }
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Invalid authentication token.',
      });
    }

    // Verify user exists and is currently active
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        code: 'USER_INACTIVE',
        message: 'User account is inactive or no longer exists.',
      });
    }

    // Attach authenticated identity to request
    req.user = user.toJSON();
    req.userId = user.id;

    next();
  } catch (error) {
    next(error);
  }
};
