import { Shield, Calendar, CreditCard, BadgeCheck, UserCircle } from 'lucide-react';
import { useMembershipExpiration, getRenewalColor, formatDaysRemaining, shouldShowRenewalDays } from '@/hooks/useMembershipExpiration';

/**
 * Extracts numeric ID from osot_account_id format (e.g., "osot-1234567" -> "1234567", "affi-0000040" -> "40")
 */
const extractNumericId = (accountId: string): string => {
  const match = accountId.match(/\d+/);
  return match ? match[0].replace(/^0+/, '') || '0' : accountId; // Remove leading zeros, keep at least one zero
};

interface BottomInfoBarProps {
  accountId?: string;
  accountStatus?: string;
  activeMember?: boolean;
  showInsurance?: boolean; // Only for professionals
}

export default function BottomInfoBar({ 
  accountId,
  accountStatus, 
  activeMember,
  showInsurance = true
}: BottomInfoBarProps) {
  const { data: membershipExpiration } = useMembershipExpiration();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-sidebar-bg border-t border-sidebar-border shadow-lg z-40 safe-area-bottom">
      <div className="grid grid-cols-5 gap-0 px-0.5 py-2">
        {/* User ID */}
        <div className="flex flex-col items-center justify-center py-1.5 px-0">
          <UserCircle className="h-4 w-4 text-info-label mb-1" />
          <p className="text-[8px] text-info-label leading-tight">User ID</p>
          <p className="text-[10px] font-semibold text-info-value leading-tight truncate max-w-full">
            {accountId ? extractNumericId(accountId) : 'Loading'}
          </p>
        </div>

        {/* Account Status */}
        <div className="flex flex-col items-center justify-center py-1.5 px-0">
          <BadgeCheck className="h-4 w-4 text-green-500 mb-1" />
          <p className="text-[8px] text-info-label leading-tight">Account</p>
          <p className="text-[10px] font-semibold text-green-600 leading-tight truncate max-w-full">
            {accountStatus || 'Loading'}
          </p>
        </div>

        {/* Membership */}
        <div className="flex flex-col items-center justify-center py-1.5 px-0">
          <CreditCard className={`h-4 w-4 mb-1 ${activeMember ? 'text-green-500' : 'text-gray-400'}`} />
          <p className="text-[8px] text-info-label leading-tight">Membership</p>
          <p className={`text-[10px] font-semibold leading-tight ${activeMember ? 'text-green-600' : 'text-gray-400'}`}>
            {activeMember ? 'Active' : 'Inactive'}
          </p>
        </div>

        {/* Renewal */}
        <div className="flex flex-col items-center justify-center py-1.5 px-0">
          <Calendar className={`h-4 w-4 mb-1 ${
            shouldShowRenewalDays(membershipExpiration)
              ? getRenewalColor(membershipExpiration!.daysRemaining).replace('text-', 'text-').replace('-600', '-500')
              : activeMember
              ? 'text-green-500'
              : 'text-gray-400'
          }`} />
          <p className="text-[8px] text-info-label leading-tight">Renewal</p>
          <p className={`text-[10px] font-semibold leading-tight ${
            shouldShowRenewalDays(membershipExpiration)
              ? getRenewalColor(membershipExpiration!.daysRemaining)
              : activeMember
              ? 'text-green-600'
              : 'text-gray-400'
          }`}>
            {shouldShowRenewalDays(membershipExpiration)
              ? formatDaysRemaining(membershipExpiration!.daysRemaining)
              : activeMember
              ? 'Active'
              : 'N/A'}
          </p>
        </div>

        {/* Insurance (conditional) */}
        {showInsurance ? (
          <div className="flex flex-col items-center justify-center py-1.5 px-0">
            <Shield className="h-4 w-4 text-green-500 mb-1" />
            <p className="text-[8px] text-info-label leading-tight">Insurance</p>
            <p className="text-[10px] font-semibold text-green-600 leading-tight">Covered</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1.5 px-0">
            <div className="h-4 w-4 mb-1" /> {/* Spacer */}
            <p className="text-[8px] text-info-label leading-tight opacity-40">-</p>
            <p className="text-[10px] font-semibold text-info-value opacity-40 leading-tight">-</p>
          </div>
        )}
      </div>
    </div>
  );
}
