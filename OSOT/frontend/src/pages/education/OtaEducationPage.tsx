/**
 * OTA Education Page
 * Displays and manages OTA education information
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
import type { UpdateOtaEducationDto, OtaEducationResponse } from '@/types/education';

// Validation schema for OTA Education
const otaEducationSchema = z.object({
  osot_ota_degree_type: z.number().optional(),
  osot_ota_college: z.number().optional(),
  osot_ota_country: z.number().optional(),
  osot_ota_other: z.string().max(100, 'Must be 100 characters or less').optional().or(z.literal('')),
});

type OtaEducationFormData = z.infer<typeof otaEducationSchema>;

export default function OtaEducationPage() {
  const { data: education, isLoading, error } = useEducation();
  const { data: account } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Enum options
  const [degreeTypes, setDegreeTypes] = useState<EnumOption[]>([]);
  const [otaColleges, setOtaColleges] = useState<EnumOption[]>([]);
  const [countries, setCountries] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
  } = useForm<OtaEducationFormData>({
    resolver: zodResolver(otaEducationSchema),
  });

  // Watch form values to display current state
  const formValues = watch();

  // Load enum options
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const allEnums = await enumService.getAllEnums();
        setDegreeTypes(allEnums.degreeTypes || []);
        setOtaColleges(allEnums.otaColleges || []);
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
    if (education && degreeTypes.length > 0 && otaColleges.length > 0 && countries.length > 0) {
      const otaEducation = education as OtaEducationResponse;
      reset({
        osot_ota_degree_type: extractEnumValue(otaEducation.osot_ota_degree_type, degreeTypes) || undefined,
        osot_ota_college: extractEnumValue(otaEducation.osot_ota_college, otaColleges) || undefined,
        osot_ota_country: extractEnumValue(otaEducation.osot_ota_country, countries) || undefined,
        osot_ota_other: otaEducation.osot_ota_other || '',
      });
    }
  }, [education, degreeTypes, otaColleges, countries, reset]);

  // Mutation for updating education
  const updateMutation = useMutation({
    mutationFn: (data: UpdateOtaEducationDto) => 
      educationService.updateMyEducation(
        account?.osot_account_group ? parseInt(account.osot_account_group.toString()) : 2, 
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'me', account?.osot_account_group] });
      setIsEditing(false);
      toast.success('Education Updated!', {
        description: 'Your OTA education information has been saved successfully.',
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
    if (education && degreeTypes.length > 0 && otaColleges.length > 0 && countries.length > 0) {
      const otaEducation = education as OtaEducationResponse;
      reset({
        osot_ota_degree_type: extractEnumValue(otaEducation.osot_ota_degree_type, degreeTypes) || undefined,
        osot_ota_college: extractEnumValue(otaEducation.osot_ota_college, otaColleges) || undefined,
        osot_ota_country: extractEnumValue(otaEducation.osot_ota_country, countries) || undefined,
        osot_ota_other: otaEducation.osot_ota_other || '',
      });
    }
  };

  const onSubmit = (data: OtaEducationFormData) => {
    // Only send dirty fields
    const updates: UpdateOtaEducationDto = {};
    
    if (dirtyFields.osot_ota_degree_type) updates.osot_ota_degree_type = data.osot_ota_degree_type;
    if (dirtyFields.osot_ota_college) updates.osot_ota_college = data.osot_ota_college;
    if (dirtyFields.osot_ota_country) updates.osot_ota_country = data.osot_ota_country;
    if (dirtyFields.osot_ota_other) updates.osot_ota_other = data.osot_ota_other || undefined;

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
          <h1 className="text-3xl font-bold text-foreground">OTA Education</h1>
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
          <h1 className="text-3xl font-bold text-foreground">OTA Education</h1>
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
          <h1 className="text-3xl font-bold text-foreground">OTA Education</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No education information found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const otaEducation = education as OtaEducationResponse;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">OTA Education</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Edit your education details' : 'Your Occupational Therapist Assistant education information'}
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

      {/* Work Declaration - Read Only */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-600" />
              Work Declaration
            </CardTitle>
            <CardDescription>
              Your work declaration status (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Work Declaration Status</Label>
              <p className="text-foreground font-medium mt-1">
                {otaEducation.osot_work_declaration ? 'Confirmed' : 'Not Confirmed'}
              </p>
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
              Your occupational therapy assistant degree details
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_ota_degree_type">Degree Type</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_ota_degree_type"
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
                  {errors.osot_ota_degree_type && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ota_degree_type.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(degreeTypes, formValues.osot_ota_degree_type)}</p>
              )}
            </div>
            <div>
              <Label>Graduation Year (Read-only)</Label>
              <p className="text-foreground font-medium mt-1">{otaEducation.osot_ota_grad_year || 'N/A'}</p>
            </div>
            {otaEducation.osot_education_category && (
              <div>
                <Label>Education Category (Read-only)</Label>
                <p className="text-foreground font-medium mt-1">{otaEducation.osot_education_category}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* College Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-purple-600" />
              College Information
            </CardTitle>
            <CardDescription>
              Where you obtained your OTA education
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_ota_college">College</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_ota_college"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent>
                          {otaColleges.map((college) => (
                            <SelectItem key={college.value} value={college.value.toString()}>
                              {college.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_ota_college && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ota_college.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(otaColleges, formValues.osot_ota_college)}</p>
              )}
            </div>
            <div>
              <Label htmlFor="osot_ota_country">Country</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_ota_country"
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
                  {errors.osot_ota_country && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ota_country.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(countries, formValues.osot_ota_country)}</p>
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
              <Label htmlFor="osot_ota_other">Additional Details</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_ota_other"
                    {...register('osot_ota_other')}
                    className="mt-1"
                    placeholder="Additional certifications, specializations, etc."
                    maxLength={100}
                  />
                  {errors.osot_ota_other && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_ota_other.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{formValues.osot_ota_other || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
