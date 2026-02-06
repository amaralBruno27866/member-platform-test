/**
 * Membership Practices Tab
 * Displays practice areas and services information
 */

import { AlertCircle, Stethoscope, Users, Building2 } from 'lucide-react';
import type { MembershipPractices } from '@/types/membership';

interface MembershipPracticesTabProps {
  practices: MembershipPractices | null | undefined;
}

export default function MembershipPracticesTab({ practices }: MembershipPracticesTabProps) {
  if (!practices) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No practice information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clients Age */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Client Demographics</h2>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Client Age Groups Served</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {practices.osot_clients_age.map((age, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium"
                >
                  {age}
                </span>
              ))}
            </div>
          </div>

          {practices.osot_preceptor_declaration !== undefined && (
            <div className="mt-6">
              <label className="text-sm font-medium text-muted-foreground">Preceptor Declaration</label>
              <p className="text-base text-foreground mt-1">
                {practices.osot_preceptor_declaration ? (
                  <span className="text-green-600 dark:text-green-400">✓ Yes</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">✗ No</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Practice Areas */}
      {practices.osot_practice_area && practices.osot_practice_area.length > 0 && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Practice Areas</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {practices.osot_practice_area.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Practice Settings */}
      {practices.osot_practice_settings && practices.osot_practice_settings.length > 0 && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Practice Settings</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {practices.osot_practice_settings.map((setting, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                >
                  {setting}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Practice Services */}
      {practices.osot_practice_services && practices.osot_practice_services.length > 0 && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Services Provided</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {practices.osot_practice_services.map((service, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium"
                >
                  {service}
                </span>
              ))}
            </div>

            {practices.osot_practice_services_other && (
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Other Services</label>
                <p className="text-base text-foreground mt-1">{practices.osot_practice_services_other}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
