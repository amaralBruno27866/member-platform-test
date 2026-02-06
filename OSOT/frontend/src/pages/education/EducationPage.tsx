/**
 * Education Page Router
 * Conditionally renders OT or OTA education page based on account group
 */

import { useAccount } from '@/hooks/useAccount';
import OtEducationPage from './OtEducationPage';
import OtaEducationPage from './OtaEducationPage';
import { Card, CardContent } from '@/components/ui/card';

export default function EducationPage() {
  const { data: account, isLoading } = useAccount();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Education</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if account group is OTA (group 3) or OT (group 1)
  // osot_account_group: 1 = OT, 2 = Admin, 3 = OTA, 4 = Staff
  const isOTA = account?.osot_account_group === 3;

  return isOTA ? <OtaEducationPage /> : <OtEducationPage />;
}
