import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';

/**
 * Signs a short-lived access token
 * @param {Object} payload Payload containing user identification (id, email, role)
 * @returns {string} Signed JWT access token
 */
export const signAccessToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'user',
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: 'devflow-crm',
      audience: 'devflow-client',
    }
  );
};

/**
 * Signs a long-lived refresh token
 * @param {Object} payload Payload containing user id, token version, and unique family ID
 * @returns {string} Signed JWT refresh token
 */
export const signRefreshToken = (payload) => {
  const jti = crypto.randomUUID();
  return jwt.sign(
    {
      id: payload.id,
      tokenVersion: payload.tokenVersion ?? 0,
      family: payload.family || crypto.randomUUID(),
      jti,
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'devflow-crm',
      audience: 'devflow-refresh',
    }
  );
};

/**
 * Verifies and decodes an access token
 * @param {string} token Access token string
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'devflow-crm',
    audience: 'devflow-client',
  });
};

/**
 * Verifies and decodes a refresh token
 * @param {string} token Refresh token string
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'devflow-crm',
    audience: 'devflow-refresh',
  });
};

/**
 * Hashes a token using SHA-256 for secure database persistence
 * @param {string} token
 * @returns {string} Hex encoded hash
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
