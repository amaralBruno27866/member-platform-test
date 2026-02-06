import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Settings, BarChart } from 'lucide-react';
import { authService } from '@/services/authService';
import { canAccessAdminDashboard, getDashboardRoute } from '@/utils/userPermissions';
import type { UserProfile } from '@/utils/userPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAccess() {
      try {
        const profile = await authService.getUserProfile();
        
        if (!profile) {
          navigate('/auth/login');
          return;
        }

        // Verify user is STAFF with admin privileges
        if (!canAccessAdminDashboard(profile)) {
          const dashboardRoute = getDashboardRoute(profile);
          navigate(dashboardRoute); // Redirect to appropriate dashboard
          return;
        }
        
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        navigate('/auth/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome, {userProfile.osot_first_name} {userProfile.osot_last_name}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✓ Operational</div>
            <p className="text-xs text-muted-foreground">
              All systems normal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
          <CardHeader>
            <Users className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Create, edit, and manage user accounts across all groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Manage Users</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/reports')}>
          <CardHeader>
            <BarChart className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              View analytics, statistics, and generate reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Reports</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/settings')}>
          <CardHeader>
            <Settings className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure system settings and organization preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Settings</Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/users/create')}
          >
            <Users className="mr-2 h-4 w-4" />
            Create New User
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/approvals')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Review Pending Approvals
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/products')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Products
          </Button>
        </CardContent>
      </Card>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Organization:</span>
            <span className="font-medium">{authService.getOrganizationName() || 'OSOT'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Organization Slug:</span>
            <span className="font-medium">{authService.getOrganizationSlug() || 'osot'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your Role:</span>
            <span className="font-medium">STAFF (Admin)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Privilege Level:</span>
            <span className="font-medium">MAIN (Full Access)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
