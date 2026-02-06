import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users,
  Menu, 
  X,
  LogOut,
  CreditCard,
  Package,
  Megaphone,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  FileText,
  Briefcase,
  BookOpen,
  MessageSquare,
  Link as LinkIcon,
  Building2,
  ChevronDown,
  ChevronRight,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';
import { useQueryClient } from '@tanstack/react-query';
import { DoorTransition } from '@/components/auth/DoorTransition';
import { useAuthLayoutContext } from '@/contexts/AuthLayoutContext';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Admin Navigation Structure
 */
const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  {
    name: 'Users',
    icon: Users,
    children: [
      {
        name: 'OT/OTA',
        children: [
          { name: 'Profiles', href: '/admin/users/ot-ota/profiles' },
          { name: 'Address', href: '/admin/users/ot-ota/address' },
          { name: 'Contact', href: '/admin/users/ot-ota/contact' },
          { name: 'Identity', href: '/admin/users/ot-ota/identity' },
          { name: 'Education', href: '/admin/users/ot-ota/education' },
          { name: 'Management', href: '/admin/users/ot-ota/management' },
        ],
      },
      {
        name: 'Affiliate',
        children: [
          { name: 'Profiles', href: '/admin/users/affiliate/profiles' },
          { name: 'Address', href: '/admin/users/affiliate/address' },
          { name: 'Contact', href: '/admin/users/affiliate/contact' },
          { name: 'Management', href: '/admin/users/affiliate/management' },
        ],
      },
    ],
  },
  { name: 'Membership', href: '/admin/membership', icon: CreditCard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Advocacy', href: '/admin/advocacy', icon: Megaphone },
  { name: 'Professional Development', href: '/admin/professional-development', icon: GraduationCap },
  { name: 'Events', href: '/admin/events', icon: CalendarDays },
  { name: 'Advertising', href: '/admin/advertising', icon: TrendingUp },
  { name: 'Practice Resources', href: '/admin/practice-resources', icon: FileText },
  { name: 'Career', href: '/admin/career', icon: Briefcase },
  { name: 'Documentation', href: '/admin/documentation', icon: BookOpen },
  { name: 'Communication', href: '/admin/communication', icon: MessageSquare },
  { name: 'Links', href: '/admin/links', icon: LinkIcon },
  { name: 'Organization Settings', href: '/admin/organization-settings', icon: Building2 },
];

export default function AdminDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use cached user profile with React Query
  const { data: userProfile } = useUserProfile();

  // Auto-expand menus when on a child page
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => {
          if ('children' in child && child.children) {
            return child.children.some((subChild) => 
              location.pathname.startsWith(subChild.href)
            );
          }
          return false;
        });
        if (hasActiveChild) {
          setExpandedMenus((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

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
              <div>
                <h1 className="text-xl font-bold text-sidebar-text">OSOT</h1>
                <p className="text-xs text-sidebar-text-muted">Admin Panel</p>
              </div>
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
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-sidebar-text-muted bg-sidebar-bg hover:bg-sidebar-hover focus:outline-none focus:bg-sidebar-hover transition-colors rounded-md"
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </div>
                        {expandedMenus[item.name] ? (
                          <ChevronDown className="h-4 w-4 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                      </button>
                      {expandedMenus[item.name] && (
                        <div className="ml-8 space-y-1 bg-sidebar-bg">
                          {item.children.map((child) => (
                            <div key={child.name}>
                              {'children' in child && child.children ? (
                                <div className="space-y-1">
                                  <button
                                    onClick={() => toggleMenu(child.name)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-sidebar-text-muted hover:bg-sidebar-hover rounded-md transition-colors"
                                  >
                                    {child.name}
                                    {expandedMenus[child.name] ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </button>
                                  {expandedMenus[child.name] && (
                                    <div className="ml-4 space-y-1">
                                      {child.children.map((subChild) => (
                                        <Link
                                          key={subChild.name}
                                          to={subChild.href}
                                          onClick={() => setSidebarOpen(false)}
                                          className={`
                                            block px-3 py-2 text-sm rounded-md transition-colors
                                            ${isActiveRoute(subChild.href)
                                              ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium'
                                              : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                                            }
                                          `}
                                        >
                                          {subChild.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Link
                                  to={'href' in child && typeof child.href === 'string' ? child.href : '#'}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`
                                    block px-3 py-2 text-sm rounded-md transition-colors
                                    ${'href' in child && typeof child.href === 'string' && isActiveRoute(child.href)
                                      ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium'
                                      : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                                    }
                                  `}
                                >
                                  {child.name}
                                </Link>
                              )}
                            </div>
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
              {/* Account Type Badge - STAFF */}
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <UserCircle className="h-3 w-3 mr-1" />
                  Staff
                </span>
              </div>
              <p className="font-medium text-sidebar-text text-sm">
                {userProfile ? `${userProfile.osot_first_name} ${userProfile.osot_last_name}` : 'Loading...'}
              </p>
              <p className="text-sidebar-text-muted text-sm">
                {userProfile?.osot_email || 'Loading...'}
              </p>
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
            <Link to="/admin/dashboard" className="flex items-center gap-2 lg:hidden">
              <img src="/osot.svg" alt="OSOT" className="h-8 w-auto" />
              <div>
                <h1 className="text-lg font-bold text-header-text">OSOT</h1>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </Link>

            {/* Right: Organization info */}
            <div className="hidden lg:flex items-center gap-6 ml-auto">
              {/* Organization Name */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-info-label" />
                <div className="text-xs">
                  <p className="text-info-label">Organization</p>
                  <p className="font-semibold text-info-value">
                    {authService.getOrganizationName() || 'OSOT'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile: User icon */}
            <div className="flex items-center lg:hidden">
              <UserCircle className="h-6 w-6 text-muted-foreground" />
            </div>
          </header>

          {/* Page content - Add margin-top to position below fixed header */}
          <main className="flex-1 overflow-y-auto mt-16 bg-content-bg">
            <div className="p-4 lg:p-6 h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DoorTransition>
  );
}
