import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompleteUserRegistrationDto } from '@/types/registration';
import { authService } from '@/services/authService';
import StepAccount from './steps/StepAccount';

export default function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const methods = useForm<CompleteUserRegistrationDto>({
    defaultValues: {
      account: {
        osot_account_declaration: false,
        osot_account_group: 1,
      },
      educationType: 'ot',
      address: {
        osot_address_1: '',
        osot_city: 1,
        osot_province: 1,
        osot_postal_code: '',
        osot_country: 1,
        osot_address_type: 1,
        osot_address_preference: [1],
      },
      contact: {},
      identity: {
        osot_language: [13],
        osot_gender: 1,
        osot_race: 1,
        osot_indigenous: false,
        osot_disability: false,
      },
      otEducation: {
        osot_coto_status: 1,
        osot_coto_registration: '',
        osot_ot_degree_type: 1,
        osot_ot_university: 1,
        osot_ot_grad_year: 1,
        osot_ot_country: 1,
      },
    },
  });

  const onSubmit = async (data: CompleteUserRegistrationDto) => {
    setIsSubmitting(true);
    try {
      const result = await authService.register(data);
      
      if (result.success) {
        toast.success('Registration submitted successfully! Please check your email for verification.');
        navigate('/auth/login');
      } else {
        toast.error(result.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      setCurrentStep(2);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        <CardDescription className="text-center">
          Step {currentStep} of 2: {currentStep === 1 ? 'Account Information' : 'Review & Submit'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && <StepAccount />}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                  <h3 className="font-semibold text-brand-900 mb-2">Review Your Information</h3>
                  <div className="space-y-1 text-sm text-brand-800">
                    <p><strong>Name:</strong> {methods.watch('account.osot_first_name')} {methods.watch('account.osot_last_name')}</p>
                    <p><strong>Email:</strong> {methods.watch('account.osot_email')}</p>
                    <p><strong>Account Type:</strong> {methods.watch('account.osot_account_group') === 1 ? 'Occupational Therapist' : 'OT Assistant'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Note: This is a simplified registration. Additional information (address, contact, identity, education) will be set to default values.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
              )}
              {currentStep === 1 ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="ml-auto">
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </Button>
              )}
            </div>
          </form>
        </FormProvider>

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-brand-600 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
