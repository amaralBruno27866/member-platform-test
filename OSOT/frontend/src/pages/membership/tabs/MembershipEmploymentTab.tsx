/**
 * Membership Employment Tab
 * Displays employment information
 */

import { AlertCircle, Briefcase, DollarSign, Building } from 'lucide-react';
import type { MembershipEmployment } from '@/types/membership';

interface MembershipEmploymentTabProps {
  employment: MembershipEmployment | null | undefined;
}

export default function MembershipEmploymentTab({ employment }: MembershipEmploymentTabProps) {
  if (!employment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No employment information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employment Status */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Employment Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                <p className="text-base text-foreground mt-1">{employment.osot_employment_status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Work Hours</label>
                <div className="mt-1 space-y-1">
                  {employment.osot_work_hours.map((hour, index) => (
                    <p key={index} className="text-sm text-foreground">• {hour}</p>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role Descriptor</label>
                <p className="text-base text-foreground mt-1">{employment.osot_role_descriptor}</p>
                {employment.osot_role_descriptor_other && (
                  <p className="text-sm text-muted-foreground mt-1">Other: {employment.osot_role_descriptor_other}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Practice Years</label>
                <p className="text-base text-foreground mt-1">{employment.osot_practice_years}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position Funding</label>
                <div className="mt-1 space-y-1">
                  {employment.osot_position_funding.map((funding, index) => (
                    <p key={index} className="text-sm text-foreground">• {funding}</p>
                  ))}
                </div>
                {employment.osot_position_funding_other && (
                  <p className="text-sm text-muted-foreground mt-1">Other: {employment.osot_position_funding_other}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employment Benefits</label>
                <div className="mt-1 space-y-1">
                  {employment.osot_employment_benefits.map((benefit, index) => (
                    <p key={index} className="text-sm text-foreground">• {benefit}</p>
                  ))}
                </div>
                {employment.osot_employment_benefits_other && (
                  <p className="text-sm text-muted-foreground mt-1">Other: {employment.osot_employment_benefits_other}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Another Employment</label>
                <p className="text-base text-foreground mt-1">{employment.osot_another_employment ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Earnings Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employment Earnings</label>
              <p className="text-base text-foreground mt-1">{employment.osot_earnings_employment}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Self Direct Earnings</label>
              <p className="text-base text-foreground mt-1">{employment.osot_earnings_self_direct}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Self Indirect Earnings</label>
              <p className="text-base text-foreground mt-1">{employment.osot_earnings_self_indirect}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Union Info */}
      {employment.osot_union_name && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Union Information</h2>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Union Name</label>
              <p className="text-base text-foreground mt-1">{employment.osot_union_name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
