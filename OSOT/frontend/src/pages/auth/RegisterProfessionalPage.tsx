import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { MultiStepProgress, MultiStepFormContainer, type Step } from '@/components/auth/MultiStepLayout';
import { useAuthLayoutContext } from '@/contexts/AuthLayoutContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, User, MapPin, Mail, Shield, GraduationCap, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { enumService, type EnumOption } from '@/services/enumService';
import { orchestratorService, type CompleteUserRegistrationData } from '@/services/orchestratorService';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/lib/formatters';

// Helper function to mask email for privacy
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  const [domainName, ...domainParts] = domain.split('.');
  const tld = domainParts.join('.');
  
  // Mask local part: show first 1-2 chars, mask rest
  const visibleLocal = localPart.length > 2 ? localPart.substring(0, 2) : localPart.substring(0, 1);
  const maskedLocal = visibleLocal + '*'.repeat(Math.max(1, localPart.length - visibleLocal.length));
  
  // Mask domain: show first 1-2 chars, mask rest
  const visibleDomain = domainName.length > 3 ? domainName.substring(0, 3) : domainName.substring(0, 1);
  const maskedDomain = visibleDomain + '*'.repeat(Math.max(1, domainName.length - visibleDomain.length));
  
  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

// Form validation schema
const registrationSchema = z.object({
  // Step 1: Account Information
  osot_first_name: z.string().min(1, 'First name is required').max(255),
  osot_last_name: z.string().min(1, 'Last name is required').max(255),
  osot_date_of_birth: z.string().min(1, 'Date of birth is required'),
  osot_mobile_phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format: (XXX) XXX-XXXX'),
  osot_email: z.string().email('Invalid email address'),
  osot_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  osot_confirm_password: z.string(),
  osot_account_group: z.string().min(1, 'Account group is required'),
  osot_account_declaration: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),

  // Step 2: Address Information
  osot_address_1: z.string().min(1, 'Address is required').max(255),
  osot_address_2: z.string().max(255).optional().or(z.literal('')),
  osot_city: z.string().min(1, 'City is required'),
  osot_province: z.string().min(1, 'Province is required'),
  osot_postal_code: z.string().regex(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, 'Invalid Canadian postal code'),
  osot_country: z.string().min(1, 'Country is required'),
  osot_address_type: z.string().min(1, 'Address type is required'),
  osot_address_preference: z.array(z.string()).optional(),
  osot_other_city: z.string().max(255).optional().or(z.literal('')),
  osot_other_province_state: z.string().max(255).optional().or(z.literal('')),

  // Step 3: Contact Information
  osot_secondary_email: z.string().email().optional().or(z.literal('')),
  osot_job_title: z.string().max(255).optional().or(z.literal('')),
  osot_home_phone: z.string().optional().or(z.literal('')),
  osot_work_phone: z.string().optional().or(z.literal('')),
  osot_business_website: z.string().url().optional().or(z.literal('')),
  osot_facebook: z.string().url().optional().or(z.literal('')),
  osot_instagram: z.string().url().optional().or(z.literal('')),
  osot_tiktok: z.string().url().optional().or(z.literal('')),
  osot_linkedin: z.string().url().optional().or(z.literal('')),

  // Step 4: Identity Information
  osot_chosen_name: z.string().max(255).optional().or(z.literal('')),
  osot_language: z.array(z.string()).min(1, 'At least one language is required'),
  osot_other_language: z.string().max(255).optional().or(z.literal('')),
  osot_gender: z.string().optional(),
  osot_race: z.string().optional(),
  osot_indigenous: z.boolean().optional(),
  osot_indigenous_detail: z.string().optional(),
  osot_indigenous_detail_other: z.string().max(100).optional().or(z.literal('')),
  osot_disability: z.boolean().optional(),

  // Step 5: Education (conditional)
  osot_coto_status: z.string().optional(),
  osot_coto_registration: z.string().max(8).optional().or(z.literal('')),
  osot_ot_degree_type: z.string().optional(),
  osot_ot_university: z.string().optional(),
  osot_ot_grad_year: z.string().optional(),
  osot_ot_country: z.string().optional(),
  
  osot_work_declaration: z.boolean().optional(),
  osot_ota_degree_type: z.string().optional(),
  osot_ota_college: z.string().optional(),
  osot_ota_grad_year: z.string().optional(),
  osot_ota_country: z.string().optional(),
}).refine((data) => data.osot_password === data.osot_confirm_password, {
  message: "Passwords don't match",
  path: ['osot_confirm_password'],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

const ACCOUNT_GROUP_OT = '1'; // Occupational Therapist
const ACCOUNT_GROUP_OTA = '2'; // Occupational Therapist Assistant

interface RegisterProfessionalPageProps {
  renderContentOnly?: boolean;
}

export default function RegisterProfessionalPage({ renderContentOnly = false }: RegisterProfessionalPageProps = {}) {
  const navigate = useNavigate();
  const { isWithinAuthPagesLayout, setBrandContent } = useAuthLayoutContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Enum options
  const [accountGroupOptions, setAccountGroupOptions] = useState<EnumOption[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<EnumOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<EnumOption[]>([]);
  const [cityOptions, setCityOptions] = useState<EnumOption[]>([]);
  const [addressTypeOptions, setAddressTypeOptions] = useState<EnumOption[]>([]);
  const [addressPreferenceOptions, setAddressPreferenceOptions] = useState<EnumOption[]>([]);
  const [genderOptions, setGenderOptions] = useState<EnumOption[]>([]);
  const [languageOptions, setLanguageOptions] = useState<EnumOption[]>([]);
  const [raceOptions, setRaceOptions] = useState<EnumOption[]>([]);
  const [indigenousDetailOptions, setIndigenousDetailOptions] = useState<EnumOption[]>([]);
  const [cotoStatusOptions, setCotoStatusOptions] = useState<EnumOption[]>([]);
  const [degreeTypeOptions, setDegreeTypeOptions] = useState<EnumOption[]>([]);
  const [otUniversityOptions, setOtUniversityOptions] = useState<EnumOption[]>([]);
  const [otaCollegeOptions, setOtaCollegeOptions] = useState<EnumOption[]>([]);
  const [graduationYearOptions, setGraduationYearOptions] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      osot_country: '1', // Canada
      osot_province: '1', // Ontario
      osot_address_type: '1', // Home
      osot_indigenous: false,
      osot_disability: false,
      osot_work_declaration: false,
      osot_account_declaration: false,
      osot_language: [],
      osot_other_language: '',
      osot_address_preference: [],
    },
  });

  const accountGroup = watch('osot_account_group');
  const selectedCity = watch('osot_city');
  const selectedProvince = watch('osot_province');
  const isOT = accountGroup === ACCOUNT_GROUP_OT;
  const isOTA = accountGroup === ACCOUNT_GROUP_OTA;
  const needsEducation = isOT || isOTA;

  // Calculate total steps based on account group
  const totalSteps = needsEducation ? 5 : 4;

  // Load enums on mount
  useEffect(() => {
    const loadEnums = async () => {
      setIsLoadingEnums(true);
      try {
        const allEnums = await enumService.getAllEnums();
        
        setAccountGroupOptions(allEnums.accountGroups);
        setProvinceOptions(allEnums.provinces);
        setCountryOptions(allEnums.countries);
        setCityOptions(allEnums.cities);
        setGenderOptions(allEnums.genders);
        setLanguageOptions(allEnums.languages);
        setRaceOptions(allEnums.races);
        setIndigenousDetailOptions(allEnums.indigenousDetails);
        setAddressTypeOptions(allEnums.addressTypes);
        setAddressPreferenceOptions(allEnums.addressPreferences);
        setCotoStatusOptions(allEnums.cotoStatuses);
        setDegreeTypeOptions(allEnums.degreeTypes);
        setOtUniversityOptions(allEnums.otUniversities);
        setOtaCollegeOptions(allEnums.otaColleges);
        setGraduationYearOptions(allEnums.graduationYears);
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

  const steps: Step[] = useMemo(() => [
    { number: 1, title: 'Account', icon: User, fields: ['osot_first_name', 'osot_last_name', 'osot_date_of_birth', 'osot_mobile_phone', 'osot_email', 'osot_password', 'osot_confirm_password', 'osot_account_group', 'osot_account_declaration'] },
    { number: 2, title: 'Address', icon: MapPin, fields: ['osot_address_1', 'osot_city', 'osot_province', 'osot_postal_code', 'osot_country', 'osot_address_type'] },
    { number: 3, title: 'Contact', icon: Mail, fields: [] }, // All optional
    { number: 4, title: 'Identity', icon: Shield, fields: ['osot_language', 'osot_other_language'] },
    ...(needsEducation ? [{ number: 5, title: 'Education', icon: GraduationCap, fields: isOT ? ['osot_coto_status', 'osot_ot_degree_type', 'osot_ot_university', 'osot_ot_grad_year', 'osot_ot_country'] : ['osot_work_declaration'] }] as Step[] : []),
  ], [needsEducation, isOT]);

  // Pass brand content to parent AuthLayout via context
  useEffect(() => {
    if (isWithinAuthPagesLayout && setBrandContent) {
      setBrandContent(<MultiStepProgress steps={steps} currentStep={currentStep} />);
    }
  }, [currentStep, steps, isWithinAuthPagesLayout, setBrandContent]);

  const handleNext = async () => {
    const currentStepFields = steps[currentStep - 1].fields as (keyof RegistrationForm)[];
    const isValid = await trigger(currentStepFields);

    if (isValid) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const onSubmit = async (formData: RegistrationForm) => {
    console.log('[Registration] Form submitted', { formData, currentStep, totalSteps });
    setIsLoading(true);
    setRegistrationError(null); // Clear previous errors

    try {
      console.log('[Registration] Building registration data...');
      // Build registration data
      const registrationData: CompleteUserRegistrationData = {
        account: {
          osot_first_name: formData.osot_first_name,
          osot_last_name: formData.osot_last_name,
          osot_date_of_birth: formData.osot_date_of_birth,
          osot_mobile_phone: formData.osot_mobile_phone,
          osot_email: formData.osot_email,
          osot_password: formData.osot_password,
          osot_account_group: Number(formData.osot_account_group),
          osot_account_declaration: formData.osot_account_declaration,
        },
        address: {
          osot_address_1: formData.osot_address_1,
          osot_address_2: formData.osot_address_2,
          osot_city: Number(formData.osot_city),
          osot_province: Number(formData.osot_province),
          osot_postal_code: formData.osot_postal_code,
          osot_country: Number(formData.osot_country),
          osot_address_type: Number(formData.osot_address_type),
          osot_address_preference: formData.osot_address_preference?.map(Number),
          osot_other_city: formData.osot_other_city,
          osot_other_province_state: formData.osot_other_province_state,
        },
        contact: {
          osot_secondary_email: formData.osot_secondary_email,
          osot_job_title: formData.osot_job_title,
          osot_home_phone: formData.osot_home_phone,
          osot_work_phone: formData.osot_work_phone,
          osot_business_website: formData.osot_business_website,
          osot_facebook: formData.osot_facebook,
          osot_instagram: formData.osot_instagram,
          osot_tiktok: formData.osot_tiktok,
          osot_linkedin: formData.osot_linkedin,
        },
        identity: {
          osot_chosen_name: formData.osot_chosen_name,
          osot_language: formData.osot_language.map(Number),
          osot_other_language: formData.osot_other_language || undefined,
          osot_gender: formData.osot_gender ? Number(formData.osot_gender) : undefined,
          osot_race: formData.osot_race ? Number(formData.osot_race) : undefined,
          osot_indigenous: formData.osot_indigenous,
          osot_indigenous_detail: formData.osot_indigenous_detail ? Number(formData.osot_indigenous_detail) : undefined,
          osot_indigenous_detail_other: formData.osot_indigenous_detail_other,
          osot_disability: formData.osot_disability,
        },
        educationType: isOT ? 'ot' : 'ota',
      };

      // Add education data based on account group
      if (isOT && formData.osot_coto_status) {
        registrationData.otEducation = {
          osot_coto_status: Number(formData.osot_coto_status),
          osot_coto_registration: formData.osot_coto_registration,
          osot_ot_degree_type: Number(formData.osot_ot_degree_type),
          osot_ot_university: Number(formData.osot_ot_university),
          osot_ot_grad_year: Number(formData.osot_ot_grad_year),
          osot_ot_country: Number(formData.osot_ot_country),
        };
      } else if (isOTA) {
        registrationData.otaEducation = {
          osot_work_declaration: formData.osot_work_declaration || false,
          osot_ota_degree_type: formData.osot_ota_degree_type ? Number(formData.osot_ota_degree_type) : undefined,
          osot_ota_college: formData.osot_ota_college ? Number(formData.osot_ota_college) : undefined,
          osot_ota_grad_year: formData.osot_ota_grad_year ? Number(formData.osot_ota_grad_year) : undefined,
          osot_ota_country: formData.osot_ota_country ? Number(formData.osot_ota_country) : undefined,
        };
      }

      console.log('[Registration] Sending to API...', registrationData);
      const result = await orchestratorService.register(registrationData);
      console.log('[Registration] API response:', result);

      // Check if sessionId is undefined (validation failed but backend returned 200)
      if (!result.sessionId || result.sessionId === 'undefined') {
        console.error('❌ Registration returned undefined sessionId - possible validation failure');
        
        // Check if it's a duplicate error message
        const message = result.message || '';
        const isDuplicateError = message.toLowerCase().includes('already exists') || 
                                message.toLowerCase().includes('duplicate') ||
                                message.toLowerCase().includes('same name and date of birth');
        
        if (isDuplicateError) {
          // Navigate to duplicate error page
          navigate('/auth/register/duplicate-error', {
            state: {
              message: message || 'An account with these details already exists.',
              maskedEmail: formData.osot_email ? maskEmail(formData.osot_email) : 'unknown@email.com',
            },
          });
          return;
        }
        
        // Generic validation error
        toast.error('Registration Failed', {
          description: message || 'Please check your information and try again.',
          duration: 5000,
        });
        return;
      }

      toast.success('Registration Successful!', {
        description: result.message || 'Please check your email for verification.',
        duration: 5000,
      });

      // Navigate to success page
      navigate(`/auth/register/success/${result.sessionId}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check for HTTP 409 Conflict (Duplicate Account)
      if (error?.response?.status === 409) {
        console.log('🔍 Full error response:', error.response);
        console.log('🔍 Error response data:', error.response?.data);
        console.log('🔍 Error response data type:', typeof error.response?.data);
        console.log('🔍 Error response data keys:', error.response?.data ? Object.keys(error.response.data) : 'no keys');
        
        const errorData = error.response.data;
        console.log('🔍 Duplicate account error data:', errorData);
        console.log('🔍 Masked email from backend:', errorData.maskedEmail);
        console.log('🔍 Message from backend:', errorData.message);
        console.log('🔍 Suggestion from backend:', errorData.suggestion);
        
        // Navigate to duplicate error page with error details
        navigate('/auth/register/duplicate-error', {
          state: {
            message: errorData.message || 'An account with these details already exists.',
            maskedEmail: errorData.maskedEmail || 'unknown@email.com',
            suggestion: errorData.suggestion,
          },
        });
        return;
      }
      
      // Extract error info and show in form
      const { code } = extractErrorInfo(error);
      
      // Custom messages for common registration errors with step guidance
      let customMessage: string | undefined;
      let suggestedStep: number | undefined;
      
      // Error code 1004: Email already exists
      if (code === 1004) {
        customMessage = 'This email is already registered. Please use a different email address or try to log in.';
        suggestedStep = 1; // Account step
      }
      // Error code 1005: Phone already exists
      else if (code === 1005) {
        customMessage = 'This phone number is already in use. Please use a different number.';
        suggestedStep = 1; // Account step
      }
      // Error code 2002: Invalid email format
      else if (code === 2002) {
        customMessage = 'Invalid email format. Please check your email address.';
        suggestedStep = 1; // Account step
      }
      // Error code 2003: Invalid phone format
      else if (code === 2003) {
        customMessage = 'Invalid phone number. Please use Canadian format: (XXX) XXX-XXXX';
        suggestedStep = 1; // Account step
      }
      // Error code 2004: Invalid postal code
      else if (code === 2004) {
        customMessage = 'Invalid postal code. Please use Canadian format: A1A 1A1';
        suggestedStep = 2; // Address step
      }
      // Error code 2005: Password validation failed
      else if (code === 2005) {
        customMessage = 'Password does not meet security requirements. Please ensure it has at least 8 characters with uppercase, lowercase, number, and special character.';
        suggestedStep = 1; // Account step
      }
      // Error code 2006: Invalid name format
      else if (code === 2006) {
        customMessage = 'Name contains invalid characters. Please use only letters, spaces, hyphens, and apostrophes.';
        suggestedStep = 1; // Account step
      }
      // Error code 2001: General validation error
      else if (code === 2001) {
        customMessage = 'Please check all fields for errors. Make sure all required information is filled correctly.';
      }
      // Error code 5103: Education data incomplete
      else if (code === 5103) {
        customMessage = 'Education information is incomplete. Please fill all required education fields.';
        suggestedStep = 5; // Education step
      }
      // Error code 5102: Invalid education category
      else if (code === 5102) {
        customMessage = 'Invalid education category for your account type.';
        suggestedStep = 5; // Education step
      }
      
      const errorMessage = getErrorMessage(
        code,
        customMessage || 'Registration failed. Please review your information and try again.'
      );
      
      setRegistrationError(errorMessage);
      
      // Navigate to suggested step if available
      if (suggestedStep && suggestedStep !== currentStep) {
        setCurrentStep(suggestedStep);
      }
      
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

  const stepDescriptions: Record<number, string> = {
    1: 'Provide your basic account information',
    2: 'Enter your address details',
    3: 'Add optional contact information',
    4: 'Tell us about yourself',
    5: 'Provide your education details',
  };

  const formContent = (
    <MultiStepFormContainer
        title={`${steps[currentStep - 1].title} Information`}
        description={stepDescriptions[currentStep]}
        backLink={
          currentStep === 1 && (
            <Link
              to="/auth/register"
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
            >
              Back to user type selection
              <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
            </Link>
          )
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {registrationError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {registrationError}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Step 1: Account Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="osot_first_name">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input id="osot_first_name" {...register('osot_first_name')} />
                      {errors.osot_first_name && (
                        <p className="text-sm text-destructive">{errors.osot_first_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_last_name">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input id="osot_last_name" {...register('osot_last_name')} />
                      {errors.osot_last_name && (
                        <p className="text-sm text-destructive">{errors.osot_last_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_date_of_birth">
                        Date of Birth <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="osot_date_of_birth" 
                        type="date"
                        {...register('osot_date_of_birth')} 
                      />
                      {errors.osot_date_of_birth && (
                        <p className="text-sm text-destructive">{errors.osot_date_of_birth.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_mobile_phone">
                        Mobile Phone <span className="text-destructive">*</span>
                      </Label>
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
                          />
                        )}
                      />
                      {errors.osot_mobile_phone && (
                        <p className="text-sm text-destructive">{errors.osot_mobile_phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input id="osot_email" type="email" {...register('osot_email')} />
                      {errors.osot_email && (
                        <p className="text-sm text-destructive">{errors.osot_email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input 
                          id="osot_password" 
                          type={showPassword ? "text" : "password"} 
                          {...register('osot_password')} 
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.osot_password && (
                        <p className="text-sm text-destructive">{errors.osot_password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_confirm_password">
                        Confirm Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input 
                          id="osot_confirm_password" 
                          type={showConfirmPassword ? "text" : "password"} 
                          {...register('osot_confirm_password')} 
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.osot_confirm_password && (
                        <p className="text-sm text-destructive">{errors.osot_confirm_password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_account_group">
                        Account Type <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_account_group"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                              {accountGroupOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_account_group && (
                        <p className="text-sm text-destructive">{errors.osot_account_group.message}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 md:col-span-2">
                      <Controller
                        name="osot_account_declaration"
                        control={control}
                        render={({ field }) => (
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} id="osot_account_declaration" />
                        )}
                      />
                      <Label htmlFor="osot_account_declaration" className="text-sm font-normal">
                        I accept the terms and conditions <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    {errors.osot_account_declaration && (
                      <p className="text-sm text-destructive md:col-span-2">{errors.osot_account_declaration.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Address Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_address_1">
                        Address Line 1 <span className="text-destructive">*</span>
                      </Label>
                      <Input id="osot_address_1" {...register('osot_address_1')} placeholder="Street address" />
                      {errors.osot_address_1 && (
                        <p className="text-sm text-destructive">{errors.osot_address_1.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_address_2">Address Line 2 (Optional)</Label>
                      <Input id="osot_address_2" {...register('osot_address_2')} placeholder="Apartment, suite, etc." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_city">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_city"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {cityOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_city && (
                        <p className="text-sm text-destructive">{errors.osot_city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_province">
                        Province <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_province"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinceOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_province && (
                        <p className="text-sm text-destructive">{errors.osot_province.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_postal_code">
                        Postal Code <span className="text-destructive">*</span>
                      </Label>
                      <Input id="osot_postal_code" {...register('osot_postal_code')} placeholder="K1A 0A6" />
                      {errors.osot_postal_code && (
                        <p className="text-sm text-destructive">{errors.osot_postal_code.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_country">
                        Country <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_country"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_country && (
                        <p className="text-sm text-destructive">{errors.osot_country.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_address_type">
                        Address Type <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_address_type"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select address type" />
                            </SelectTrigger>
                            <SelectContent>
                              {addressTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_address_type && (
                        <p className="text-sm text-destructive">{errors.osot_address_type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_address_preference">Address Preferences (Optional)</Label>
                      <p className="text-sm text-muted-foreground">Select your preferred contact methods</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-4">
                        {addressPreferenceOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Controller
                              name="osot_address_preference"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  checked={field.value?.includes(String(option.value))}
                                  onCheckedChange={(checked) => {
                                    const value = String(option.value);
                                    if (checked) {
                                      field.onChange([...(field.value || []), value]);
                                    } else {
                                      field.onChange((field.value || []).filter((v: string) => v !== value));
                                    }
                                  }}
                                />
                              )}
                            />
                            <Label className="text-sm font-normal">{option.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedCity === '22' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="osot_other_city">
                          Other City <span className="text-destructive">*</span>
                        </Label>
                        <Input id="osot_other_city" {...register('osot_other_city')} placeholder="Enter city name" />
                      </div>
                    )}

                    {selectedProvince === '14' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="osot_other_province_state">
                          Other Province/State <span className="text-destructive">*</span>
                        </Label>
                        <Input id="osot_other_province_state" {...register('osot_other_province_state')} placeholder="Enter province/state name" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Contact Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="osot_secondary_email">Secondary Email (Optional)</Label>
                      <Input id="osot_secondary_email" type="email" {...register('osot_secondary_email')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_job_title">Job Title (Optional)</Label>
                      <Input id="osot_job_title" {...register('osot_job_title')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_home_phone">Home Phone (Optional)</Label>
                      <Controller
                        name="osot_home_phone"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="osot_home_phone"
                            placeholder="5551234567"
                            value={field.value || ''}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              field.onChange(formatted);
                            }}
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_work_phone">Work Phone (Optional)</Label>
                      <Controller
                        name="osot_work_phone"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="osot_work_phone"
                            placeholder="5551234567"
                            value={field.value || ''}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              field.onChange(formatted);
                            }}
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_business_website">Business Website (Optional)</Label>
                      <Input id="osot_business_website" type="url" {...register('osot_business_website')} placeholder="https://example.com" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_facebook">Facebook (Optional)</Label>
                      <Input id="osot_facebook" type="url" {...register('osot_facebook')} placeholder="https://facebook.com/..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_instagram">Instagram (Optional)</Label>
                      <Input id="osot_instagram" type="url" {...register('osot_instagram')} placeholder="https://instagram.com/..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_tiktok">TikTok (Optional)</Label>
                      <Input id="osot_tiktok" type="url" {...register('osot_tiktok')} placeholder="https://tiktok.com/..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_linkedin">LinkedIn (Optional)</Label>
                      <Input id="osot_linkedin" type="url" {...register('osot_linkedin')} placeholder="https://linkedin.com/..." />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Identity Information */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_chosen_name">Chosen/Preferred Name (Optional)</Label>
                      <Input id="osot_chosen_name" {...register('osot_chosen_name')} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="osot_language">
                        Languages <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Select at least one language</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                        {languageOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Controller
                              name="osot_language"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  checked={field.value.includes(String(option.value))}
                                  onCheckedChange={(checked) => {
                                    const value = String(option.value);
                                    if (checked) {
                                      field.onChange([...field.value, value]);
                                    } else {
                                      field.onChange(field.value.filter((v: string) => v !== value));
                                    }
                                  }}
                                />
                              )}
                            />
                            <Label className="text-sm font-normal">{option.label}</Label>
                          </div>
                        ))}
                      </div>
                      {errors.osot_language && (
                        <p className="text-sm text-destructive">{errors.osot_language.message}</p>
                      )}
                    </div>

                    {/* Conditional: Other Language Field */}
                    {(() => {
                      const selectedLanguages = watch('osot_language') || [];
                      const otherOption = languageOptions.find(opt => opt.label.toLowerCase() === 'other');
                      const isOtherSelected = otherOption && selectedLanguages.includes(String(otherOption.value));
                      
                      return isOtherSelected ? (
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="osot_other_language">
                            Specify Other Language(s)
                          </Label>
                          <Input
                            id="osot_other_language"
                            {...register('osot_other_language')}
                            placeholder="e.g., Mandarin, Portuguese, Arabic..."
                            maxLength={255}
                          />
                          <p className="text-sm text-muted-foreground">
                            Please specify the language(s) not listed above (max 255 characters)
                          </p>
                          {errors.osot_other_language && (
                            <p className="text-sm text-destructive">{errors.osot_other_language.message}</p>
                          )}
                        </div>
                      ) : null;
                    })()}

                    <div className="space-y-2">
                      <Label htmlFor="osot_gender">Gender (Optional)</Label>
                      <Controller
                        name="osot_gender"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              {genderOptions.map((option) => (
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
                      <Label htmlFor="osot_race">Race/Ethnicity (Optional)</Label>
                      <Controller
                        name="osot_race"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select race/ethnicity" />
                            </SelectTrigger>
                            <SelectContent>
                              {raceOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="osot_indigenous"
                          control={control}
                          render={({ field }) => (
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id="osot_indigenous" />
                          )}
                        />
                        <Label htmlFor="osot_indigenous" className="text-sm font-normal">Indigenous Identity</Label>
                      </div>
                    </div>

                    {watch('osot_indigenous') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="osot_indigenous_detail">Indigenous Detail</Label>
                          <Controller
                            name="osot_indigenous_detail"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select detail" />
                                </SelectTrigger>
                                <SelectContent>
                                  {indigenousDetailOptions.map((option) => (
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
                          <Label htmlFor="osot_indigenous_detail_other">Other Indigenous Detail</Label>
                          <Input id="osot_indigenous_detail_other" {...register('osot_indigenous_detail_other')} />
                        </div>
                      </>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="osot_disability"
                          control={control}
                          render={({ field }) => (
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id="osot_disability" />
                          )}
                        />
                        <Label htmlFor="osot_disability" className="text-sm font-normal">I have a disability</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Education (OT) */}
              {currentStep === 5 && isOT && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="osot_coto_status">
                        COTO Status <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_coto_status"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select COTO status" />
                            </SelectTrigger>
                            <SelectContent>
                              {cotoStatusOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_coto_status && (
                        <p className="text-sm text-destructive">{errors.osot_coto_status.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_coto_registration">COTO Registration</Label>
                      <Input id="osot_coto_registration" {...register('osot_coto_registration')} maxLength={8} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_ot_degree_type">
                        Degree Type <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_ot_degree_type"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select degree type" />
                            </SelectTrigger>
                            <SelectContent>
                              {degreeTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_ot_degree_type && (
                        <p className="text-sm text-destructive">{errors.osot_ot_degree_type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_ot_university">
                        University <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_ot_university"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select university" />
                            </SelectTrigger>
                            <SelectContent>
                              {otUniversityOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_ot_university && (
                        <p className="text-sm text-destructive">{errors.osot_ot_university.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_ot_grad_year">
                        Graduation Year <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_ot_grad_year"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select graduation year" />
                            </SelectTrigger>
                            <SelectContent>
                              {graduationYearOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_ot_grad_year && (
                        <p className="text-sm text-destructive">{errors.osot_ot_grad_year.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_ot_country">
                        Country <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="osot_ot_country"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.osot_ot_country && (
                        <p className="text-sm text-destructive">{errors.osot_ot_country.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Education (OTA) */}
              {currentStep === 5 && isOTA && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="osot_work_declaration"
                          control={control}
                          render={({ field }) => (
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id="osot_work_declaration" />
                          )}
                        />
                        <Label htmlFor="osot_work_declaration" className="text-sm font-normal">
                          Work Declaration <span className="text-destructive">*</span>
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="osot_ota_degree_type">Degree Type (Optional)</Label>
                      <Controller
                        name="osot_ota_degree_type"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select degree type" />
                            </SelectTrigger>
                            <SelectContent>
                              {degreeTypeOptions.map((option) => (
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
                      <Label htmlFor="osot_ota_college">College (Optional)</Label>
                      <Controller
                        name="osot_ota_college"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select college" />
                            </SelectTrigger>
                            <SelectContent>
                              {otaCollegeOptions.map((option) => (
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
                      <Label htmlFor="osot_ota_grad_year">Graduation Year (Optional)</Label>
                      <Controller
                        name="osot_ota_grad_year"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select graduation year" />
                            </SelectTrigger>
                            <SelectContent>
                              {graduationYearOptions.map((option) => (
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
                      <Label htmlFor="osot_ota_country">Country (Optional)</Label>
                      <Controller
                        name="osot_ota_country"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining steps will be added in next response due to length */}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                )}
                {currentStep < totalSteps && (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className={`py-3 rounded-lg font-medium transition-all duration-200 bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 ${currentStep === 1 ? 'w-full' : 'flex-1'}`}
                  >
                    Continue
                  </button>
                )}
                {currentStep === totalSteps && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-lg font-medium transition-all duration-200 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      'Complete Registration'
                    )}
                  </button>
                )}
              </div>
            </form>
          </MultiStepFormContainer>
  );

  if (renderContentOnly) {
    return formContent;
  }

  return (
    <AuthLayout
      showBrandPanel={true}
      brandContent={<MultiStepProgress steps={steps} currentStep={currentStep} />}
    >
      {formContent}
    </AuthLayout>
  );
}
