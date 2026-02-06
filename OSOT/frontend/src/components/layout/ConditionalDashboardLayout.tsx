import { authService } from '@/services/authService';
import DashboardLayout from './DashboardLayout';
import AffiliateDashboardLayout from '@/components/layout/AffiliateDashboardLayout';

/**
 * Conditional Layout Wrapper
 * Renders the appropriate dashboard layout based on user type
 */
export default function ConditionalDashboardLayout() {
  const userType = authService.getUserType();

  if (userType === 'affiliate') {
    return <AffiliateDashboardLayout />;
  }

  // Default to person/professional dashboard
  return <DashboardLayout />;
}
