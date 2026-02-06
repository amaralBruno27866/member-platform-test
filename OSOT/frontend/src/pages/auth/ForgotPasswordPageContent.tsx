import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthFormContainer, AuthInput, AuthButton } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/password-recovery/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (response.status === 429) {
        setError('Too many requests. Please wait a few minutes before trying again.');
        return;
      }

      if (response.status === 403) {
        setError('Server configuration error. Please contact support with error code: 403');
        return;
      }

      if (response.status >= 500) {
        const errorText = response.status === 502 ? 'Server is temporarily unavailable' :
                         response.status === 503 ? 'Service temporarily unavailable' :
                         'Internal server error';
        setError(`${errorText}. Please try again later or contact support with error code: ${response.status}`);
        return;
      }

      if (response.status === 400) {
        try {
          const errorData = await response.json();
          const errorMessage = Array.isArray(errorData.message) 
            ? errorData.message[0] 
            : errorData.message || 'Invalid request. Please check your email address.';
          setError(errorMessage);
        } catch {
          setError('Invalid request. Please check your email address.');
        }
        return;
      }

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(`Unexpected error (${response.status}). Please contact support if this persists.`);
      }
    } catch {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="Reset Password"
      description="Enter your email and we'll send you instructions to reset your password"
      backLink={
        !isSuccess && (
          <Link
            to="/auth/login"
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to login
          </Link>
        )
      }
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AuthInput
            label="Email"
            id="email"
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            register={register('email')}
            disabled={isLoading}
          />

          <AuthButton
            type="submit"
            isLoading={isLoading}
          >
            Send Reset Link
          </AuthButton>
        </form>
      ) : (
        <div className="space-y-6 text-center py-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Check Your Email</h3>
            <p className="text-base text-gray-600">
              If an account exists with this email, you'll receive a password reset link shortly.
            </p>
            <p className="text-sm text-gray-500 pt-2">
              The link will expire in 30 minutes.
            </p>
          </div>

          <Alert className="bg-brand-50 border-brand-200 text-left">
            <Mail className="h-4 w-4 text-brand-600" />
            <AlertDescription className="text-sm text-brand-800">
              <strong>Didn't receive the email?</strong> Check your spam folder or try again in a few minutes.
            </AlertDescription>
          </Alert>

          <div className="pt-4">
            <Link to="/auth/login">
              <AuthButton variant="secondary" className="flex items-center justify-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Login
              </AuthButton>
            </Link>
          </div>
        </div>
      )}
    </AuthFormContainer>
  );
}
