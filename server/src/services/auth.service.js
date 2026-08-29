import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { User, RefreshToken } from '../database/models/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from './jwt.service.js';

export class AuthService {
  /**
   * Registers a new user account
   */
  static async register({ name, email, password, role }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
      paranoid: false,
    });

    if (existingUser) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // Hash password securely
    const password_hash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Create user record
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      role: role || 'user',
      is_active: true,
      refresh_token_version: 0,
    });

    // Generate token pair
    const family = crypto.randomUUID ? crypto.randomUUID() : undefined;
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      id: user.id,
      tokenVersion: user.refresh_token_version,
      family,
    });

    // Store refresh token
    const token_hash = hashToken(refreshToken);
    const expires_at = new Date(Date.now() + config.cookie.maxAge);

    await RefreshToken.create({
      user_id: user.id,
      token_hash,
      family,
      expires_at,
      is_revoked: false,
    });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticates user credentials and issues tokens
   */
  static async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Query user with password hash explicitly included
    const user = await User.scope('withPassword').findOne({
      where: { email: normalizedEmail },
    });

    if (!user || !user.is_active) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Verify password hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Generate token pair
    const family = crypto.randomUUID ? crypto.randomUUID() : undefined;
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      id: user.id,
      tokenVersion: user.refresh_token_version,
      family,
    });

    // Store refresh token
    const token_hash = hashToken(refreshToken);
    const expires_at = new Date(Date.now() + config.cookie.maxAge);

    await RefreshToken.create({
      user_id: user.id,
      token_hash,
      family,
      expires_at,
      is_revoked: false,
    });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes access token using a valid HTTP-only refresh token with rotation
   */
  static async refresh({ refreshToken }) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 401;
      error.code = 'REFRESH_TOKEN_REQUIRED';
      throw error;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    // Find user
    const user = await User.findByPk(payload.id);
    if (!user || !user.is_active) {
      const error = new Error('User account is inactive or not found.');
      error.statusCode = 401;
      error.code = 'USER_INACTIVE';
      throw error;
    }

    // Check token version
    if (user.refresh_token_version !== payload.tokenVersion) {
      const error = new Error('Refresh token has been revoked.');
      error.statusCode = 401;
      error.code = 'TOKEN_REVOKED';
      throw error;
    }

    // Check refresh token record
    const incomingTokenHash = hashToken(refreshToken);
    const tokenRecord = await RefreshToken.findOne({
      where: {
        token_hash: incomingTokenHash,
        user_id: user.id,
      },
    });

    // Handle token reuse or revoked token
    if (!tokenRecord || tokenRecord.is_revoked) {
      // If a revoked token is presented, revoke all tokens in family to prevent hijack
      if (payload.family) {
        await RefreshToken.update(
          { is_revoked: true },
          { where: { family: payload.family } }
        );
      }
      const error = new Error('Invalid or compromised refresh token.');
      error.statusCode = 401;
      error.code = 'TOKEN_REUSE_DETECTED';
      throw error;
    }

    if (new Date() > new Date(tokenRecord.expires_at)) {
      await tokenRecord.update({ is_revoked: true });
      const error = new Error('Refresh token has expired.');
      error.statusCode = 401;
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }

    // Rotate: Revoke the old token record
    await tokenRecord.update({ is_revoked: true });

    // Issue new token pair with same family
    const family = payload.family || tokenRecord.family;
    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = signRefreshToken({
      id: user.id,
      tokenVersion: user.refresh_token_version,
      family,
    });

    // Store new refresh token record
    const newTokenHash = hashToken(newRefreshToken);
    const expires_at = new Date(Date.now() + config.cookie.maxAge);

    await RefreshToken.create({
      user_id: user.id,
      token_hash: newTokenHash,
      family,
      expires_at,
      is_revoked: false,
    });

    return {
      user: user.toJSON(),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logs out user and revokes the active refresh token
   */
  static async logout({ refreshToken, userId }) {
    if (refreshToken) {
      const incomingTokenHash = hashToken(refreshToken);
      await RefreshToken.update(
        { is_revoked: true },
        { where: { token_hash: incomingTokenHash } }
      );
    } else if (userId) {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId } }
      );
    }
    return { success: true };
  }

  /**
   * Retrieves profile for current authenticated user
   */
  static async getMe(userId) {
    const user = await User.findByPk(userId);
    if (!user || !user.is_active) {
      const error = new Error('User profile not found or account is deactivated.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    return user.toJSON();
  }
}
