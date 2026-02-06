/**
 * Membership Overview Tab
 * Summary cards showing key information from all membership entities
 */

import { Users, Briefcase, Stethoscope, Settings as SettingsIcon, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MembershipData } from '@/types/membership';

interface MembershipOverviewTabProps {
  membershipData: MembershipData | undefined;
}

export default function MembershipOverviewTab({ membershipData }: MembershipOverviewTabProps) {
  const { category, employment, practices, preferences } = membershipData || {};

  if (!membershipData || !category) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No membership data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Category Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Membership Category</h3>
            <p className="text-xl font-bold text-foreground">{category.osot_membership_category || 'Not specified'}</p>
            <p className="text-xs text-muted-foreground mt-2">Year: {category.osot_membership_year}</p>
          </div>
        </div>

        {/* Employment Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              {employment ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Employment Status</h3>
            <p className="text-xl font-bold text-foreground">
              {employment ? employment.osot_employment_status : 'Not provided'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {employment ? `${employment.osot_practice_years} of practice` : 'Complete employment details'}
            </p>
          </div>
        </div>

        {/* Practices Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              {practices ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Practice Areas</h3>
            <p className="text-xl font-bold text-foreground">
              {practices ? practices.osot_clients_age.length : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {practices ? 'Client age groups served' : 'No practice data'}
            </p>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              {preferences ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Auto Renewal</h3>
            <p className="text-xl font-bold text-foreground">
              {preferences ? (preferences.osot_auto_renewal ? 'Enabled' : 'Disabled') : 'Not set'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {preferences ? 'Preferences configured' : 'Set your preferences'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Membership Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">General Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Category ID</dt>
                  <dd className="text-sm font-medium text-foreground">{category.osot_category_id}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Membership Year</dt>
                  <dd className="text-sm font-medium text-foreground">{category.osot_membership_year}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Users Group</dt>
                  <dd className="text-sm font-medium text-foreground">{category.osot_users_group || 'N/A'}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Eligibility</dt>
                  <dd className="text-sm font-medium text-foreground text-right max-w-xs">
                    {category.osot_eligibility || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Status</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-sm text-muted-foreground">Declaration</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {category.osot_membership_declaration ? (
                      <span className="text-green-600 dark:text-green-400">Accepted</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Not Accepted</span>
                    )}
                  </dd>
                </div>
                {category.osot_parental_leave_from && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-sm text-muted-foreground">Parental Leave</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {category.osot_parental_leave_from} to {category.osot_parental_leave_to}
                    </dd>
                  </div>
                )}
                {category.osot_retirement_start && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-sm text-muted-foreground">Retirement Start</dt>
                    <dd className="text-sm font-medium text-foreground">{category.osot_retirement_start}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
