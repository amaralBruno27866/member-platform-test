/**
 * Product Creation Orchestrator Hook
 * Manages Redis-based workflow for atomic product + target creation
 */

import { useState } from 'react';
import { api } from '@/lib/api';

// Type for axios error responses
interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: string[];
    };
  };
}

interface OrchestratorSession {
  sessionId: string;
  state: 'INITIATED' | 'PRODUCT_ADDED' | 'TARGET_CONFIGURED' | 'COMMITTED' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  expiresAt: string;
  operationId?: string;
}

interface CommitResult {
  success: boolean;
  productGuid?: string;
  productId?: string; // Alias for productGuid
  targetGuid?: string;
  productCode?: string;
  errors?: string[];
  message?: string;
  operationId?: string;
}

interface ProgressResponse {
  sessionId: string;
  state: string;
  steps: {
    productAdded: boolean;
    targetConfigured: boolean;
    committed: boolean;
  };
  errors: string[];
  canCommit: boolean;
}

export function useProductOrchestrator() {
  const [session, setSession] = useState<OrchestratorSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Step 1: Create Session
   * Initiates a new product creation workflow
   */
  const createSession = async (): Promise<OrchestratorSession> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<OrchestratorSession>('/private/products/orchestrate/session/create');
      setSession(data);
      return data;
    } catch (err: unknown) {
      const errorMsg = (err as ApiError).response?.data?.message || 'Failed to check progress';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Add Product Data
   * Validates and stores product data in Redis
   * @param productData - Product data to add
   * @param explicitSession - Optional session to use (overrides hook state)
   */
  const addProduct = async (productData: unknown, explicitSession?: OrchestratorSession): Promise<OrchestratorSession> => {
    const activeSession = explicitSession || session;
    if (!activeSession) throw new Error('No active session. Call createSession() first.');
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<OrchestratorSession>(
        `/private/products/orchestrate/session/${activeSession.sessionId}/product`,
        productData
      );
      setSession(data);
      return data;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errors = apiErr.response?.data?.errors || [apiErr.response?.data?.message || 'Product validation failed'];
      const errorMsg = errors.join(', ');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 3: Add Audience Target (Optional)
   * Configures target before creating in Dataverse
   * @param targetData - Target configuration data
   * @param explicitSession - Optional session to use (overrides hook state)
   */
  const addTarget = async (targetData: unknown, explicitSession?: OrchestratorSession): Promise<OrchestratorSession> => {
    const activeSession = explicitSession || session;
    if (!activeSession) throw new Error('No active session');
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<OrchestratorSession>(
        `/private/products/orchestrate/session/${activeSession.sessionId}/audience-target`,
        targetData
      );
      setSession(data);
      return data;
    } catch (err: unknown) {
      const errorMsg = (err as ApiError).response?.data?.message || 'Failed to add target configuration';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 4: Commit (Create in Dataverse)
   * Performs atomic creation with retry logic
   * @param explicitSession - Optional session to use (overrides hook state)
   */
  const commit = async (explicitSession?: OrchestratorSession): Promise<CommitResult> => {
    const activeSession = explicitSession || session;
    if (!activeSession) throw new Error('No active session');
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<CommitResult>(
        `/private/products/orchestrate/session/${activeSession.sessionId}/commit`
      );
      
      // Normalize productId (backend returns productGuid)
      if (data.productGuid && !data.productId) {
        data.productId = data.productGuid;
      }
      
      if (!data.success) {
        const errorMsg = data.errors?.join(', ') || data.message || 'Commit failed after 3 attempts';
        setError(errorMsg);
      } else {
        // Success - session will be cleaned up automatically
        setSession(null);
      }
      
      return data;
    } catch (err: unknown) {
      const errorMsg = (err as ApiError).response?.data?.message || 'Failed to commit product creation';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check Session Progress
   * Useful for debugging or showing status
   */
  const checkProgress = async (): Promise<ProgressResponse> => {
    if (!session) throw new Error('No active session');
    
    try {
      const { data } = await api.get<ProgressResponse>(
        `/private/products/orchestrate/session/${session.sessionId}/progress`
      );
      return data;
    } catch (err: unknown) {
      const errorMsg = (err as ApiError).response?.data?.message || 'Failed to check progress';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  /**
   * Reset Hook State
   * Useful when starting a new product after completion
   */
  const reset = () => {
    setSession(null);
    setError(null);
    setLoading(false);
  };

  return {
    // State
    session,
    loading,
    error,
    
    // Actions
    createSession,
    addProduct,
    addTarget,
    commit,
    checkProgress,
    reset,
  };
}

export type UseProductOrchestratorReturn = ReturnType<typeof useProductOrchestrator>;
