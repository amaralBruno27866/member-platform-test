import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthFormContainer, AuthInput, AuthButton } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      'Password must contain uppercase, lowercase, number and special character (@$!%*?&#)'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('newPassword');

  // Verifica se o token existe na URL
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const getPasswordStrength = (pwd: string): { strength: string; color: string; width: string } => {
    if (!pwd) return { strength: '', color: '', width: '0%' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&#]/.test(pwd)) strength++;

    if (strength <= 2) return { strength: 'Weak', color: 'bg-red-500', width: '33%' };
    if (strength <= 4) return { strength: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { strength: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/password-recovery/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      // Bad request (validation errors or invalid token)
      if (response.status === 400) {
        try {
          const errorData = await response.json();
          const errorMessage = Array.isArray(errorData.message)
            ? errorData.message[0]
            : errorData.message || 'Invalid token or password does not meet requirements';
          setError(errorMessage);
        } catch {
          setError('Invalid token or password does not meet requirements');
        }
        return;
      }

      // Rate limiting
      if (response.status === 429) {
        setError('Too many attempts. Please wait a few minutes before trying again.');
        return;
      }

      // Server permission errors (backend misconfiguration)
      if (response.status === 403) {
        setError('Server configuration error. Please contact support with error code: 403');
        return;
      }

      // Server errors
      if (response.status >= 500) {
        const errorText = response.status === 502 ? 'Server is temporarily unavailable' :
                         response.status === 503 ? 'Service temporarily unavailable' :
                         'Internal server error';
        setError(`${errorText}. Please try again later or contact support with error code: ${response.status}`);
        return;
      }

      // Success
      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => navigate('/auth/login'), 3000);
      } else {
        // Other unexpected errors
        setError(`Unexpected error (${response.status}). Please contact support if this persists.`);
      }
    } catch {
      setError('Unable to connect to server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Se não houver token na URL, mostra erro
  if (!token) {
    return (
      <AuthFormContainer
        title="Invalid Link"
        description="The password reset link is invalid or incomplete"
      >
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Invalid or missing reset token'}</AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <Link to="/auth/forgot-password">
              <AuthButton variant="secondary" className="w-full">
                Request New Reset Link
              </AuthButton>
            </Link>
            <Link to="/auth/login">
              <AuthButton variant="secondary" className="w-full">
                Back to Login
              </AuthButton>
            </Link>
          </div>
        </div>
      </AuthFormContainer>
    );
  }

  return (
    <AuthFormContainer
      title="Reset Password"
      description="Create a strong new password for your account"
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Password Requirements */}
          <Alert className="bg-brand-50 border-brand-200">
            <Shield className="h-4 w-4 text-brand-600" />
            <AlertDescription className="text-xs text-brand-800 space-y-1">
              <p className="font-semibold">Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (@$!%*?&#)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* New Password */}
          <div className="space-y-2">
            <AuthInput
              label="New Password"
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              icon={<Lock className="w-5 h-5" />}
              error={errors.newPassword?.message}
              register={register('newPassword')}
              disabled={isLoading}
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={`font-semibold ${
                    passwordStrength.strength === 'Strong' ? 'text-green-600' :
                    passwordStrength.strength === 'Medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <AuthInput
            label="Confirm Password"
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.confirmPassword?.message}
            register={register('confirmPassword')}
            disabled={isLoading}
            showPasswordToggle
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <AuthButton
            type="submit"
            isLoading={isLoading}
          >
            {!isLoading && <Lock className="mr-2 h-4 w-4" />}
            Reset Password
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
            <h3 className="text-2xl font-bold text-gray-900">Password Reset Successful!</h3>
            <p className="text-base text-gray-600">
              Your password has been updated successfully.
            </p>
            <p className="text-sm text-gray-500 pt-2">
              Redirecting to login page...
            </p>
          </div>

          <div className="pt-4">
            <Link to="/auth/login">
              <AuthButton className="w-full">
                Continue to Login
              </AuthButton>
            </Link>
          </div>
        </div>
      )}
    </AuthFormContainer>
  );
}
