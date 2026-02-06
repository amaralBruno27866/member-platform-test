/**
 * Identity Page
 * Displays and manages user identity information
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useIdentity } from '@/hooks/useIdentity';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Languages, Heart, Users, Edit, X, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { identityService } from '@/services/identityService';
import { toast } from 'sonner';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { enumService, type EnumOption } from '@/services/enumService';
import type { UpdateIdentityDto } from '@/types/identity';

// Validation schema
const identitySchema = z.object({
  osot_chosen_name: z.string().max(255, 'Chosen name must be 255 characters or less').optional().or(z.literal('')),
  osot_language: z.array(z.number()).min(1, 'At least one language must be selected').max(10, 'Maximum 10 languages allowed').optional(),
  osot_other_language: z.string().max(255, 'Must be 255 characters or less').optional().or(z.literal('')),
  osot_gender: z.number().optional(),
  osot_race: z.number().optional(),
  osot_indigenous: z.boolean().optional(),
  osot_indigenous_detail: z.number().optional(),
  osot_indigenous_detail_other: z.string().max(100, 'Must be 100 characters or less').optional().or(z.literal('')),
  osot_disability: z.boolean().optional(),
});

type IdentityFormData = z.infer<typeof identitySchema>;

export default function IdentityPage() {
  const { data: identity, isLoading, error } = useIdentity();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Enum options
  const [genders, setGenders] = useState<EnumOption[]>([]);
  const [languages, setLanguages] = useState<EnumOption[]>([]);
  const [races, setRaces] = useState<EnumOption[]>([]);
  const [indigenousDetails, setIndigenousDetails] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
  });

  // Watch indigenous field to conditionally show related fields
  const indigenousValue = watch('osot_indigenous');

  // Load enum options
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const allEnums = await enumService.getAllEnums();
        setGenders(allEnums.genders || []);
        setLanguages(allEnums.languages || []);
        setRaces(allEnums.races || []);
        setIndigenousDetails(allEnums.indigenousDetails || []);
      } catch (error) {
        console.error('Failed to load enums:', error);
        toast.error('Failed to load form options', {
          description: 'Please refresh the page to try again.',
        });
      }
    };
    loadEnums();
  }, []);

  // Extract numeric value from enum string or find by label (handles backend returning labels)
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

  // Reset form when identity data loads
  useEffect(() => {
    if (identity && genders.length > 0 && languages.length > 0 && races.length > 0 && indigenousDetails.length > 0) {
      reset({
        osot_chosen_name: identity.osot_chosen_name || '',
        osot_language: identity.osot_language?.map(l => extractEnumValue(l, languages)) || [],
        osot_gender: extractEnumValue(identity.osot_gender, genders) || undefined,
        osot_race: extractEnumValue(identity.osot_race, races) || undefined,
        osot_indigenous: identity.osot_indigenous || false,
        osot_indigenous_detail: extractEnumValue(identity.osot_indigenous_detail, indigenousDetails) || undefined,
        osot_indigenous_detail_other: identity.osot_indigenous_detail_other || '',
        osot_disability: identity.osot_disability || false,
      });
    }
  }, [identity, genders, languages, races, indigenousDetails, reset]);

  // Mutation for updating identity
  const updateMutation = useMutation({
    mutationFn: (data: UpdateIdentityDto) => identityService.updateMyIdentity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity'] });
      setIsEditing(false);
      toast.success('Identity Updated!', {
        description: 'Your identity information has been saved successfully.',
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    },
    onError: (err) => {
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to update identity. Please try again.');
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
    if (identity && genders.length > 0 && languages.length > 0 && races.length > 0 && indigenousDetails.length > 0) {
      reset({
        osot_chosen_name: identity.osot_chosen_name || '',
        osot_language: identity.osot_language?.map(l => extractEnumValue(l, languages)) || [],
        osot_other_language: identity.osot_other_language || '',
        osot_gender: extractEnumValue(identity.osot_gender, genders) || undefined,
        osot_race: extractEnumValue(identity.osot_race, races) || undefined,
        osot_indigenous: identity.osot_indigenous || false,
        osot_indigenous_detail: extractEnumValue(identity.osot_indigenous_detail, indigenousDetails) || undefined,
        osot_indigenous_detail_other: identity.osot_indigenous_detail_other || '',
        osot_disability: identity.osot_disability || false,
      });
    }
  };

  const onSubmit = (data: IdentityFormData) => {
    // Only send dirty fields
    const updates: UpdateIdentityDto = {};
    
    if (dirtyFields.osot_chosen_name) updates.osot_chosen_name = data.osot_chosen_name || undefined;
    if (dirtyFields.osot_language) updates.osot_language = data.osot_language;
    if (dirtyFields.osot_other_language) updates.osot_other_language = data.osot_other_language || undefined;
    if (dirtyFields.osot_gender) updates.osot_gender = data.osot_gender;
    if (dirtyFields.osot_race) updates.osot_race = data.osot_race;
    if (dirtyFields.osot_indigenous) updates.osot_indigenous = data.osot_indigenous;
    if (dirtyFields.osot_indigenous_detail) updates.osot_indigenous_detail = data.osot_indigenous_detail;
    if (dirtyFields.osot_indigenous_detail_other) updates.osot_indigenous_detail_other = data.osot_indigenous_detail_other || undefined;
    if (dirtyFields.osot_disability) updates.osot_disability = data.osot_disability;

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
          <h1 className="text-3xl font-bold text-foreground">Identity Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading identity information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Identity Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading identity: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Identity Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No identity information found.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Identity Information</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Edit your identity details' : 'Manage your personal identity and cultural information'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isEditing ? (
            <Button size="sm" onClick={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Identity
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

      {/* Personal Information */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-600" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your chosen name and gender identity
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_chosen_name">Chosen Name</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_chosen_name"
                    {...register('osot_chosen_name')}
                    className="mt-1"
                    placeholder="Your preferred name"
                  />
                  {errors.osot_chosen_name && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_chosen_name.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{identity.osot_chosen_name || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label htmlFor="osot_gender">Gender Identity</Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem key={gender.value} value={gender.value.toString()}>
                              {gender.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.osot_gender && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_gender.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{getEnumLabel(genders, identity.osot_gender)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Language Preferences */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-green-600" />
              Language Preferences
            </CardTitle>
            <CardDescription>
              Select all languages you're comfortable with (1-10 required)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Preferred Languages <span className="text-destructive">*</span></Label>
              {isEditing ? (
                <>
                  <Controller
                    name="osot_language"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {languages.map((lang) => (
                          <div key={lang.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`lang-${lang.value}`}
                              checked={field.value?.includes(lang.value) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, lang.value]);
                                } else {
                                  field.onChange(currentValues.filter((v) => v !== lang.value));
                                }
                              }}
                            />
                            <label
                              htmlFor={`lang-${lang.value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {lang.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.osot_language && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_language.message}</p>
                  )}
                </>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {identity.osot_language && identity.osot_language.length > 0 ? (
                    identity.osot_language.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground"
                      >
                        {getEnumLabel(languages, lang)}
                      </span>
                    ))
                  ) : (
                    <p className="text-foreground font-medium">N/A</p>
                  )}
                </div>
              )}
            </div>

            {/* Conditional: Other Language Field */}
            {(() => {
              const selectedLanguages = watch('osot_language') || [];
              const otherOption = languages.find(opt => opt.label.toLowerCase() === 'other');
              const isOtherSelected = otherOption && selectedLanguages.includes(otherOption.value);
              
              if (!isOtherSelected && !identity.osot_other_language) return null;

              return (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="osot_other_language">
                    Specify Other Language(s)
                  </Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="osot_other_language"
                        {...register('osot_other_language')}
                        placeholder="e.g., Mandarin, Portuguese, Arabic..."
                        maxLength={255}
                      />
                      <p className="text-sm text-muted-foreground">
                        Specify language(s) not listed above (max 255 characters)
                      </p>
                      {errors.osot_other_language && (
                        <p className="text-sm text-destructive">{errors.osot_other_language.message}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-foreground font-medium">
                      {identity.osot_other_language || 'N/A'}
                    </p>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Cultural Identity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-600" />
              Cultural Identity
            </CardTitle>
            <CardDescription>
              Your racial and indigenous identity (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="osot_race">Racial Identity</Label>
                {isEditing ? (
                  <>
                    <Controller
                      name="osot_race"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select race" />
                          </SelectTrigger>
                          <SelectContent>
                            {races.map((race) => (
                              <SelectItem key={race.value} value={race.value.toString()}>
                                {race.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.osot_race && (
                      <p className="text-sm text-destructive mt-1">{errors.osot_race.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground font-medium mt-1">{getEnumLabel(races, identity.osot_race)}</p>
                )}
              </div>
              <div>
                <Label htmlFor="osot_indigenous">Indigenous Identity</Label>
                {isEditing ? (
                  <Controller
                    name="osot_indigenous"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2 mt-1">
                        <Checkbox
                          id="osot_indigenous"
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="osot_indigenous"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          I identify as Indigenous
                        </label>
                      </div>
                    )}
                  />
                ) : (
                  <p className="text-foreground font-medium mt-1">
                    {identity.osot_indigenous ? 'Yes' : 'No'}
                  </p>
                )}
              </div>
            </div>

            {/* Indigenous Details - Only show if indigenous is true */}
            {(indigenousValue || identity.osot_indigenous) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <Label htmlFor="osot_indigenous_detail">Indigenous Detail</Label>
                  {isEditing ? (
                    <>
                      <Controller
                        name="osot_indigenous_detail"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select detail" />
                            </SelectTrigger>
                            <SelectContent>
                              {indigenousDetails.map((detail) => (
                                <SelectItem key={detail.value} value={detail.value.toString()}>
                                  {detail.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_indigenous_detail && (
                        <p className="text-sm text-destructive mt-1">{errors.osot_indigenous_detail.message}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-foreground font-medium mt-1">
                      {getEnumLabel(indigenousDetails, identity.osot_indigenous_detail)}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="osot_indigenous_detail_other">Other Indigenous Identity</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="osot_indigenous_detail_other"
                        {...register('osot_indigenous_detail_other')}
                        className="mt-1"
                        placeholder="Specify if 'Other'"
                      />
                      {errors.osot_indigenous_detail_other && (
                        <p className="text-sm text-destructive mt-1">{errors.osot_indigenous_detail_other.message}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-foreground font-medium mt-1">
                      {identity.osot_indigenous_detail_other || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              Accessibility
            </CardTitle>
            <CardDescription>
              Accommodation needs and accessibility preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="osot_disability">Disability Status</Label>
              {isEditing ? (
                <Controller
                  name="osot_disability"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2 mt-1">
                      <Checkbox
                        id="osot_disability"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <label
                        htmlFor="osot_disability"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        I may need accommodations for disability
                      </label>
                    </div>
                  )}
                />
              ) : (
                <p className="text-foreground font-medium mt-1">
                  {identity.osot_disability ? 'Yes - Accommodations may be needed' : 'No'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
