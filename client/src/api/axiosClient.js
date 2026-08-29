import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Phase 1 Foundation: Request pre-processing hook
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Return standard response data directly
    return response.data;
  },
  (error) => {
    // Standardize error payload
    const errorResponse = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected network error occurred.',
      errors: error.response?.data?.errors || [],
      status: error.response?.status || 500,
    };
    return Promise.reject(errorResponse);
  }
);

export default axiosClient;
