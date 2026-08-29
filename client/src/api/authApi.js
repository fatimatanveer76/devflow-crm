import axiosClient from './axiosClient';

/**
 * Authentication API Service
 */
export const authApi = {
  /**
   * Registers a new user account
   * @param {Object} data { name, email, password, role }
   */
  register: (data) => axiosClient.post('/auth/register', data),

  /**
   * Authenticates user credentials
   * @param {Object} data { email, password }
   */
  login: (data) => axiosClient.post('/auth/login', data),

  /**
   * Refreshes access token using HTTP-only cookie
   */
  refresh: () => axiosClient.post('/auth/refresh'),

  /**
   * Logs out the user and invalidates session
   */
  logout: () => axiosClient.post('/auth/logout'),

  /**
   * Retrieves profile of currently authenticated user
   */
  getMe: () => axiosClient.get('/auth/me'),
};

export default authApi;
