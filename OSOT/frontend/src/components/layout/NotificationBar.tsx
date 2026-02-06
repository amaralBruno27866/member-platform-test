import { Bell, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  persistent: boolean; // If true, shows every time until dismissed
  dismissible: boolean;
  createdAt: Date;
  viewedAt?: Date;
}

interface NotificationBarProps {
  mode?: 'full' | 'icon-only'; // full = desktop carousel, icon-only = mobile icon with dropdown
}

export default function NotificationBar({ mode = 'full' }: NotificationBarProps) {
  // Mock notifications - will be replaced with API data later
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      message: 'Your membership renewal is due in 30 days',
      type: 'warning',
      priority: 'high',
      persistent: true,
      dismissible: true,
      createdAt: new Date('2025-11-02'),
    },
    {
      id: '2',
      message: 'New continuing education courses available for 2025',
      type: 'info',
      priority: 'medium',
      persistent: false,
      dismissible: true,
      createdAt: new Date('2025-11-28'),
    },
    {
      id: '3',
      message: 'Your profile information needs to be updated',
      type: 'warning',
      priority: 'medium',
      persistent: false,
      dismissible: true,
      createdAt: new Date('2025-11-25'),
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Mark as viewed when displayed
  useEffect(() => {
    if (notifications.length > 0 && currentIndex < notifications.length) {
      const current = notifications[currentIndex];
      if (!current.viewedAt) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === current.id ? { ...n, viewedAt: new Date() } : n
          )
        );
      }
    }
  }, [currentIndex, notifications]);

  // Auto-dismiss after 60 seconds (only non-persistent)
  useEffect(() => {
    if (notifications.length === 0) return;

    const current = notifications[currentIndex];
    if (!current || current.persistent) return;

    const timer = setTimeout(() => {
      dismissNotification(current.id);
    }, 60000); // 60 seconds

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, notifications]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Adjust current index if needed
    if (currentIndex >= notifications.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const nextNotification = () => {
    setCurrentIndex((prev) => (prev + 1) % notifications.length);
    setExpandedId(null);
  };

  const prevNotification = () => {
    setCurrentIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getColorClasses = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'info':
      default:
        return 'bg-brand-50 text-brand-800 border-brand-200';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    if (priority === 'critical') return '🔴';
    if (priority === 'high') return '🟠';
    return '';
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Count all notifications (not dismissed yet)
  const totalCount = notifications.length;

  const currentNotification = notifications[currentIndex];

  // Icon-only mode (mobile)
  if (mode === 'icon-only') {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Bell icon with badge */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative p-2 bg-header-bg hover:bg-sidebar-hover rounded-full transition-colors"
        >
          <Bell className="h-5 w-5 text-sidebar-text" />
          {totalCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </button>

        {/* Dropdown with notifications */}
        {dropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-notification-bg rounded-lg shadow-xl border border-notification-border z-50 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-accent transition-colors ${getColorClasses(notification.type).replace('bg-', 'hover:bg-').replace('-50', '-100')}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        {getPriorityBadge(notification.priority) && (
                          <span className="text-base">{getPriorityBadge(notification.priority)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm text-foreground cursor-pointer"
                          onClick={() => toggleExpand(notification.id)}
                        >
                          {expandedId === notification.id
                            ? notification.message
                            : truncateText(notification.message, 80)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.createdAt.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {notification.dismissible && (
                        <button
                          onClick={() => {
                            dismissNotification(notification.id);
                            if (notifications.length === 1) {
                              setDropdownOpen(false);
                            }
                          }}
                          className="flex-shrink-0 p-1 bg-notification-bg hover:bg-sidebar-hover rounded transition-colors"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode (desktop)
  return (
    <>
      {/* Desktop: Inline notification bar filling available space */}
      <div className="hidden lg:flex items-center justify-between w-full">
        {/* Left: Bell icon with badge */}
        <div className="relative flex-shrink-0 mr-3">
          <Bell className="h-5 w-5 text-info-label" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </div>

        {/* Center: Notification carousel - expands to fill available space */}
        {currentNotification && (
          <div className="flex items-center gap-2 flex-1">
            {/* Previous button */}
            {notifications.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0 bg-header-bg hover:bg-accent"
                onClick={prevNotification}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Notification content - fills available space */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all flex-1 ${getColorClasses(currentNotification.type)}`}
              onClick={() => toggleExpand(currentNotification.id)}
            >
              {getPriorityBadge(currentNotification.priority) && (
                <span className="flex-shrink-0 text-base">{getPriorityBadge(currentNotification.priority)}</span>
              )}
              <span className="flex-1 font-medium truncate">
                {expandedId === currentNotification.id
                  ? currentNotification.message
                  : truncateText(currentNotification.message, 100)}
              </span>
              {currentNotification.dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-transparent flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(currentNotification.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Next button */}
            {notifications.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0 bg-header-bg hover:bg-accent"
                onClick={nextNotification}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {/* Counter */}
            {notifications.length > 1 && (
              <span className="text-xs text-gray-500 font-medium flex-shrink-0 ml-2">
                {currentIndex + 1}/{notifications.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Removed - now using icon-only mode in header */}
      <div className="hidden">
        {notifications.slice(0, 3).map((notification, index) => (
          <div
            key={notification.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg text-sm pointer-events-auto transition-all ${getColorClasses(notification.type)}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <Bell className="h-4 w-4" />
              {getPriorityBadge(notification.priority) && (
                <span>{getPriorityBadge(notification.priority)}</span>
              )}
            </div>
            <span
              className="flex-1 cursor-pointer"
              onClick={() => toggleExpand(notification.id)}
            >
              {expandedId === notification.id
                ? notification.message
                : truncateText(notification.message, 40)}
            </span>
            {notification.dismissible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent flex-shrink-0"
                onClick={() => dismissNotification(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {notifications.length > 3 && (
          <div className="text-center text-xs text-muted-foreground bg-notification-bg/80 rounded-lg py-1 pointer-events-auto border border-notification-border">
            +{notifications.length - 3} more notifications
          </div>
        )}
      </div>
    </>
  );
}
