/**
 * Membership Category Tab
 * Displays membership category information
 */

import { AlertCircle, Calendar, Users, FileText } from 'lucide-react';
import type { MembershipCategory } from '@/types/membership';

interface MembershipCategoryTabProps {
  category: MembershipCategory | null | undefined;
}

export default function MembershipCategoryTab({ category }: MembershipCategoryTabProps) {
  if (!category) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No category information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Info Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Category Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category ID</label>
                <p className="text-base text-foreground mt-1">{category.osot_category_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Membership Year</label>
                <p className="text-base text-foreground mt-1">{category.osot_membership_year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Membership Category</label>
                <p className="text-base text-foreground mt-1">{category.osot_membership_category || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Users Group</label>
                <p className="text-base text-foreground mt-1">{category.osot_users_group || 'Not specified'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Eligibility</label>
                <p className="text-base text-foreground mt-1">
                  {category.osot_eligibility || category.osot_eligibility_affiliate || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Declaration Status</label>
                <p className="text-base text-foreground mt-1">
                  {category.osot_membership_declaration ? (
                    <span className="text-green-600 dark:text-green-400">✓ Accepted</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">✗ Not Accepted</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Info Cards */}
      {(category.osot_parental_leave_from || category.osot_retirement_start) && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Special Circumstances</h2>
            </div>

            <div className="space-y-4">
              {category.osot_parental_leave_from && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Parental Leave Period</label>
                  <p className="text-base text-foreground mt-1">
                    From {category.osot_parental_leave_from} to {category.osot_parental_leave_to || 'Ongoing'}
                  </p>
                </div>
              )}
              {category.osot_retirement_start && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Retirement Start Date</label>
                  <p className="text-base text-foreground mt-1">{category.osot_retirement_start}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
