import { authService } from '@/services/authService';
import { Navigate } from 'react-router-dom';
import AffiliateProfilePage from '../affiliate/AffiliateProfilePage';

/**
 * Conditional Profile Page
 * For affiliates: Shows single-page profile with collapsible sections
 * For persons: Redirects to /profile/account (multi-page profile)
 */
export default function ProfilePage() {
  const userType = authService.getUserType();

  if (userType === 'affiliate') {
    return <AffiliateProfilePage />;
  }

  // For person/professional users, redirect to account page (multi-page structure)
  return <Navigate to="/profile/account" replace />;
}
