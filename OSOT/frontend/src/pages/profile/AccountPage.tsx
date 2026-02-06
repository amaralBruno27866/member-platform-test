/**
 * Account Page
 * Displays and allows editing of user's account information
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAccount } from '@/hooks/useAccount';
import { accountService } from '@/services/accountService';
import { enumService, type EnumOption } from '@/services/enumService';
import type { UpdateAccountDto } from '@/types/account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Phone, Calendar, Shield, CheckCircle, Edit, Save, X, Key, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { formatPhoneNumber } from '@/lib/formatters';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';

/**
 * Extracts numeric ID from osot_account_id format (e.g., "osot-1234567" -> "1234567")
 */
const extractNumericId = (accountId: string): string => {
  const match = accountId.match(/\d+/);
  return match ? match[0].replace(/^0+/, '') || '0' : accountId; // Remove leading zeros, keep at least one zero
};

// Validation schema for editable fields
const accountSchema = z.object({
  osot_first_name: z.string().min(1, 'First name is required').max(255),
  osot_last_name: z.string().min(1, 'Last name is required').max(255),
  osot_date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  osot_mobile_phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format: (XXX) XXX-XXXX'),
  osot_email: z.string().email('Invalid email address'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const { data: account, isLoading, error, refetch } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accountGroups, setAccountGroups] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  // Load enums
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const groups = await enumService.getAccountGroups();
        setAccountGroups(groups);
      } catch (err) {
        console.error('Error loading account groups:', err);
      }
    };
    loadEnums();
  }, []);

  // Helper function to get enum label
  const getEnumLabel = (options: EnumOption[], value: string | number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    const option = options.find(o => o.value === Number(value));
    return option ? option.label : String(value);
  };

  // Reset form when account data loads
  useEffect(() => {
    if (account) {
      reset({
        osot_first_name: account.osot_first_name,
        osot_last_name: account.osot_last_name,
        osot_date_of_birth: formatDateForInput(account.osot_date_of_birth),
        osot_mobile_phone: account.osot_mobile_phone,
        osot_email: account.osot_email,
      });
    }
  }, [account, reset]);

  // Convert date from API format to YYYY-MM-DD for input
  const formatDateForInput = (dateString: string): string => {
    try {
      // Handle MM/DD/YYYY format from Dataverse
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        const [month, day, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Handle YYYY-MM-DD or ISO format
      if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return dateString.split('T')[0];
      }
      return dateString;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return dateString;
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      // Handle MM/DD/YYYY format from Dataverse
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        const [month, day, year] = dateString.split('/');
        const formatted = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
          .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit', timeZone: 'UTC' });
        return formatted;
      }
      // Handle YYYY-MM-DD format (ISO)
      if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        const [year, month, day] = dateString.split('T')[0].split('-');
        const formatted = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
          .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit', timeZone: 'UTC' });
        return formatted;
      }
      // Fallback: try to parse as-is
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancelClick = () => {
    if (account) {
      reset({
        osot_first_name: account.osot_first_name,
        osot_last_name: account.osot_last_name,
        osot_date_of_birth: formatDateForInput(account.osot_date_of_birth),
        osot_mobile_phone: account.osot_mobile_phone,
        osot_email: account.osot_email,
      });
    }
    setIsEditing(false);
    setSaveError(null);
  };

  const onSubmit = async (data: AccountFormData) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Only send fields that were actually modified
      const updateData: UpdateAccountDto = {};
      
      if (dirtyFields.osot_first_name) {
        updateData.osot_first_name = data.osot_first_name;
      }
      if (dirtyFields.osot_last_name) {
        updateData.osot_last_name = data.osot_last_name;
      }
      if (dirtyFields.osot_date_of_birth) {
        updateData.osot_date_of_birth = data.osot_date_of_birth;
      }
      if (dirtyFields.osot_mobile_phone) {
        updateData.osot_mobile_phone = data.osot_mobile_phone;
      }
      if (dirtyFields.osot_email) {
        updateData.osot_email = data.osot_email;
      }

      // Don't send empty update
      if (Object.keys(updateData).length === 0) {
        toast.info('No Changes', {
          description: 'No fields were modified.',
          duration: 3000,
        });
        setIsEditing(false);
        return;
      }

      await accountService.updateMyAccount(updateData);

      toast.success('Profile Updated!', {
        description: 'Your account information has been updated successfully.',
        duration: 5000,
      });

      // Refresh account data
      await refetch();
      
      setIsEditing(false);
    } catch (err) {
      console.error('Update account error:', err);
      
      const { code } = extractErrorInfo(err);
      
      // Custom messages for common update errors
      let customMessage: string | undefined;
      
      if (code === 1004) {
        customMessage = 'This email is already registered to another account.';
      } else if (code === 1005) {
        customMessage = 'This phone number is already in use by another account.';
      } else if (code === 2002) {
        customMessage = 'Invalid email format. Please check your email address.';
      } else if (code === 2003) {
        customMessage = 'Invalid phone number. Please use Canadian format: (XXX) XXX-XXXX';
      } else if (code === 2004) {
        customMessage = 'Invalid date of birth format.';
      } else if (code === 2006) {
        customMessage = 'Name contains invalid characters. Please use only letters, spaces, hyphens, and apostrophes.';
      }
      
      const errorMessage = getErrorMessage(
        code,
        customMessage || 'Failed to update profile. Please try again.'
      );
      
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'text-foreground bg-muted';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) return 'text-green-700 bg-green-100';
    if (statusLower.includes('inactive')) return 'text-foreground bg-muted';
    if (statusLower.includes('pending')) return 'text-yellow-700 bg-yellow-100';
    return 'text-brand-700 bg-brand-100';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Information</h1>
          <p className="text-muted-foreground mt-2">Loading your account details...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Information</h1>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <Shield className="h-5 w-5" />
              <p>Failed to load account information. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No account information found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Information</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Edit your account details' : 'View your account details and configuration'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button size="sm" onClick={handleEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleSubmit(onSubmit)}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Account ID & Status Banner */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-semibold text-foreground">{extractNumericId(account.osot_account_id)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.osot_account_status)}`}>
                  {account.osot_account_status || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Membership</p>
                <p className="font-semibold text-foreground">
                  {account.osot_active_member ? 'Active Member' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-brand-600" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your basic personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="osot_first_name">
                  First Name {isEditing && <span className="text-destructive">*</span>}
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="osot_first_name"
                      {...register('osot_first_name')}
                      disabled={isSaving}
                    />
                    {errors.osot_first_name && (
                      <p className="text-sm text-destructive">{errors.osot_first_name.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground font-medium">{account.osot_first_name || 'N/A'}</p>
                )}
              </div>
              
              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="osot_last_name">
                  Last Name {isEditing && <span className="text-destructive">*</span>}
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="osot_last_name"
                      {...register('osot_last_name')}
                      disabled={isSaving}
                    />
                    {errors.osot_last_name && (
                      <p className="text-sm text-destructive">{errors.osot_last_name.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground font-medium">{account.osot_last_name || 'N/A'}</p>
                )}
              </div>
              
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="osot_date_of_birth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth {isEditing && <span className="text-destructive">*</span>}
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="osot_date_of_birth"
                      type="date"
                      {...register('osot_date_of_birth')}
                      disabled={isSaving}
                    />
                    {errors.osot_date_of_birth && (
                      <p className="text-sm text-destructive">{errors.osot_date_of_birth.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground font-medium">
                    {account.osot_date_of_birth ? formatDateForDisplay(account.osot_date_of_birth) : 'N/A'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Contact Information
              </CardTitle>
              <CardDescription>
                How we can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="osot_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address {isEditing && <span className="text-destructive">*</span>}
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="osot_email"
                      type="email"
                      {...register('osot_email')}
                      disabled={isSaving}
                    />
                    {errors.osot_email && (
                      <p className="text-sm text-destructive">{errors.osot_email.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground font-medium">{account.osot_email || 'N/A'}</p>
                )}
              </div>
              
              {/* Mobile Phone */}
              <div className="space-y-2">
                <Label htmlFor="osot_mobile_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile Phone {isEditing && <span className="text-destructive">*</span>}
                </Label>
                {isEditing ? (
                  <>
                    <Controller
                      name="osot_mobile_phone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="osot_mobile_phone"
                          placeholder="5551234567"
                          value={field.value || ''}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          onBlur={field.onBlur}
                          disabled={isSaving}
                        />
                      )}
                    />
                    {errors.osot_mobile_phone && (
                      <p className="text-sm text-destructive">{errors.osot_mobile_phone.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground font-medium">{account.osot_mobile_phone || 'N/A'}</p>
                )}
              </div>
            </CardContent>
          </Card>          {/* Account Configuration - Read Only */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Account Configuration
              </CardTitle>
              <CardDescription>
                Your account settings and preferences (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground block mb-2">
                    Account Group
                  </Label>
                  <p className="text-foreground font-medium bg-accent/50 border border-border rounded-lg px-3 py-2 inline-block">
                    {getEnumLabel(accountGroups, account.osot_account_group)}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Declaration Accepted
                  </Label>
                  <p className="text-foreground font-medium mt-1">
                    {account.osot_account_declaration ? (
                      <span className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />
    </div>
  );
}
