import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// =============================================================================
// CENTRALIZED API HANDLER - Task 4.6
// =============================================================================

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

// Custom error type for API errors
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

const TOKEN_KEY = 'token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// =============================================================================
// REQUEST INTERCEPTOR - Attach JWT Token
// =============================================================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach JWT token to all secured requests
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR - Error Handling & Token Refresh
// =============================================================================

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: number };

    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
        code: 'NETWORK_ERROR',
      } as ApiError);
    }

    const status = error.response.status;

    // Handle 401 Unauthorized - Token expired or invalid
    if (status === 401) {
      removeStoredToken();
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        console.warn('🔒 Session expired. Redirecting to login...');
        window.location.href = '/login';
      }
      
      return Promise.reject({
        message: 'Session expired. Please login again.',
        status: 401,
        code: 'UNAUTHORIZED',
      } as ApiError);
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (status === 403) {
      return Promise.reject({
        message: 'You do not have permission to perform this action.',
        status: 403,
        code: 'FORBIDDEN',
      } as ApiError);
    }

    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject({
        message: 'The requested resource was not found.',
        status: 404,
        code: 'NOT_FOUND',
      } as ApiError);
    }

    // Handle 500+ Server Errors with retry logic
    if (status >= 500) {
      const retryCount = originalRequest._retry || 0;
      
      if (retryCount < MAX_RETRIES) {
        originalRequest._retry = retryCount + 1;
        console.warn(`⚠️ Server error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return api(originalRequest);
      }

      return Promise.reject({
        message: 'Server error. Please try again later.',
        status: status,
        code: 'SERVER_ERROR',
      } as ApiError);
    }

    // Handle other errors
    const errorData = error.response.data as { error?: string; message?: string };
    return Promise.reject({
      message: errorData?.error || errorData?.message || 'An error occurred.',
      status: status,
      details: error.response.data,
    } as ApiError);
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if an error is an API error
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  );
};

/**
 * Get a user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export default api;
