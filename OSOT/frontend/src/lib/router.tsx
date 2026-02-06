import { createBrowserRouter, Navigate } from 'react-router-dom';
import ConditionalDashboardLayout from '../components/layout/ConditionalDashboardLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RegistrationErrorPage from '../pages/auth/RegistrationErrorPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/profile/ProfilePage';
import AccountPage from '../pages/profile/AccountPage';
import IdentityPage from '../pages/profile/IdentityPage';
import ContactPage from '../pages/profile/ContactPage';
import AddressPage from '../pages/profile/AddressPage';
import EducationPage from '../pages/education/EducationPage';
import MembershipPage from '../pages/membership/MembershipPage';
import RegisterMembershipPage from '../pages/membership/RegisterMembershipPage';
import { VerifyEmailPage } from '../pages/verification/VerifyEmailPage';
import { VerifyAffiliateEmailPage } from '../pages/verification/VerifyAffiliateEmailPage';
import { ApproveAccountPage } from '../pages/admin/ApproveAccountPage';
import { RejectAccountPage } from '../pages/admin/RejectAccountPage';
import { ApproveAffiliatePage } from '../pages/admin/ApproveAffiliatePage';
import { RejectAffiliatePage } from '../pages/admin/RejectAffiliatePage';
import ProductsStorePage from '../pages/products/ProductsStorePage';
import ProductsPage from '../pages/admin/ProductsPage';
import AdminDashboardLayout from '../components/layout/AdminDashboardLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AuthPagesLayout from '../pages/auth/AuthPagesLayout';

export const router = createBrowserRouter([
  {
    path: '/auth/login',
    element: <AuthPagesLayout />,
  },
  {
    path: '/auth/forgot-password',
    element: <AuthPagesLayout />,
  },
  {
    path: '/auth/register',
    element: <AuthPagesLayout />,
  },
  {
    path: '/auth/register/professional',
    element: <AuthPagesLayout />,
  },
  {
    path: '/auth/register/affiliate',
    element: <AuthPagesLayout />,
  },
  {
    path: '/auth/register/success/:sessionId',
    element: <AuthPagesLayout />,
  },
  {
    path: '/auth/register/duplicate-error',
    element: <AuthPagesLayout />,
  },
  {
    path: '/auth/reset-password',
    element: <AuthPagesLayout />,
  },
  {
    path: '/register/error',
    element: <RegistrationErrorPage />,
  },
  // Verify email routes (PUBLIC - no auth required)
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/verify-affiliate-email',
    element: <VerifyAffiliateEmailPage />,
  },
  // Admin approval/rejection routes (PUBLIC - token-based authentication)
  {
    path: '/admin/approve-account/:approvalToken',
    element: <ApproveAccountPage />,
  },
  {
    path: '/admin/reject-account/:rejectionToken',
    element: <RejectAccountPage />,
  },
  {
    path: '/admin/approve-affiliate/:approvalToken',
    element: <ApproveAffiliatePage />,
  },
  {
    path: '/admin/reject-affiliate/:rejectionToken',
    element: <RejectAffiliatePage />,
  },
  // Admin Dashboard Routes - Protected (STAFF + Privilege >= 2)
  {
    path: '/admin',
    element: <ProtectedRoute requireStaff={true} minPrivilege={2} />,
    children: [
      {
        path: '',
        element: <AdminDashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          // User Management Routes
          {
            path: 'users/ot-ota/profiles',
            element: <div>OT/OTA Profiles - Coming Soon</div>,
          },
          {
            path: 'users/ot-ota/address',
            element: <div>OT/OTA Address - Coming Soon</div>,
          },
          {
            path: 'users/ot-ota/contact',
            element: <div>OT/OTA Contact - Coming Soon</div>,
          },
          {
            path: 'users/ot-ota/identity',
            element: <div>OT/OTA Identity - Coming Soon</div>,
          },
          {
            path: 'users/ot-ota/education',
            element: <div>OT/OTA Education - Coming Soon</div>,
          },
          {
            path: 'users/ot-ota/management',
            element: <div>OT/OTA Management - Coming Soon</div>,
          },
          {
            path: 'users/affiliate/profiles',
            element: <div>Affiliate Profiles - Coming Soon</div>,
          },
          {
            path: 'users/affiliate/address',
            element: <div>Affiliate Address - Coming Soon</div>,
          },
          {
            path: 'users/affiliate/contact',
            element: <div>Affiliate Contact - Coming Soon</div>,
          },
          {
            path: 'users/affiliate/management',
            element: <div>Affiliate Management - Coming Soon</div>,
          },
          // Other Admin Routes
          {
            path: 'membership',
            element: <div>Membership Management - Coming Soon</div>,
          },
          {
            path: 'products',
            element: <ProductsPage />,
          },
          {
            path: 'advocacy',
            element: <div>Advocacy - Coming Soon</div>,
          },
          {
            path: 'professional-development',
            element: <div>Professional Development - Coming Soon</div>,
          },
          {
            path: 'events',
            element: <div>Events Management - Coming Soon</div>,
          },
          {
            path: 'advertising',
            element: <div>Advertising - Coming Soon</div>,
          },
          {
            path: 'practice-resources',
            element: <div>Practice Resources - Coming Soon</div>,
          },
          {
            path: 'career',
            element: <div>Career - Coming Soon</div>,
          },
          {
            path: 'documentation',
            element: <div>Documentation - Coming Soon</div>,
          },
          {
            path: 'communication',
            element: <div>Communication - Coming Soon</div>,
          },
          {
            path: 'links',
            element: <div>Links Management - Coming Soon</div>,
          },
          {
            path: 'organization-settings',
            element: <div>Organization Settings - Coming Soon</div>,
          },
          {
            path: 'settings',
            element: <div>Admin Settings - Coming Soon</div>,
          },
        ],
      },
    ],
  },
  // User Dashboard Routes - Protected (Privilege >= 1: OWNER)
  {
    path: '/user',
    element: <ProtectedRoute minPrivilege={1} />,
    children: [
      {
        path: '',
        element: <ConditionalDashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/user/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'profile',
            children: [
              {
                index: true,
                element: <ProfilePage />,
              },
              {
                path: 'account',
                element: <AccountPage />,
              },
              {
                path: 'address',
                element: <AddressPage />,
              },
              {
                path: 'contact',
                element: <ContactPage />,
              },
              {
                path: 'identity',
                element: <IdentityPage />,
              },
              {
                path: 'education',
                element: <EducationPage />,
              },
            ],
          },
          {
            path: 'membership',
            element: <MembershipPage />,
          },
          {
            path: 'membership/apply',
            element: <RegisterMembershipPage />,
          },
          {
            path: 'events',
            element: <DashboardPage />,
          },
          {
            path: 'insurance',
            element: <DashboardPage />,
          },
          {
            path: 'products',
            element: <ProductsStorePage />,
          },
        ],
      },
    ],
  },
  // Legacy dashboard route - redirects based on privilege
  {
    path: '/dashboard',
    element: <Navigate to="/user/dashboard" replace />,
  },
  {
    path: '/',
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/auth/login" replace />,
  },
]);