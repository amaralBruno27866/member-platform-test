import { api } from '@/lib/api';
import type { User, LoginCredentials, AuthResponse } from '../types/auth';
import type { CompleteUserRegistrationDto, OrchestratorResponseDto } from '../types/registration';
import { getOrganizationSlug } from '@/utils/getOrganizationSlug';
import type { UserProfile } from '@/utils/userPermissions';

class AuthService {
  async register(data: CompleteUserRegistrationDto): Promise<OrchestratorResponseDto> {
    const response = await api.post<OrchestratorResponseDto>('/public/orchestrator/register', data);
    return response.data;
  }

  async login(credentials: Omit<LoginCredentials, 'organizationSlug'>): Promise<AuthResponse> {
    // Automatically detect organization slug from hostname
    const organizationSlug = getOrganizationSlug();
    
    // Add organizationSlug to the request payload
    const payload: LoginCredentials = {
      ...credentials,
      organizationSlug,
    };
    
    // Debug log - remover após testes
    console.log('🔐 Login payload:', { 
      ...payload, 
      osot_password: '***hidden***' 
    });
    
    const response = await api.post<AuthResponse>('/auth/login', payload);
    
    if (response.data.access_token) {
      // Use sessionStorage for tab-isolated sessions (allows multiple users in different tabs)
      sessionStorage.setItem('access_token', response.data.access_token);
      if (response.data.user) {
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Store organization information separately for easy access
        if (response.data.user.organizationName) {
          sessionStorage.setItem('organizationName', response.data.user.organizationName);
        }
        if (response.data.user.organizationSlug) {
          sessionStorage.setItem('organizationSlug', response.data.user.organizationSlug);
        }
      }
      if (response.data.userType) {
        sessionStorage.setItem('userType', response.data.userType);
      }
      if (response.data.role) {
        sessionStorage.setItem('role', response.data.role);
      }
      if (response.data.privilege !== undefined) {
        sessionStorage.setItem('privilege', String(response.data.privilege));
      }
    }
    
    return response.data;
  }

  logout() {
    // Clear session data (tab-specific)
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('privilege');
    sessionStorage.removeItem('organizationName');
    sessionStorage.removeItem('organizationSlug');
    
    // Keep saved_email in localStorage (user preference, shared across tabs)
    // localStorage.removeItem('saved_email'); // Don't clear - this is a user preference
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getUserType(): string | null {
    return sessionStorage.getItem('userType');
  }

  getUserRole(): string | null {
    return sessionStorage.getItem('role');
  }

  getUserPrivilege(): number | null {
    const privilege = sessionStorage.getItem('privilege');
    return privilege ? Number(privilege) : null;
  }

  getOrganizationName(): string | null {
    return sessionStorage.getItem('organizationName');
  }

  getOrganizationSlug(): string | null {
    return sessionStorage.getItem('organizationSlug');
  }

  getToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;
      // Você pode adicionar uma chamada à API para verificar o token se necessário
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch complete user profile including account_group
   * Endpoint: GET /api/accounts/me
   * Required for STAFF detection and role-based permissions
   */
  async fetchUserProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/api/accounts/me');
    
    // Store profile in sessionStorage for quick access
    sessionStorage.setItem('userProfile', JSON.stringify(response.data));
    
    return response.data;
  }

  /**
   * Get cached user profile from sessionStorage
   * Falls back to fetching from API if not cached
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      // Try to get from cache first
      const cachedProfile = sessionStorage.getItem('userProfile');
      if (cachedProfile) {
        return JSON.parse(cachedProfile);
      }
      
      // Fetch from API if not cached
      return await this.fetchUserProfile();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Clear cached user profile
   * Call this after profile updates
   */
  clearProfileCache(): void {
    sessionStorage.removeItem('userProfile');
  }
}

export const authService = new AuthService();