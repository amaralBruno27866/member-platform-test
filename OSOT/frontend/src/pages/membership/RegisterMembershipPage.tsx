/**
 * Register Membership Page
 * Multi-step form for membership registration
 * Following the same pattern as RegisterProfessionalPage
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Users, Briefcase, Stethoscope, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Services
import type { EnumOption } from '@/services/enumService';

// Form validation schema
const membershipRegistrationSchema = z.object({
  // Step 1: Category & Eligibility
  osot_membership_category: z.string().min(1, 'Membership category is required'),
  osot_users_group: z.string().optional(),
  osot_eligibility: z.string().optional(),
  osot_special_circumstance: z.string().optional(),
  osot_parental_leave_start: z.string().optional(),
  osot_parental_leave_end: z.string().optional(),
  osot_retirement_date: z.string().optional(),
  osot_category_declaration: z.boolean().refine((val) => val === true, {
    message: 'You must accept the membership terms',
  }),

  // Step 2: Employment (all optional)
  osot_employment_status: z.string().optional(),
  osot_work_hours: z.string().optional(),
  osot_role_descriptor: z.string().optional(),
  osot_organization: z.string().optional(),
  osot_practice_years: z.string().optional(),
  osot_hourly_earnings_cad: z.string().optional(),
  osot_hourly_earnings_international: z.string().optional(),
  osot_annual_earnings_cad: z.string().optional(),
  osot_funding_type: z.array(z.string()).optional(),
  osot_benefits: z.array(z.string()).optional(),
  osot_union: z.string().optional(),
  osot_union_other: z.string().max(100).optional().or(z.literal('')),

  // Step 3: Practices (all optional)
  osot_client_age_group: z.array(z.string()).optional(),
  osot_practice_area: z.array(z.string()).optional(),
  osot_practice_setting: z.array(z.string()).optional(),
  osot_services_provided: z.array(z.string()).optional(),
  osot_services_other: z.string().max(100).optional().or(z.literal('')),

  // Step 4: Preferences (all optional)
  osot_auto_renewal: z.boolean().optional(),
  osot_third_party_communication: z.array(z.string()).optional(),
  osot_practice_promotion: z.array(z.string()).optional(),
  osot_search_tools: z.array(z.string()).optional(),
  osot_psychotherapy_supervision: z.array(z.string()).optional(),
  osot_accept_shadowing: z.boolean().optional(),
});

type MembershipRegistrationForm = z.infer<typeof membershipRegistrationSchema>;

export default function RegisterMembershipPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Enum options - TODO: Add membership-specific enums to enumService
  // For now using empty arrays as placeholders
  const [membershipCategoryOptions] = useState<EnumOption[]>([]);
  const [usersGroupOptions] = useState<EnumOption[]>([]);
  const [eligibilityOptions] = useState<EnumOption[]>([]);
  const [specialCircumstanceOptions] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<MembershipRegistrationForm>({
    resolver: zodResolver(membershipRegistrationSchema),
    defaultValues: {
      osot_category_declaration: false,
      osot_auto_renewal: false,
      osot_accept_shadowing: false,
      osot_funding_type: [],
      osot_benefits: [],
      osot_client_age_group: [],
      osot_practice_area: [],
      osot_practice_setting: [],
      osot_services_provided: [],
      osot_third_party_communication: [],
      osot_practice_promotion: [],
      osot_search_tools: [],
      osot_psychotherapy_supervision: [],
    },
  });

  const specialCircumstance = watch('osot_special_circumstance');
  const showParentalLeave = specialCircumstance === '1'; // Assuming 1 is parental leave
  const showRetirement = specialCircumstance === '2'; // Assuming 2 is retirement

  const totalSteps = 4;

  // Load enums on mount
  useEffect(() => {
    const loadEnums = async () => {
      setIsLoadingEnums(true);
      try {
        // TODO: Load membership-specific enums when backend provides them
        // const allEnums = await enumService.getAllEnums();
        // setMembershipCategoryOptions(allEnums.membershipCategories || []);
        // ... etc
        
        // For now, just mark as loaded
        console.log('Membership enums will be loaded when backend provides them');
      } catch (error) {
        console.error('Failed to load enums:', error);
        toast.error('Error loading form options', {
          description: 'Failed to load form options. Please refresh the page.',
          duration: 5000,
        });
      } finally {
        setIsLoadingEnums(false);
      }
    };

    loadEnums();
  }, []);

  const steps = [
    { 
      number: 1, 
      title: 'Category', 
      icon: Users, 
      fields: ['osot_membership_category', 'osot_category_declaration'] as (keyof MembershipRegistrationForm)[]
    },
    { 
      number: 2, 
      title: 'Employment', 
      icon: Briefcase, 
      fields: [] as (keyof MembershipRegistrationForm)[] // All optional
    },
    { 
      number: 3, 
      title: 'Practices', 
      icon: Stethoscope, 
      fields: [] as (keyof MembershipRegistrationForm)[] // All optional
    },
    { 
      number: 4, 
      title: 'Preferences', 
      icon: SettingsIcon, 
      fields: [] as (keyof MembershipRegistrationForm)[] // All optional
    },
  ];

  const handleNext = async () => {
    const currentStepFields = steps[currentStep - 1].fields;
    const isValid = await trigger(currentStepFields);

    if (isValid) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const onSubmit = async (formData: MembershipRegistrationForm) => {
    setIsLoading(true);
    setRegistrationError(null);

    try {
      // TODO: Implement membership registration API call
      console.log('Membership registration data:', formData);
      
      toast.success('Membership Registration Successful!', {
        description: 'Your membership has been registered successfully.',
        duration: 5000,
      });

      // Navigate back to membership page
      navigate('/membership');
    } catch (error) {
      console.error('Membership registration error:', error);
      setRegistrationError('Registration failed. Please review your information and try again.');
      
      // Auto-clear error after 10 seconds
      setTimeout(() => setRegistrationError(null), 10000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEnums) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/membership')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Membership
          </Button>
          <h1 className="text-3xl font-bold">Membership Registration</h1>
          <p className="text-muted-foreground mt-2">
            Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;

              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center ${isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isCurrent ? 'border-primary bg-primary/10' : isCompleted ? 'border-green-600 bg-green-600' : 'border-muted'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5 text-white" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs mt-2 hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title} Information</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Select your membership category and eligibility'}
              {currentStep === 2 && 'Provide your employment information (optional)'}
              {currentStep === 3 && 'Tell us about your practice areas (optional)'}
              {currentStep === 4 && 'Set your communication preferences (optional)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {registrationError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {registrationError}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Step 1: Category & Eligibility */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="osot_membership_category">
                        Membership Category <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_membership_category"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select membership category" />
                            </SelectTrigger>
                            <SelectContent>
                              {membershipCategoryOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_membership_category && (
                        <p className="text-sm text-destructive">{errors.osot_membership_category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_users_group">Users Group (Optional)</Label>
                      <Controller
                        name="osot_users_group"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select users group" />
                            </SelectTrigger>
                            <SelectContent>
                              {usersGroupOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_eligibility">Eligibility (Optional)</Label>
                      <Controller
                        name="osot_eligibility"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select eligibility" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligibilityOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_special_circumstance">Special Circumstance (Optional)</Label>
                      <Controller
                        name="osot_special_circumstance"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select special circumstance" />
                            </SelectTrigger>
                            <SelectContent>
                              {specialCircumstanceOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {showParentalLeave && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="osot_parental_leave_start">Parental Leave Start Date</Label>
                          <Input id="osot_parental_leave_start" type="date" {...register('osot_parental_leave_start')} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="osot_parental_leave_end">Parental Leave End Date</Label>
                          <Input id="osot_parental_leave_end" type="date" {...register('osot_parental_leave_end')} />
                        </div>
                      </>
                    )}

                    {showRetirement && (
                      <div className="space-y-2">
                        <Label htmlFor="osot_retirement_date">Retirement Date</Label>
                        <Input id="osot_retirement_date" type="date" {...register('osot_retirement_date')} />
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-4">
                      <Controller
                        name="osot_category_declaration"
                        control={control}
                        render={({ field }) => (
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} id="osot_category_declaration" />
                        )}
                      />
                      <Label htmlFor="osot_category_declaration" className="text-sm font-normal">
                        I accept the membership terms and conditions <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    {errors.osot_category_declaration && (
                      <p className="text-sm text-destructive">{errors.osot_category_declaration.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Employment will be added next */}
              {currentStep === 2 && (
                <div className="text-center py-12 text-muted-foreground">
                  Employment form coming soon...
                </div>
              )}

              {/* Step 3: Practices will be added next */}
              {currentStep === 3 && (
                <div className="text-center py-12 text-muted-foreground">
                  Practices form coming soon...
                </div>
              )}

              {/* Step 4: Preferences will be added next */}
              {currentStep === 4 && (
                <div className="text-center py-12 text-muted-foreground">
                  Preferences form coming soon...
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevious} disabled={isLoading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
                {currentStep < totalSteps && (
                  <Button type="button" onClick={handleNext} disabled={isLoading} className="ml-auto">
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {currentStep === totalSteps && (
                  <Button type="submit" disabled={isLoading} className="ml-auto">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
