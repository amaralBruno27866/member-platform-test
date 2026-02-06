/**
 * Address Page
 * Displays and manages user address information
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAddress } from '@/hooks/useAddress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Home, Mail, Edit, X, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { addressService } from '@/services/addressService';
import { toast } from 'sonner';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { enumService, type EnumOption } from '@/services/enumService';
import type { UpdateAddressDto } from '@/types/address';

// Validation schema
const addressSchema = z.object({
  osot_address_1: z.string().min(1, 'Address line 1 is required'),
  osot_address_2: z.string().optional(),
  osot_city: z.number().min(1, 'City is required'),
  osot_province: z.number().min(1, 'Province is required'),
  osot_postal_code: z.string()
    .min(1, 'Postal code is required')
    .regex(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, 'Invalid Canadian postal code format (e.g., K1A 0A6)'),
  osot_country: z.number().min(1, 'Country is required'),
  osot_address_type: z.number().min(1, 'Address type is required'),
  osot_address_preference: z.array(z.number()).optional(),
  osot_other_city: z.string().optional(),
  osot_other_province_state: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressPage() {
  const { data: address, isLoading, error } = useAddress();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Enum options
  const [cities, setCities] = useState<EnumOption[]>([]);
  const [provinces, setProvinces] = useState<EnumOption[]>([]);
  const [countries, setCountries] = useState<EnumOption[]>([]);
  const [addressTypes, setAddressTypes] = useState<EnumOption[]>([]);
  const [addressPreferences, setAddressPreferences] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  // Load enum options
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const allEnums = await enumService.getAllEnums();
        setCities(allEnums.cities || []);
        setProvinces(allEnums.provinces || []);
        setCountries(allEnums.countries || []);
        setAddressTypes(allEnums.addressTypes || []);
        setAddressPreferences(allEnums.addressPreferences || []);
      } catch (error) {
        console.error('Failed to load enums:', error);
        toast.error('Failed to load form options', {
          description: 'Please refresh the page to try again.',
        });
      }
    };
    loadEnums();
  }, []);

  // Reset form when address data loads
  useEffect(() => {
    if (address && cities.length > 0 && provinces.length > 0 && countries.length > 0 && addressTypes.length > 0) {
      reset({
        osot_address_1: address.osot_address_1 || '',
        osot_address_2: address.osot_address_2 || '',
        osot_city: extractEnumValue(address.osot_city, cities),
        osot_province: extractEnumValue(address.osot_province, provinces),
        osot_postal_code: address.osot_postal_code || '',
        osot_country: extractEnumValue(address.osot_country, countries),
        osot_address_type: extractEnumValue(address.osot_address_type, addressTypes),
        osot_address_preference: address.osot_address_preference?.map(p => extractEnumValue(p, addressPreferences)) || [],
        osot_other_city: address.osot_other_city || '',
        osot_other_province_state: address.osot_other_province_state || '',
      });
    }
  }, [address, cities, provinces, countries, addressTypes, addressPreferences, reset]);

  // Extract numeric value from enum string or find by label
  const extractEnumValue = (value: string | number | undefined, options: EnumOption[] = []): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    
    // Try to extract from format "Label (123)"
    const match = value.match(/\((\d+)\)$/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Try to parse as number directly
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
    
    // Backend is returning just the label - do reverse lookup
    if (options.length > 0) {
      const found = options.find(opt => 
        opt.label.toUpperCase() === value.toUpperCase() ||
        opt.label === value
      );
      if (found) {
        return found.value;
      }
    }
    
    return 0;
  };

  // Get enum label by value - handles both numeric values and string labels
  const getEnumLabel = (options: EnumOption[], value: string | number | undefined): string => {
    if (!value) {
      return 'N/A';
    }
    
    // If value is already a string label (not a number string), return it directly
    if (typeof value === 'string' && isNaN(parseInt(value))) {
      // Check if it's a pre-formatted "Label (123)" string
      if (value.includes('(') && value.includes(')')) {
        const labelMatch = value.match(/^(.+?)\s*\(/);
        if (labelMatch) return labelMatch[1];
      }
      // It's just a plain label - return as is
      return value;
    }
    
    // Convert to number and find in options
    const numValue = typeof value === 'number' ? value : parseInt(value);
    if (!isNaN(numValue)) {
      const option = options.find(opt => opt.value === numValue);
      if (option) return option.label;
    }
    
    return value.toString();
  };

  // Mutation for updating address
  const updateMutation = useMutation({
    mutationFn: (data: UpdateAddressDto) => addressService.updateMyAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address'] });
      setIsEditing(false);
      toast.success('Address Updated!', {
        description: 'Your address information has been saved successfully.',
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    },
    onError: (err) => {
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to update address. Please try again.');
      toast.error('Update Failed', {
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (address && cities.length > 0 && provinces.length > 0 && countries.length > 0 && addressTypes.length > 0) {
      reset({
        osot_address_1: address.osot_address_1 || '',
        osot_address_2: address.osot_address_2 || '',
        osot_city: extractEnumValue(address.osot_city, cities),
        osot_province: extractEnumValue(address.osot_province, provinces),
        osot_postal_code: address.osot_postal_code || '',
        osot_country: extractEnumValue(address.osot_country, countries),
        osot_address_type: extractEnumValue(address.osot_address_type, addressTypes),
        osot_address_preference: address.osot_address_preference?.map(p => extractEnumValue(p, addressPreferences)) || [],
        osot_other_city: address.osot_other_city || '',
        osot_other_province_state: address.osot_other_province_state || '',
      });
    }
  };

  const onSubmit = (data: AddressFormData) => {
    // Only send dirty fields
    const updates: UpdateAddressDto = {};
    
    if (dirtyFields.osot_address_1) updates.osot_address_1 = data.osot_address_1;
    if (dirtyFields.osot_address_2) updates.osot_address_2 = data.osot_address_2;
    if (dirtyFields.osot_city) updates.osot_city = data.osot_city;
    if (dirtyFields.osot_province) updates.osot_province = data.osot_province;
    if (dirtyFields.osot_postal_code) updates.osot_postal_code = data.osot_postal_code.toUpperCase().replace(/\s+/g, ' ');
    if (dirtyFields.osot_country) updates.osot_country = data.osot_country;
    if (dirtyFields.osot_address_type) updates.osot_address_type = data.osot_address_type;
    if (dirtyFields.osot_address_preference) updates.osot_address_preference = data.osot_address_preference;
    if (dirtyFields.osot_other_city) updates.osot_other_city = data.osot_other_city;
    if (dirtyFields.osot_other_province_state) updates.osot_other_province_state = data.osot_other_province_state;

    if (Object.keys(updates).length === 0) {
      toast.info('No Changes', {
        description: 'No fields were modified.',
        duration: 3000,
      });
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(updates);
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Address Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading address information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Address Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading address: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Address Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No address information found.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Address Information</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Edit your address details' : 'View your address details and preferences'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isEditing ? (
            <Button size="sm" onClick={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Address
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
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

      {/* Address Type & Preferences Banner */}
      <Card className="bg-accent border-border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Address Type</p>
                {isEditing ? (
                  <div className="min-w-[200px]">
                    <Controller
                      name="osot_address_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {addressTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value.toString()}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.osot_address_type && (
                      <p className="text-xs text-destructive mt-1">{errors.osot_address_type.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="font-semibold text-foreground">
                    {getEnumLabel(addressTypes, address.osot_address_type)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Preferences</p>
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <Controller
                      name="osot_address_preference"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col gap-2">
                          {addressPreferences.map((pref) => (
                            <label
                              key={pref.value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={field.value?.includes(pref.value) || false}
                                onChange={(e) => {
                                  const currentValues = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...currentValues, pref.value]);
                                  } else {
                                    field.onChange(
                                      currentValues.filter((v) => v !== pref.value)
                                    );
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="text-sm text-foreground">{pref.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                ) : (
                  <p className="font-semibold text-foreground">
                    {address.osot_address_preference?.length 
                      ? address.osot_address_preference.map(p => getEnumLabel(addressPreferences, p)).join(', ')
                      : 'None'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" />
              Address Information
            </CardTitle>
            <CardDescription>
              Your complete address details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="osot_address_1">
                Address Line 1 <span className="text-destructive">*</span>
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_address_1"
                    {...register('osot_address_1')}
                    className="mt-1"
                  />
                  {errors.osot_address_1 && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_address_1.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{address.osot_address_1 || 'N/A'}</p>
              )}
            </div>

            {(isEditing || address.osot_address_2) && (
              <div>
                <Label htmlFor="osot_address_2">Address Line 2</Label>
                {isEditing ? (
                  <Input
                    id="osot_address_2"
                    {...register('osot_address_2')}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground font-medium mt-1">{address.osot_address_2}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="osot_city">
                City <span className="text-destructive">*</span>
              </Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_city"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.value} value={city.value.toString()}>
                              {city.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_city && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_city.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(cities, address.osot_city)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="osot_province">
                Province <span className="text-destructive">*</span>
              </Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_province"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province.value} value={province.value.toString()}>
                              {province.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_province && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_province.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(provinces, address.osot_province)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="osot_postal_code">
                Postal Code <span className="text-destructive">*</span>
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_postal_code"
                    {...register('osot_postal_code')}
                    placeholder="K1A 0A6"
                    className="mt-1"
                  />
                  {errors.osot_postal_code && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_postal_code.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{address.osot_postal_code || 'N/A'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="osot_country">
                Country <span className="text-destructive">*</span>
              </Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_country"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value.toString()}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_country && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_country.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(countries, address.osot_country)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        {(isEditing || address.osot_other_city || address.osot_other_province_state) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                Additional Location Details
              </CardTitle>
              <CardDescription>
                Other city and province information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="osot_other_city">Other City</Label>
                  {isEditing ? (
                    <Input
                      id="osot_other_city"
                      {...register('osot_other_city')}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground font-medium mt-1">{address.osot_other_city || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="osot_other_province_state">Other Province/State</Label>
                  {isEditing ? (
                    <Input
                      id="osot_other_province_state"
                      {...register('osot_other_province_state')}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground font-medium mt-1">{address.osot_other_province_state || 'N/A'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
