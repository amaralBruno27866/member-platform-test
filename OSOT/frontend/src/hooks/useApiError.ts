/**
 * Custom React Hook for Error Handling
 * Provides easy-to-use error handling for React components
 */

import { useState, useCallback } from 'react';
import { handleApiError, errorHandlers } from '@/lib/errorHandler';
import type { ApiError } from '@/types/errors';

interface UseApiErrorReturn {
  error: ApiError | null;
  isError: boolean;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  handleError: (error: unknown, customMessage?: string) => ApiError;
  handleLoginError: (error: unknown) => ApiError;
  handleRegistrationError: (error: unknown) => ApiError;
  handleCrudError: (error: unknown, operation: 'create' | 'update' | 'delete') => ApiError;
}

/**
 * Hook for managing API errors in components
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { handleLoginError, clearError, error } = useApiError();
 * 
 *   const handleSubmit = async () => {
 *     try {
 *       await api.login(credentials);
 *     } catch (err) {
 *       handleLoginError(err);
 *     }
 *   };
 * 
 *   return <div>{error && <p>{error.message}</p>}</div>;
 * }
 * ```
 */
export function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: unknown, customMessage?: string) => {
    const apiError = handleApiError(err, customMessage);
    setError(apiError);
    return apiError;
  }, []);

  const handleLoginError = useCallback((err: unknown) => {
    const apiError = errorHandlers.login(err);
    setError(apiError);
    return apiError;
  }, []);

  const handleRegistrationError = useCallback((err: unknown) => {
    const apiError = errorHandlers.registration(err);
    setError(apiError);
    return apiError;
  }, []);

  const handleCrudError = useCallback((err: unknown, operation: 'create' | 'update' | 'delete') => {
    const apiError = errorHandlers.crud(err, operation);
    setError(apiError);
    return apiError;
  }, []);

  return {
    error,
    isError: !!error,
    setError,
    clearError,
    handleError,
    handleLoginError,
    handleRegistrationError,
    handleCrudError,
  };
}
