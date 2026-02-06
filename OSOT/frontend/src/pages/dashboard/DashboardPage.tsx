import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Contact, MapPin, GraduationCap, Activity, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Extracts numeric ID from osot_account_id format (e.g., "osot-1234567" -> "1234567")
 */
const extractNumericId = (accountId: string): string => {
  const match = accountId.match(/\d+/);
  return match ? match[0].replace(/^0+/, '') || '0' : accountId; // Remove leading zeros, keep at least one zero
};

const stats = [
  {
    title: 'Profile Complete',
    value: '85%',
    description: 'Personal information filled',
    icon: User,
    trend: '+5%',
  },
  {
    title: 'Contacts',
    value: '3',
    description: 'Contact methods registered',
    icon: Contact,
    trend: '+1',
  },
  {
    title: 'Addresses',
    value: '2',
    description: 'Addresses on file',
    icon: MapPin,
    trend: '0',
  },
  {
    title: 'Education',
    value: '4',
    description: 'Educational certifications',
    icon: GraduationCap,
    trend: '+2',
  },
];

const recentActivities = [
  {
    id: 1,
    action: 'Profile updated',
    description: 'Contact information was modified',
    time: '2 hours ago',
    type: 'update',
  },
  {
    id: 2,
    action: 'New address',
    description: 'Residential address added',
    time: '1 day ago',
    type: 'create',
  },
  {
    id: 3,
    action: 'OT Education',
    description: 'OT certification added',
    time: '3 days ago',
    type: 'create',
  },
  {
    id: 4,
    action: 'Login performed',
    description: 'System access',
    time: '5 days ago',
    type: 'login',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your information.
            </p>
          </div>
          {user?.osot_account_id && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md border border-primary/20 w-fit">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                User ID: {extractNumericId(user.osot_account_id)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-green-600 font-medium">
                    {stat.trend}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    since last month
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your most recent actions in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Access the most frequently used functions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/30 transition-colors shadow-sm">
              <div className="font-medium text-sm text-card-foreground">Update Profile</div>
              <div className="text-xs text-muted-foreground">Edit personal information</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/30 transition-colors shadow-sm">
              <div className="font-medium text-sm text-card-foreground">Add Address</div>
              <div className="text-xs text-muted-foreground">Register new address</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/30 transition-colors shadow-sm">
              <div className="font-medium text-sm text-card-foreground">New Certification</div>
              <div className="text-xs text-muted-foreground">Add OT/OTA education</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/30 transition-colors shadow-sm">
              <div className="font-medium text-sm text-card-foreground">Settings</div>
              <div className="text-xs text-muted-foreground">Adjust preferences</div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}