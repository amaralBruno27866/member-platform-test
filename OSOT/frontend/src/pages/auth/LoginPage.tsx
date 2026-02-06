import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout, AuthFormContainer, AuthInput, AuthButton } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/authService';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';

const loginSchema = z.object({
  osot_email: z.string().email('Please enter a valid email'),
  osot_password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setValue('osot_email', savedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null); // Clear previous errors
    
    try {
      // Extract only the fields needed for the API (exclude rememberMe)
      const { osot_email, osot_password } = data;
      const response = await authService.login({ osot_email, osot_password });
      
      if (data.rememberMe) {
        localStorage.setItem('saved_email', data.osot_email);
      } else {
        localStorage.removeItem('saved_email');
      }

      toast.success('Login successful!');
      
      // Redirect based on privilege level
      let redirectPath = '/user/dashboard'; // Default fallback
      
      console.log('🔐 Login Response:', {
        privilege: response.privilege,
        role: response.role,
        userType: response.userType
      });
      
      if (response.privilege === 3 || response.privilege === 2) {
        // MAIN (3) or ADMIN (2) → Admin Interface
        redirectPath = '/admin/dashboard';
        console.log('✅ Redirecting to ADMIN dashboard (privilege >= 2)');
      } else if (response.privilege === 1) {
        // OWNER (1) → User Interface
        redirectPath = '/user/dashboard';
        console.log('✅ Redirecting to USER dashboard (privilege = 1)');
      } else {
        console.warn('⚠️ Unknown privilege level:', response.privilege, '- Using default redirect');
      }
      
      console.log('🚀 Final redirect path:', redirectPath);
      
      navigate(redirectPath);
    } catch (error) {
      console.error('Login error caught:', error);
      // Extract error info and show in form
      const { code } = extractErrorInfo(error);
      const errorMessage = getErrorMessage(code, 'Invalid email or password. Please check your credentials and try again.');
      setLoginError(errorMessage);
      
      // Auto-clear error after 10 seconds
      setTimeout(() => setLoginError(null), 10000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout formType="login" showBrandPanel={true}>
      <AuthFormContainer
        title="Welcome Back"
        description="Please enter your details to sign in"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {loginError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {loginError}
              </AlertDescription>
            </Alert>
          )}
          
          <AuthInput
            label="Email"
            id="osot_email"
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-5 h-5" />}
            error={errors.osot_email?.message}
            register={register('osot_email')}
          />

          <AuthInput
            label="Password"
            id="osot_password"
            type="password"
            placeholder="Enter your password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.osot_password?.message}
            register={register('osot_password')}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={watch('rememberMe')}
                onChange={(e) => setValue('rememberMe', e.target.checked)}
                className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
              />
              <span className="ml-2 text-sm text-gray-700">Remember me</span>
            </label>

            <Link
              to="/auth/forgot-password"
              className="text-sm text-brand-500 hover:text-brand-600 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <AuthButton
            type="submit"
            isLoading={isLoading}
          >
            Sign In
          </AuthButton>

          <div className="text-center">
            <span className="text-sm text-gray-600">Don't have an account? </span>
            <Link
              to="/register"
              className="text-sm text-brand-500 hover:text-brand-600 transition-colors font-semibold"
            >
              Register now
            </Link>
          </div>
        </form>
      </AuthFormContainer>
    </AuthLayout>
  );
}