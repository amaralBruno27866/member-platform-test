/**
 * API Client Configuration
 * Centralized axios instance with interceptors for authentication and error handling
 */

import axios from 'axios';

// Get API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds (increased for registration and email operations)
  validateStatus: (status) => {
    // Accept 2xx status codes including 202 Accepted
    return status >= 200 && status < 300;
  },
});

// Request interceptor - attach JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Use sessionStorage for tab-isolated sessions
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    // 🟢 DEBUG: Log successful requests
    console.log('✅ [API] Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
    });
    return response;
  },
  (error) => {
    // 🔴 DEBUG: Log EVERY error before any action
    console.log('🚨 [API INTERCEPTOR] Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      hasToken: !!sessionStorage.getItem('access_token'),
      tokenValue: sessionStorage.getItem('access_token')?.substring(0, 20) + '...',
    });

    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      console.log('🔴 [401 DETECTED] URL:', error.config?.url);
      console.log('🔴 [401 DETECTED] Will redirect in 1 second...');
      
      // Delay para ver o log antes do redirect
      setTimeout(() => {
        // Clear session data (tab-specific)
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userType');
        sessionStorage.removeItem('role');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }, 1000);
      
      return Promise.reject(error);
    }

    // For network errors or errors without response
    if (!error.response) {
      console.error('🌐 [API] Network error:', error);
    }
    
    // Re-throw error to be handled by calling code
    return Promise.reject(error);
  }
);
