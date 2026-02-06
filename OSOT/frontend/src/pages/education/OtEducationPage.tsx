/**
 * OT Education Page
 * Displays and manages OT education information
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEducation } from '@/hooks/useEducation';
import { useAccount } from '@/hooks/useAccount';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, School, Award, Globe, Edit, X, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { educationService } from '@/services/educationService';
import { toast } from 'sonner';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { enumService, type EnumOption } from '@/services/enumService';
import type { UpdateOtEducationDto, OtEducationResponse } from '@/types/education';

// Validation schema for OT Education
const otEducationSchema = z.object({
  osot_coto_status: z.number().optional(),
  osot_coto_registration: z.string().max(8, 'COTO registration must be 8 characters or less').optional().or(z.literal('')),
  osot_ot_degree_type: z.number().optional(),
  osot_ot_university: z.number().optional(),
  osot_ot_country: z.number().optional(),
  osot_ot_other: z.string().max(100, 'Must be 100 characters or less').optional().or(z.literal('')),
});

type OtEducationFormData = z.infer<typeof otEducationSchema>;

export default function OtEducationPage() {
  const { data: education, isLoading, error } = useEducation();
  const { data: account } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Enum options
  const [cotoStatuses, setCotoStatuses] = useState<EnumOption[]>([]);
  const [degreeTypes, setDegreeTypes] = useState<EnumOption[]>([]);
  const [otUniversities, setOtUniversities] = useState<EnumOption[]>([]);
  const [countries, setCountries] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
  } = useForm<OtEducationFormData>({
    resolver: zodResolver(otEducationSchema),
  });

  // Watch form values to display current state
  const formValues = watch();

  // Load enum options
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const allEnums = await enumService.getAllEnums();
        setCotoStatuses(allEnums.cotoStatuses || []);
        setDegreeTypes(allEnums.degreeTypes || []);
        setOtUniversities(allEnums.otUniversities || []);
        setCountries(allEnums.countries || []);
      } catch (error) {
        console.error('Failed to load enums:', error);
        toast.error('Failed to load form options', {
          description: 'Please refresh the page to try again.',
        });
      }
    };
    loadEnums();
  }, []);

  // Extract numeric value from enum string or find by label
  const extractEnumValue = (value: string | number | undefined, options: EnumOption[] = []): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    
    const match = value.match(/\((\d+)\)$/);
    if (match) {
      return parseInt(match[1]);
    }
    
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
    
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

  // Get enum label by value
  const getEnumLabel = (options: EnumOption[], value: string | number | undefined): string => {
    if (!value) {
      return 'N/A';
    }
    
    if (typeof value === 'string' && isNaN(parseInt(value))) {
      if (value.includes('(') && value.includes(')')) {
        const labelMatch = value.match(/^(.+?)\s*\(/);
        if (labelMatch) return labelMatch[1];
      }
      return value;
    }
    
    const numValue = typeof value === 'number' ? value : parseInt(value);
    if (!isNaN(numValue)) {
      const option = options.find(opt => opt.value === numValue);
      if (option) return option.label;
    }
    
    return value.toString();
  };

  // Reset form when education data loads
  useEffect(() => {
    if (education && cotoStatuses.length > 0 && degreeTypes.length > 0 && otUniversities.length > 0 && countries.length > 0) {
      const otEducation = education as OtEducationResponse;

      const formData = {
        osot_coto_status: extractEnumValue(otEducation.osot_coto_status, cotoStatuses) || undefined,
        osot_coto_registration: otEducation.osot_coto_registration || '',
        osot_ot_degree_type: extractEnumValue(otEducation.osot_ot_degree_type, degreeTypes) || undefined,
        osot_ot_university: extractEnumValue(otEducation.osot_ot_university, otUniversities) || undefined,
        osot_ot_country: extractEnumValue(otEducation.osot_ot_country, countries) || undefined,
        osot_ot_other: otEducation.osot_ot_other || '',
      };

      reset(formData);
    }
  }, [education, cotoStatuses, degreeTypes, otUniversities, countries, reset, watch]);

  // Mutation for updating education
  const updateMutation = useMutation({
    mutationFn: (data: UpdateOtEducationDto) => 
      educationService.updateMyEducation(
        account?.osot_account_group ? parseInt(account.osot_account_group.toString()) : 1, 
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'me', account?.osot_account_group] });
      setIsEditing(false);
      toast.success('Education Updated!', {
        description: 'Your OT education information has been saved successfully.',
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    },
    onError: (err) => {
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to update education. Please try again.');
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
    if (education && cotoStatuses.length > 0 && degreeTypes.length > 0 && otUniversities.length > 0 && countries.length > 0) {
      const otEducation = education as OtEducationResponse;
      reset({
        osot_coto_status: extractEnumValue(otEducation.osot_coto_status, cotoStatuses) || undefined,
        osot_coto_registration: otEducation.osot_coto_registration || '',
        osot_ot_degree_type: extractEnumValue(otEducation.osot_ot_degree_type, degreeTypes) || undefined,
        osot_ot_university: extractEnumValue(otEducation.osot_ot_university, otUniversities) || undefined,
        osot_ot_country: extractEnumValue(otEducation.osot_ot_country, countries) || undefined,
        osot_ot_other: otEducation.osot_ot_other || '',
      });
    }
  };

  const onSubmit = (data: OtEducationFormData) => {
    // Only send dirty fields
    const updates: UpdateOtEducationDto = {};
    
    if (dirtyFields.osot_coto_status) updates.osot_coto_status = data.osot_coto_status;
    if (dirtyFields.osot_coto_registration) updates.osot_coto_registration = data.osot_coto_registration || undefined;
    if (dirtyFields.osot_ot_degree_type) updates.osot_ot_degree_type = data.osot_ot_degree_type;
    if (dirtyFields.osot_ot_university) updates.osot_ot_university = data.osot_ot_university;
    if (dirtyFields.osot_ot_country) updates.osot_ot_country = data.osot_ot_country;
    if (dirtyFields.osot_ot_other) updates.osot_ot_other = data.osot_ot_other || undefined;

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
          <h1 className="text-3xl font-bold text-foreground">OT Education</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading education information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">OT Education</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading education: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!education) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">OT Education</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No education information found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const otEducation = education as OtEducationResponse;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">OT Education</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Edit your education details' : 'Your Occupational Therapist education and certification information'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isEditing ? (
            <Button size="sm" onClick={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Education
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

      {/* COTO Professional Status */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-600" />
              COTO Professional Status
            </CardTitle>
            <CardDescription>
              Your COTO registration and professional status
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_coto_status">COTO Status</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_coto_status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select COTO status" />
                        </SelectTrigger>
                        <SelectContent>
                          {cotoStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value.toString()}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_coto_status && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_coto_status.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(cotoStatuses, formValues.osot_coto_status)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="osot_coto_registration">COTO Registration Number</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_coto_registration"
                    {...register('osot_coto_registration')}
                    className="mt-1"
                    placeholder="AB123456"
                    maxLength={8}
                  />
                  {errors.osot_coto_registration && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_coto_registration.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{formValues.osot_coto_registration || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Degree Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Degree Information
            </CardTitle>
            <CardDescription>
              Your occupational therapy degree details
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_ot_degree_type">Degree Type</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_ot_degree_type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select degree type" />
                        </SelectTrigger>
                        <SelectContent>
                          {degreeTypes.map((degree) => (
                            <SelectItem key={degree.value} value={degree.value.toString()}>
                              {degree.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_ot_degree_type && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ot_degree_type.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(degreeTypes, formValues.osot_ot_degree_type)}</p>
              )}
            </div>
            <div>
              <Label>Graduation Year (Read-only)</Label>
              <p className="text-foreground font-medium mt-1">{otEducation.osot_ot_grad_year || 'N/A'}</p>
            </div>
            {otEducation.osot_education_category && (
              <div>
                <Label>Education Category (Read-only)</Label>
                <p className="text-foreground font-medium mt-1">{otEducation.osot_education_category}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* University Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-purple-600" />
              University Information
            </CardTitle>
            <CardDescription>
              Where you obtained your OT degree
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_ot_university">University</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_ot_university"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                        <SelectContent>
                          {otUniversities.map((university) => (
                            <SelectItem key={university.value} value={university.value.toString()}>
                              {university.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_ot_university && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ot_university.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(otUniversities, formValues.osot_ot_university)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="osot_ot_country">Country</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_ot_country"
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
                  {errors.osot_ot_country && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ot_country.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(countries, formValues.osot_ot_country)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-600" />
              Additional Information
            </CardTitle>
            <CardDescription>
              Any additional education details or certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="osot_ot_other">Additional Details</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_ot_other"
                    {...register('osot_ot_other')}
                    className="mt-1"
                    placeholder="Additional certifications, specializations, etc."
                    maxLength={100}
                  />
                  {errors.osot_ot_other && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ot_other.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{formValues.osot_ot_other || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
