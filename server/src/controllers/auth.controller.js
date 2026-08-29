import { config } from '../config/env.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Cookie options helper for secure HTTP-only refresh tokens
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
  maxAge: config.cookie.maxAge,
  path: '/',
});

/**
 * Sets the refresh token cookie on the response
 */
export const setRefreshTokenCookie = (res, token) => {
  res.cookie(config.cookie.name, token, getCookieOptions());
};

/**
 * Clears the refresh token cookie from the response
 */
export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(config.cookie.name, {
    ...getCookieOptions(),
    maxAge: 0,
  });
};

/**
 * Registers a new user account
 * @route POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.register({
      name,
      email,
      password,
      role,
    });

    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticates user credentials and initiates session
 * @route POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login({
      email,
      password,
    });

    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refreshes an access token using HTTP-only refresh cookie
 * @route POST /api/v1/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[config.cookie.name] || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_MISSING',
        message: 'No refresh token provided in cookies.',
      });
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await AuthService.refresh({
      refreshToken,
    });

    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
};

/**
 * Logs out user and invalidates session
 * @route POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[config.cookie.name] || req.body?.refreshToken;
    await AuthService.logout({
      refreshToken,
      userId: req.userId,
    });

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
};

/**
 * Retrieves the currently authenticated user's profile
 * @route GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.userId);
    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
