import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Addresses</h1>
        <p className="text-gray-600 mt-2">
          Manage your residential and business addresses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Registered Addresses
          </CardTitle>
          <CardDescription>
            List of all your registered addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Page Under Development
            </h3>
            <p className="text-gray-600">
              Address management will be implemented soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}