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
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ArrowLeft, Loader2, AlertCircle, MapPin, Lock } from 'lucide-react';
import { enumService, type EnumOption } from '@/services/enumService';
import { affiliateService, type AffiliateRegistrationData } from '@/services/affiliateService';
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
  
  const visibleLocal = localPart.length > 2 ? localPart.substring(0, 2) : localPart.substring(0, 1);
  const maskedLocal = visibleLocal + '*'.repeat(Math.max(1, localPart.length - visibleLocal.length));
  
  const visibleDomain = domainName.length > 3 ? domainName.substring(0, 3) : domainName.substring(0, 1);
  const maskedDomain = visibleDomain + '*'.repeat(Math.max(1, domainName.length - visibleDomain.length));
  
  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

// Form validation schema matching CreateAffiliateDto
const affiliateRegistrationSchema = z
  .object({
    // Organization Information
    osot_affiliate_name: z
      .string()
      .min(1, 'Organization name is required')
      .max(255, 'Organization name must be less than 255 characters'),
    osot_affiliate_area: z.string().min(1, 'Business area is required'),

    // Representative Information
    osot_representative_first_name: z
      .string()
      .min(1, 'First name is required')
      .max(255, 'First name must be less than 255 characters'),
    osot_representative_last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(255, 'Last name must be less than 255 characters'),
    osot_representative_job_title: z
      .string()
      .min(1, 'Job title is required')
      .max(255, 'Job title must be less than 255 characters'),

    // Contact Information
    osot_affiliate_email: z
      .string()
      .email('Invalid email address')
      .max(255, 'Email must be less than 255 characters'),
    osot_affiliate_phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format: (XXX) XXX-XXXX'),
    osot_affiliate_website: z
      .string()
      .url('Invalid website URL')
      .max(255, 'Website must be less than 255 characters')
      .optional()
      .or(z.literal('')),

    // Address Information
    osot_affiliate_address_1: z
      .string()
      .min(1, 'Address is required')
      .max(255, 'Address must be less than 255 characters'),
    osot_affiliate_address_2: z
      .string()
      .max(255, 'Address line 2 must be less than 255 characters')
      .optional()
      .or(z.literal('')),
    osot_affiliate_city: z.string().min(1, 'City is required'),
    osot_affiliate_province: z.string().min(1, 'Province is required'),
    osot_affiliate_postal_code: z
      .string()
      .min(1, 'Postal code is required')
      .max(7, 'Postal code must be less than 7 characters')
      .regex(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, 'Invalid Canadian postal code format'),
    osot_affiliate_country: z.string().min(1, 'Country is required'),

    // Security Information
    osot_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    osot_confirm_password: z.string(),
    osot_account_declaration: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.osot_password === data.osot_confirm_password, {
    message: "Passwords don't match",
    path: ['osot_confirm_password'],
  });

type AffiliateRegistrationForm = z.infer<typeof affiliateRegistrationSchema>;

interface RegisterAffiliatePageProps {
  renderContentOnly?: boolean;
}

export default function RegisterAffiliatePage({ renderContentOnly = false }: RegisterAffiliatePageProps = {}) {
  const navigate = useNavigate();
  const { isWithinAuthPagesLayout, setBrandContent } = useAuthLayoutContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isDuplicateError, setIsDuplicateError] = useState(false);

  // Enum options from API
  const [affiliateAreaOptions, setAffiliateAreaOptions] = useState<EnumOption[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<EnumOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<EnumOption[]>([]);
  const [cityOptions, setCityOptions] = useState<EnumOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<AffiliateRegistrationForm>({
    resolver: zodResolver(affiliateRegistrationSchema),
    defaultValues: {
      osot_affiliate_name: '',
      osot_affiliate_area: '',
      osot_representative_first_name: '',
      osot_representative_last_name: '',
      osot_representative_job_title: '',
      osot_affiliate_email: '',
      osot_affiliate_phone: '',
      osot_affiliate_website: '',
      osot_affiliate_address_1: '',
      osot_affiliate_address_2: '',
      osot_affiliate_city: '',
      osot_affiliate_province: '',
      osot_affiliate_postal_code: '',
      osot_affiliate_country: '1', // Default to Canada
      osot_password: '',
      osot_confirm_password: '',
      osot_account_declaration: false,
    },
  });

  const steps: Step[] = useMemo(() => [
    { 
      number: 1, 
      title: 'Organization', 
      icon: Building2,
      fields: ['osot_affiliate_name', 'osot_affiliate_area', 'osot_representative_first_name', 'osot_representative_last_name', 'osot_representative_job_title']
    },
    { 
      number: 2, 
      title: 'Contact', 
      icon: MapPin,
      fields: ['osot_affiliate_email', 'osot_affiliate_phone', 'osot_affiliate_website', 'osot_affiliate_address_1', 'osot_affiliate_city', 'osot_affiliate_province', 'osot_affiliate_postal_code', 'osot_affiliate_country']
    },
    { 
      number: 3, 
      title: 'Security', 
      icon: Lock,
      fields: ['osot_password', 'osot_confirm_password', 'osot_account_declaration']
    },
  ], []);

  // Pass brand content to parent AuthLayout via context
  useEffect(() => {
    if (isWithinAuthPagesLayout && setBrandContent) {
      setBrandContent(<MultiStepProgress steps={steps} currentStep={currentStep} />);
    }
  }, [currentStep, steps, isWithinAuthPagesLayout, setBrandContent]);

  const handleNext = async () => {
    const currentStepFields = steps[currentStep - 1].fields as (keyof AffiliateRegistrationForm)[];
    const isValid = await trigger(currentStepFields);

    if (isValid) {
      setCurrentStep(Math.min(currentStep + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  // Load enums from API on component mount
  useEffect(() => {
    const loadEnums = async () => {
      setIsLoadingEnums(true);
      try {
        const enums = await enumService.getAllEnums();
        setAffiliateAreaOptions(enums.affiliateAreas);
        setProvinceOptions(enums.provinces);
        setCountryOptions(enums.countries);
        setCityOptions(enums.cities);
      } catch (error) {
        console.error('Failed to load enums:', error);
        toast.error('Error loading form options', {
          description: 'Please refresh the page to try again.',
          duration: 5000,
        });
      } finally {
        setIsLoadingEnums(false);
      }
    };

    loadEnums();
  }, []);

  const onSubmit = async (data: AffiliateRegistrationForm) => {
    setIsLoading(true);
    setRegistrationError(null); // Clear previous errors
    setIsDuplicateError(false); // Clear duplicate flag
    
    try {
      // Convert string enum values to numbers for API
      const apiData: AffiliateRegistrationData = {
        osot_affiliate_name: data.osot_affiliate_name,
        osot_affiliate_area: parseInt(data.osot_affiliate_area, 10),
        osot_representative_first_name: data.osot_representative_first_name,
        osot_representative_last_name: data.osot_representative_last_name,
        osot_representative_job_title: data.osot_representative_job_title,
        osot_affiliate_email: data.osot_affiliate_email,
        osot_affiliate_phone: data.osot_affiliate_phone,
        osot_affiliate_website: data.osot_affiliate_website || undefined,
        osot_affiliate_address_1: data.osot_affiliate_address_1,
        osot_affiliate_address_2: data.osot_affiliate_address_2 || undefined,
        osot_affiliate_city: parseInt(data.osot_affiliate_city, 10),
        osot_affiliate_province: parseInt(data.osot_affiliate_province, 10),
        osot_affiliate_postal_code: data.osot_affiliate_postal_code,
        osot_affiliate_country: parseInt(data.osot_affiliate_country, 10),
        osot_password: data.osot_password,
        osot_account_declaration: data.osot_account_declaration,
      };

      const response = await affiliateService.register(apiData);

      // Check if sessionId is undefined (validation failed but backend returned 200)
      if (!response.sessionId || response.sessionId === 'undefined') {
        console.error('❌ Registration returned undefined sessionId - possible validation failure');
        
        // Check if it's a duplicate error message
        const message = response.message || '';
        const isDuplicateError = message.toLowerCase().includes('already exists') || 
                                message.toLowerCase().includes('duplicate') ||
                                message.toLowerCase().includes('same name');
        
        if (isDuplicateError) {
          // Navigate to duplicate error page
          navigate('/auth/register/duplicate-error', {
            state: {
              message: message || 'An account with these details already exists.',
              maskedEmail: data.osot_affiliate_email ? maskEmail(data.osot_affiliate_email) : 'unknown@email.com',
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
        description: response.message || 'Please check your email to verify your account.',
        duration: 5000,
      });

      // Navigate to success page (same as professional registration)
      navigate(`/auth/register/success/${response.sessionId}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check for HTTP 409 Conflict (Duplicate Account)
      if (error?.response?.status === 409) {
        const errorData = error.response.data;
        console.log('🔍 Duplicate account error data:', errorData);
        console.log('🔍 Masked email from backend:', errorData.maskedEmail);
        
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
      const { code, httpStatus } = extractErrorInfo(error);
      
      // Custom messages for common registration errors
      let customMessage: string | undefined;
      let isDuplicate = false;
      
      // Check for duplicate using HTTP status 409 (Conflict) or error code 2001
      if (httpStatus === 409 || code === 2001 || code === 409) {
        isDuplicate = true;
        customMessage = 'This email or organization name is already registered.';
      }
      // Bad Request - could be validation error
      else if (httpStatus === 400 || code === 400) {
        customMessage = 'Invalid registration data. Please check all fields and try again.';
      }
      // Error code 2002: Invalid data format
      else if (code === 2002) {
        customMessage = 'Please check all fields for errors. Make sure the postal code, phone number, and website URL are in the correct format.';
      }
      // Error code 2003: Password validation failed
      else if (code === 2003) {
        customMessage = 'Password does not meet security requirements. Please ensure it has at least 8 characters with uppercase, lowercase, number, and special character.';
      }
      
      const errorMessage = getErrorMessage(
        code,
        customMessage || 'Registration failed. Please check your information and try again.'
      );
      
      setRegistrationError(errorMessage);
      setIsDuplicateError(isDuplicate);
      
      // Also show toast notification for better visibility
      toast.error('Registration Failed', {
        description: errorMessage,
        duration: 8000,
      });
      
      // Auto-clear error alert after 15 seconds
      setTimeout(() => {
        setRegistrationError(null);
        setIsDuplicateError(false);
      }, 15000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEnums) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  const stepDescriptions: Record<number, string> = {
    1: 'Organization and representative information',
    2: 'Contact details and address',
    3: 'Create your account credentials',
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
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{registrationError}</p>
                      {isDuplicateError && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <Link to="/auth/login">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              Try Login
                            </Button>
                          </Link>
                          <Link to="/auth/forgot-password">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              Recover Password
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Step 1: Organization & Representative Information */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-900">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="osot_affiliate_name">
                      Organization Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="osot_affiliate_name"
                      {...register('osot_affiliate_name')}
                      placeholder="Enter your organization name"
                      disabled={isLoading}
                    />
                    {errors.osot_affiliate_name && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="osot_affiliate_area">
                      Business Area <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="osot_affiliate_area"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select business area" />
                          </SelectTrigger>
                          <SelectContent>
                            {affiliateAreaOptions.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.osot_affiliate_area && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_area.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-900">Representative Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="osot_representative_first_name">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="osot_representative_first_name"
                      {...register('osot_representative_first_name')}
                      placeholder="First name"
                      disabled={isLoading}
                    />
                    {errors.osot_representative_first_name && (
                      <p className="text-sm text-destructive">
                        {errors.osot_representative_first_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="osot_representative_last_name">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="osot_representative_last_name"
                      {...register('osot_representative_last_name')}
                      placeholder="Last name"
                      disabled={isLoading}
                    />
                    {errors.osot_representative_last_name && (
                      <p className="text-sm text-destructive">
                        {errors.osot_representative_last_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="osot_representative_job_title">
                      Job Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="osot_representative_job_title"
                      {...register('osot_representative_job_title')}
                      placeholder="e.g., Director, Manager, etc."
                      disabled={isLoading}
                    />
                    {errors.osot_representative_job_title && (
                      <p className="text-sm text-destructive">
                        {errors.osot_representative_job_title.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

                </>
              )}

              {/* Step 2: Contact & Address Information */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="osot_affiliate_email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="osot_affiliate_email"
                      type="email"
                      {...register('osot_affiliate_email')}
                      placeholder="contact@organization.com"
                      disabled={isLoading}
                    />
                    {errors.osot_affiliate_email && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="osot_affiliate_phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="osot_affiliate_phone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="osot_affiliate_phone"
                          type="tel"
                          placeholder="5551234567"
                          disabled={isLoading}
                          value={field.value || ''}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                    {errors.osot_affiliate_phone && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="osot_affiliate_website">Website (Optional)</Label>
                    <Input
                      id="osot_affiliate_website"
                      type="url"
                      {...register('osot_affiliate_website')}
                      placeholder="https://www.organization.com"
                      disabled={isLoading}
                    />
                    {errors.osot_affiliate_website && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_website.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-900">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="osot_affiliate_address_1">
                      Address Line 1 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="osot_affiliate_address_1"
                      {...register('osot_affiliate_address_1')}
                      placeholder="Street address"
                      disabled={isLoading}
                    />
                    {errors.osot_affiliate_address_1 && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_address_1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="osot_affiliate_address_2">Address Line 2 (Optional)</Label>
                    <Input
                      id="osot_affiliate_address_2"
                      {...register('osot_affiliate_address_2')}
                      placeholder="Apartment, suite, etc."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="osot_affiliate_city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="osot_affiliate_city"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
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
                    {errors.osot_affiliate_city && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="osot_affiliate_province">
                      Province <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="osot_affiliate_province"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
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
                    {errors.osot_affiliate_province && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_province.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="osot_affiliate_postal_code">
                      Postal Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="osot_affiliate_postal_code"
                      {...register('osot_affiliate_postal_code')}
                      placeholder="A1A 1A1"
                      disabled={isLoading}
                    />
                    {errors.osot_affiliate_postal_code && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_postal_code.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="osot_affiliate_country">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="osot_affiliate_country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
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
                    {errors.osot_affiliate_country && (
                      <p className="text-sm text-destructive">
                        {errors.osot_affiliate_country.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

                </>
              )}

              {/* Step 3: Security Information */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-900">Security Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="osot_password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <PasswordInput
                      id="osot_password"
                      {...register('osot_password')}
                      placeholder="Enter password"
                      disabled={isLoading}
                    />
                    {errors.osot_password && (
                      <p className="text-sm text-destructive">{errors.osot_password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, number, and special
                      character
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="osot_confirm_password">
                      Confirm Password <span className="text-destructive">*</span>
                    </Label>
                    <PasswordInput
                      id="osot_confirm_password"
                      {...register('osot_confirm_password')}
                      placeholder="Confirm password"
                      disabled={isLoading}
                    />
                    {errors.osot_confirm_password && (
                      <p className="text-sm text-destructive">
                        {errors.osot_confirm_password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Controller
                    name="osot_account_declaration"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="osot_account_declaration"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="osot_account_declaration"
                      className="text-sm font-normal cursor-pointer"
                    >
                      I agree to the terms and conditions{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    {errors.osot_account_declaration && (
                      <p className="text-sm text-destructive">
                        {errors.osot_account_declaration.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
                </>
              )}

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
            {currentStep < steps.length && (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="flex-1 py-3 rounded-lg font-medium transition-all duration-200 bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {currentStep === steps.length && (
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
                  'Register Organization'
                )}
              </button>
            )}
          </div>

          {currentStep === steps.length && (
            <p className="text-sm text-center text-gray-600 pt-4">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-brand-500 hover:text-brand-600 transition-colors font-semibold">
                Sign in
              </Link>
            </p>
          )}
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
