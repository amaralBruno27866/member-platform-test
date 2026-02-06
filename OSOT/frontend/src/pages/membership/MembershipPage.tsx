/**
 * Membership Dashboard Page
 * Main page for membership information with tabs
 * Shows BecomeMemberPage if user doesn't have active membership
 */

import { useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useAllMembershipData } from '@/hooks/useMembership';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Briefcase, Stethoscope, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';
import BecomeMemberPage from './BecomeMemberPage';
import MembershipOverviewTab from './tabs/MembershipOverviewTab';
import MembershipCategoryTab from './tabs/MembershipCategoryTab';
import MembershipEmploymentTab from './tabs/MembershipEmploymentTab';
import MembershipPracticesTab from './tabs/MembershipPracticesTab';
import MembershipPreferencesTab from './tabs/MembershipPreferencesTab';

export default function MembershipPage() {
  const { data: account } = useAccount();
  const { data: membershipData, isLoading } = useAllMembershipData();
  const [activeTab, setActiveTab] = useState('overview');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading membership information...</p>
        </div>
      </div>
    );
  }

  // Check if user has active membership
  // Check if user has at least category data (main membership record)
  const hasActiveMembership = account?.osot_active_member ?? membershipData?.category !== null;

  // If no active membership, show BecomeMemberPage
  if (!hasActiveMembership) {
    return <BecomeMemberPage />;
  }

  // User has active membership - show dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Membership</h1>
        <p className="text-muted-foreground mt-2">
          View your membership information, employment details, practice areas, and preferences.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="category"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Category</span>
          </TabsTrigger>
          <TabsTrigger
            value="employment"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Employment</span>
          </TabsTrigger>
          <TabsTrigger
            value="practices"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Practices</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="mt-0">
            <MembershipOverviewTab membershipData={membershipData} />
          </TabsContent>

          <TabsContent value="category" className="mt-0">
            <MembershipCategoryTab category={membershipData?.category} />
          </TabsContent>

          <TabsContent value="employment" className="mt-0">
            <MembershipEmploymentTab employment={membershipData?.employment} />
          </TabsContent>

          <TabsContent value="practices" className="mt-0">
            <MembershipPracticesTab practices={membershipData?.practices} />
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <MembershipPreferencesTab preferences={membershipData?.preferences} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
