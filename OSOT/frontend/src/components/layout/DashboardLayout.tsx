import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  User, 
  Menu, 
  X,
  LogOut,
  Calendar,
  Shield,
  CreditCard,
  BadgeCheck,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';
import { useAccount } from '@/hooks/useAccount';
import { useEducation } from '@/hooks/useEducation';
import { useMembershipExpiration, getRenewalColor, formatDaysRemaining, shouldShowRenewalDays } from '@/hooks/useMembershipExpiration';
import { useQueryClient } from '@tanstack/react-query';
import NotificationBar from '@/components/layout/NotificationBar';
import BottomInfoBar from '@/components/layout/BottomInfoBar';
import { DoorTransition } from '@/components/auth/DoorTransition';
import { useAuthLayoutContext } from '@/contexts/AuthLayoutContext';

/**
 * Extracts numeric ID from osot_account_id format (e.g., "osot-1234567" -> "1234567")
 */
const extractNumericId = (accountId: string): string => {
  const match = accountId.match(/\d+/);
  return match ? match[0].replace(/^0+/, '') || '0' : accountId; // Remove leading zeros, keep at least one zero
};

const navigation = [
  { name: 'Dashboard', href: '/user/dashboard', icon: Home },
  {
    name: 'Profile',
    icon: User,
    children: [
      { name: 'Account', href: '/user/profile/account' },
      { name: 'Address', href: '/user/profile/address' },
      { name: 'Contact', href: '/user/profile/contact' },
      { name: 'Identity', href: '/user/profile/identity' },
      { name: 'Education', href: '/user/profile/education' },
    ],
  },
  { name: 'Membership', href: '/user/membership', icon: CreditCard },
  { name: 'Insurance', href: '/user/insurance', icon: Shield },
  { name: 'Products', href: '/user/products', icon: Package },
  { name: 'Products Management', href: '/admin/products', icon: Package, adminOnly: true },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: account } = useAccount();
  const { data: education } = useEducation();
  const { data: membershipExpiration } = useMembershipExpiration();

  // Auto-expand Profile menu when on a profile page
  useEffect(() => {
    if (location.pathname.startsWith('/user/profile')) {
      setProfileExpanded(true);
    }
  }, [location.pathname]);

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const { triggerDoorClosing, isDoorClosing } = useAuthLayoutContext();

  const handleLogout = () => {
    if (triggerDoorClosing) {
      triggerDoorClosing();
      setTimeout(() => {
        queryClient.clear();
        authService.logout();
        navigate('/auth/login');
      }, 800);
    } else {
      queryClient.clear();
      authService.logout();
      navigate('/auth/login');
    }
  };

  return (
    <DoorTransition isOpening={false} isClosing={isDoorClosing || false}>
    <div className="min-h-screen bg-content-bg flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src="/osot.svg" alt="OSOT" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-sidebar-text">OSOT</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden bg-sidebar-bg hover:bg-sidebar-hover"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-5 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation
              .filter((item) => {
                // Filter out admin-only items if user is not Admin/Main
                if (item.adminOnly) {
                  return account?.osot_privilege === 'Admin' || account?.osot_privilege === 'Main';
                }
                return true;
              })
              .map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => setProfileExpanded(!profileExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-sidebar-text-muted bg-sidebar-bg hover:bg-sidebar-hover focus:outline-none focus:bg-sidebar-hover focus-visible:bg-sidebar-hover active:bg-sidebar-hover transition-colors rounded-md"
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      {profileExpanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform" />
                      )}
                    </button>
                    {profileExpanded && (
                      <div className="ml-8 space-y-1 bg-sidebar-bg">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block px-3 py-2 text-sm rounded-md transition-colors
                              ${isActiveRoute(child.href)
                                ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium'
                                : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                              }
                            `}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href!}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-3 py-2 text-sm rounded-md transition-colors
                      ${isActiveRoute(item.href!)
                        ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium'
                        : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* User menu at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar-bg">
          <div className="mb-3">
            {/* Account Type Badge */}
            {account && (
              <div className="mb-2">
                <span className={
                  `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    // Check if has OT education (osot_coto_status exists means OT)
                    education && 'osot_coto_status' in education
                      ? 'bg-brand-100 text-brand-800'
                      : 'bg-purple-100 text-purple-800'
                  }`
                }>
                  {education && 'osot_coto_status' in education
                    ? 'Occupational Therapist' 
                    : 'Occupational Therapist Assistant'}
                </span>
              </div>
            )}
            <p className="font-medium text-sidebar-text text-sm">
              {account ? `${account.osot_first_name} ${account.osot_last_name}` : 'Loading...'}
            </p>
            <p className="text-sidebar-text-muted text-sm">{account?.osot_email || 'Loading...'}</p>
          </div>
          <button 
            className="w-full h-8 px-3 text-xs rounded-md bg-sidebar-bg hover:bg-sidebar-hover border border-sidebar-border text-sidebar-text-muted hover:text-sidebar-text transition-colors flex items-center justify-center"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header - Fixed on mobile */}
        <header className="bg-header-bg shadow-sm border-b border-header-border h-16 flex items-center justify-between px-4 lg:px-6 fixed top-0 left-0 right-0 z-30 lg:left-64">
          {/* Left: Menu toggle (mobile only) */}
          <div className="flex items-center lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 bg-header-bg hover:bg-accent"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Center: Logo (mobile only) */}
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <img src="/osot.svg" alt="OSOT" className="h-8 w-auto" />
            <h1 className="text-lg font-bold text-header-text">OSOT</h1>
          </Link>

          {/* Notifications Area - desktop only, fills remaining space */}
          <div className="hidden lg:flex flex-1 lg:mr-6">
            <NotificationBar mode="full" />
          </div>

          {/* Right: Notification icon (mobile only) */}
          <div className="flex items-center lg:hidden">
            <NotificationBar mode="icon-only" />
          </div>

          {/* Right: Header Info - Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {/* User ID */}
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-info-label" />
              <div className="text-xs text-center">
                <p className="text-info-label">User ID</p>
                <p className="font-semibold text-info-value">
                  {account?.osot_account_id ? extractNumericId(account.osot_account_id) : 'Loading...'}
                </p>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-green-500" />
              <div className="text-xs text-center">
                <p className="text-info-label">Account</p>
                <p className="font-semibold text-green-600">{account?.osot_account_status || 'Loading...'}</p>
              </div>
            </div>

            {/* Membership Status */}
            <div className="flex items-center gap-2">
              <CreditCard className={`h-4 w-4 ${account?.osot_active_member ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="text-xs text-center">
                <p className="text-info-label">Membership</p>
                <p className={`font-semibold ${account?.osot_active_member ? 'text-green-600' : 'text-gray-400'}`}>
                  {account?.osot_active_member ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            {/* Days Until Renewal */}
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${
                shouldShowRenewalDays(membershipExpiration)
                  ? getRenewalColor(membershipExpiration!.daysRemaining).replace('text-', 'text-').replace('-600', '-500')
                  : account?.osot_active_member
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`} />
              <div className="text-xs text-center">
                <p className="text-info-label">Renewal</p>
                <p className={`font-semibold ${
                  shouldShowRenewalDays(membershipExpiration)
                    ? getRenewalColor(membershipExpiration!.daysRemaining)
                    : account?.osot_active_member
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}>
                  {shouldShowRenewalDays(membershipExpiration)
                    ? formatDaysRemaining(membershipExpiration!.daysRemaining)
                    : account?.osot_active_member
                    ? 'Active'
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Insurance Status */}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <div className="text-xs text-center">
                <p className="text-info-label">Insurance</p>
                <p className="font-semibold text-green-600">Covered</p>
              </div>
            </div>

            {/* Current Date */}
            <div className="flex items-center gap-2 pl-4 border-l border-header-border">
              <Calendar className="h-4 w-4 text-info-label" />
              <div className="text-xs">
                <p className="text-info-label">Today</p>
                <p className="font-semibold text-info-value">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content - Add margin-top to position below fixed header */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 mt-16 pb-20 lg:pb-6 bg-content-bg">
          <Outlet />
        </main>

        {/* Bottom Info Bar - Mobile Only */}
        <BottomInfoBar 
          accountId={account?.osot_account_id}
          accountStatus={account?.osot_account_status}
          activeMember={account?.osot_active_member}
          showInsurance={true}
        />
      </div>
    </div>
    </DoorTransition>
  );
}