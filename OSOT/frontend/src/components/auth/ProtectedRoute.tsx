import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { isStaffUser, canAccessAdminDashboard } from '@/utils/userPermissions';
import { useUserProfile } from '@/hooks/useUserProfile';

interface ProtectedRouteProps {
  requireStaff?: boolean;
  requireAdminPrivileges?: boolean;
  minPrivilege?: number; // 1=OWNER(menor), 2=ADMIN(médio), 3=MAIN(maior) - Higher number = Higher privilege
}

export default function ProtectedRoute({ 
  requireStaff = false,
  requireAdminPrivileges = false,
  minPrivilege
}: ProtectedRouteProps = {}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  
  // Use cached user profile with React Query
  const { data: profile, isLoading, error } = useUserProfile();

  useEffect(() => {
    async function checkAuth() {
      const currentPath = window.location.pathname;
      const hasToken = !!sessionStorage.getItem('access_token');
      
      console.log('🔒 [ProtectedRoute] Auth Check Started:', {
        path: currentPath,
        requireStaff,
        requireAdminPrivileges,
        minPrivilege,
        isLoading,
        hasProfile: !!profile,
        hasError: !!error,
        hasToken,
        tokenPreview: hasToken ? sessionStorage.getItem('access_token')?.substring(0, 20) + '...' : 'NONE',
      });

      // Basic authentication check
      const isAuthenticated = authService.isAuthenticated();
      
      if (!isAuthenticated) {
        console.log('❌ [ProtectedRoute] Not authenticated - will redirect');
        setAuthorized(false);
        return;
      }
      
      console.log('✅ [ProtectedRoute] Is authenticated');

      // If no special requirements, user is authorized
      if (!requireStaff && !requireAdminPrivileges && minPrivilege === undefined) {
        console.log('✅ [ProtectedRoute] No special requirements - authorized');
        setAuthorized(true);
        return;
      }

      // Wait for profile to load first if STAFF check is required
      // (we need the profile to check account_group for STAFF status)
      if (isLoading) {
        console.log('⏳ [ProtectedRoute] Profile loading...');
        return; // Keep loading state
      }

      if (error || !profile) {
        console.warn('⚠️ [ProtectedRoute] Profile fetch failed');
        setAuthorized(false);
        return;
      }

      console.log('👤 Profile loaded:', {
        account_group: profile.osot_account_group,
        privilege: profile.osot_privilege,
        isStaff: profile.osot_account_group === 4  // STAFF = 4 (backend real value)
      });

      // Check if route requires STAFF first
      if (requireStaff && !isStaffUser(profile)) {
        console.log('❌ STAFF required but user is not STAFF (account_group:', profile.osot_account_group, ')');
        setAuthorized(false);
        return;
      }

      // Check privilege level (1=OWNER[menor], 2=ADMIN[médio], 3=MAIN[maior])
      // Higher number = Higher privilege (3 > 2 > 1)
      if (minPrivilege !== undefined) {
        const userPrivilege = profile.osot_privilege || 1; // Default to lowest privilege (OWNER)
        console.log(`🔑 [ProtectedRoute] Privilege check: ${userPrivilege} >= ${minPrivilege}?`);
        
        if (userPrivilege < minPrivilege) {
          // User has lower privilege than required
          console.log(`❌ [ProtectedRoute] Insufficient privilege: ${userPrivilege} < ${minPrivilege}`);
          setAuthorized(false);
          return;
        }
        
        console.log(`✅ [ProtectedRoute] Privilege check passed: ${userPrivilege} >= ${minPrivilege}`);
      }

      // Check if route requires admin privileges (STAFF + specific privilege level)
      if (requireAdminPrivileges && !canAccessAdminDashboard(profile)) {
        console.log('❌ Admin privileges required but user does not have them');
        setAuthorized(false);
        return;
      }

      console.log('✅ [ProtectedRoute] All checks passed - authorized');
      setAuthorized(true);
    }

    checkAuth();
  }, [requireStaff, requireAdminPrivileges, minPrivilege, profile, isLoading, error]);

  // 🎨 DEBUG: Log rendering decision
  console.log('🎨 [ProtectedRoute] Rendering decision:', {
    authorized,
    isLoading,
    willRedirect: authorized === false,
    path: window.location.pathname,
  });

  // Show loading state
  if (isLoading || authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    // Redirect to login if not authenticated
    if (!authService.isAuthenticated()) {
      return <Navigate to="/auth/login" replace />;
    }
    
    // Redirect to regular dashboard if authenticated but not authorized
    if (requireStaff || requireAdminPrivileges) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
