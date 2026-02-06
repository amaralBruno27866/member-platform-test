/**
 * Global Error Handler
 * Handles API errors and provides user-friendly feedback
 */

import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiError, type ApiErrorResponse } from '@/types/errors';
import { getErrorMessage, requiresLogout, isCriticalError } from './errorMessages';

/**
 * Extract error information from Axios error
 */
export function extractErrorInfo(error: unknown): { code: number; message: string; httpStatus?: number } {
  // Check if it's an Axios error with response
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    if (axiosError.response?.data) {
      const { code, message } = axiosError.response.data;
      const httpStatus = axiosError.response.status;
      
      // If backend didn't provide a code, use HTTP status as code
      const errorCode = code || httpStatus || 0;
      
      return { 
        code: errorCode, 
        message: message || 'Unknown error',
        httpStatus 
      };
    }
    
    // If we have a response but no data, use HTTP status
    if (axiosError.response) {
      return {
        code: axiosError.response.status,
        message: axiosError.response.statusText || 'Unknown error',
        httpStatus: axiosError.response.status
      };
    }
  }

  // Fallback for other errors
  if (error instanceof Error) {
    return { code: 0, message: error.message };
  }

  return { code: 0, message: 'Unknown error occurred' };
}

/**
 * Handle API error globally
 * Shows toast notification and handles special cases (logout, etc.)
 */
export function handleApiError(error: unknown, customMessage?: string): ApiError {
  const { code } = extractErrorInfo(error);
  
  // Get user-friendly error message
  const errorMessage = getErrorMessage(code, customMessage);
  
  // Check if requires logout
  if (requiresLogout(code)) {
    toast.error(errorMessage, {
      duration: 5000,
      description: 'You will be redirected to the login page',
    });
    
    // Clear session data (tab-specific)
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('role');
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);
  } else if (isCriticalError(code)) {
    // Critical errors get more prominent notification
    toast.error(errorMessage, {
      duration: 8000,
      description: 'If the problem persists, please contact support',
    });
  } else {
    // Standard error notification
    toast.error(errorMessage, {
      duration: 4000,
    });
  }
  
  // Return ApiError for further handling if needed
  return new ApiError(code, errorMessage);
}

/**
 * Handle specific error scenarios
 */
export const errorHandlers = {
  /**
   * Login error handler
   */
  login: (error: unknown) => {
    const { code } = extractErrorInfo(error);
    
    // Custom messages for login-specific errors
    const loginMessages: Record<number, string> = {
      1003: 'Invalid email or password. Please check your credentials',
      1006: 'Your account has been locked. Please contact support',
      1009: 'Account inactive. Please check your email for activation',
    };
    
    const customMessage = loginMessages[code];
    return handleApiError(error, customMessage);
  },

  /**
   * Registration error handler
   */
  registration: (error: unknown) => {
    const { code } = extractErrorInfo(error);
    
    const registrationMessages: Record<number, string> = {
      1004: 'This email is already registered. Please try logging in',
      1005: 'This phone number is already registered',
      2002: 'Invalid email. Please check the format',
      2003: 'Invalid phone number. Use the format: (XX) XXXXX-XXXX',
    };
    
    const customMessage = registrationMessages[code];
    return handleApiError(error, customMessage);
  },

  /**
   * Generic CRUD error handler
   */
  crud: (error: unknown, operation: 'create' | 'update' | 'delete') => {
    const { code } = extractErrorInfo(error);
    
    const operationMessages: Record<string, Record<number, string>> = {
      create: {
        3002: 'This record already exists',
        2001: 'Invalid data. Please check all fields',
      },
      update: {
        5001: 'Record not found',
        3001: 'You do not have permission to edit this record',
      },
      delete: {
        5001: 'Record not found',
        3001: 'You do not have permission to delete this record',
      },
    };
    
    const customMessage = operationMessages[operation]?.[code];
    return handleApiError(error, customMessage);
  },
};
