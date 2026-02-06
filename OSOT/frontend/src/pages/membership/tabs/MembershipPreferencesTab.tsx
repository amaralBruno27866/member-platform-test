/**
 * Membership Preferences Tab
 * Displays communication and professional preferences
 */

import { AlertCircle, Settings, Bell, Eye, Handshake, UserCheck } from 'lucide-react';
import type { MembershipPreferences } from '@/types/membership';

interface MembershipPreferencesTabProps {
  preferences: MembershipPreferences | null | undefined;
}

export default function MembershipPreferencesTab({ preferences }: MembershipPreferencesTabProps) {
  if (!preferences) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No preferences information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto Renewal */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Membership Settings</h2>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Auto Renewal</label>
            <p className="text-base text-foreground mt-1">
              {preferences.osot_auto_renewal ? (
                <span className="text-green-600 dark:text-green-400">✓ Enabled</span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">✗ Disabled</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {preferences.osot_auto_renewal
                ? 'Your membership will automatically renew'
                : 'You will need to manually renew your membership'}
            </p>
          </div>
        </div>
      </div>

      {/* Third Parties */}
      {preferences.osot_third_parties && preferences.osot_third_parties.length > 0 && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Third Party Communications</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Preferred communication topics from third parties
              </label>
              <div className="flex flex-wrap gap-2">
                {preferences.osot_third_parties.map((party, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium"
                  >
                    {party}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Practice Promotion */}
      {preferences.osot_practice_promotion && preferences.osot_practice_promotion.length > 0 && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Handshake className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Practice Promotion</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                How you'd like to promote your practice
              </label>
              <div className="flex flex-wrap gap-2">
                {preferences.osot_practice_promotion.map((promo, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                  >
                    {promo}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Tools */}
      {preferences.osot_search_tools && preferences.osot_search_tools.length > 0 && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Search Tools Visibility</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Where you'd like to be visible
              </label>
              <div className="flex flex-wrap gap-2">
                {preferences.osot_search_tools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Psychotherapy Supervision */}
      {preferences.osot_psychotherapy_supervision && preferences.osot_psychotherapy_supervision.length > 0 && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Psychotherapy Supervision</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Types of supervision you can provide
              </label>
              <div className="flex flex-wrap gap-2">
                {preferences.osot_psychotherapy_supervision.map((supervision, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium"
                  >
                    {supervision}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shadowing */}
      {preferences.osot_shadowing !== undefined && (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Shadowing Opportunities</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Accept Shadowing Requests</label>
              <p className="text-base text-foreground mt-1">
                {preferences.osot_shadowing ? (
                  <span className="text-green-600 dark:text-green-400">✓ Yes, I accept shadowing requests</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">✗ Not accepting shadowing requests</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
