import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthFormContainer, AuthInput, AuthButton } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/authService';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { useAuthLayoutContext } from '@/contexts/AuthLayoutContext';

const loginSchema = z.object({
  osot_email: z.string().email('Please enter a valid email'),
  osot_password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { triggerFadeOut } = useAuthLayoutContext();

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
    setLoginError(null);
    
    try {
      const { osot_email, osot_password } = data;
      const response = await authService.login({ osot_email, osot_password });
      
      if (data.rememberMe) {
        localStorage.setItem('saved_email', data.osot_email);
      } else {
        localStorage.removeItem('saved_email');
      }

      toast.success('Login successful!');
      
      // Redirect based on privilege level and account group
      // We need to fetch the profile to check account_group reliably
      // 1=OWNER(menor), 2=ADMIN(médio), 3=MAIN(maior) - Higher number = Higher privilege
      let redirectPath = '/user/dashboard'; // Default fallback
      
      console.log('🔐 Login Response (full):', response);
      console.log('🔐 Login Response (details):', {
        privilege: response.privilege,
        role: response.role,
        userType: response.userType,
        user: response.user
      });
      
      // Try to determine if user is STAFF
      // Option 1: Check role (backend may return 'STAFF', 'staff', 'main', 'admin', etc)
      // Option 2: Check user.osot_account_group === 7
      const isStaff = response.role?.toUpperCase() === 'STAFF' || 
                      response.role?.toUpperCase() === 'MAIN' ||
                      response.role?.toUpperCase() === 'ADMIN' ||
                      response.user?.osot_account_group === 7;
      
      const hasAdminPrivilege = response.privilege >= 2;
      
      console.log('🔍 Access Check:', {
        isStaff,
        hasAdminPrivilege,
        willRedirectToAdmin: isStaff && hasAdminPrivilege
      });
      
      if (isStaff && hasAdminPrivilege) {
        // STAFF with ADMIN (2) or MAIN (3) → Admin Interface
        redirectPath = '/admin/dashboard';
        console.log('✅ Redirecting to ADMIN dashboard');
      } else {
        // Everyone else → User Interface
        redirectPath = '/user/dashboard';
        console.log('✅ Redirecting to USER dashboard');
      }
      
      console.log('🚀 Final redirect path:', redirectPath);
      
      // Fade out and navigate
      if (triggerFadeOut) {
        triggerFadeOut(() => navigate(redirectPath));
      } else {
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Login error caught:', error);
      const { code } = extractErrorInfo(error);
      const errorMessage = getErrorMessage(code, 'Invalid email or password. Please check your credentials and try again.');
      setLoginError(errorMessage);
      setTimeout(() => setLoginError(null), 10000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

        <div className="space-y-2">
          <label htmlFor="osot_password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="osot_password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={`
                w-full py-3 pl-11 pr-12 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                transition-all duration-200
                ${errors.osot_password?.message ? 'border-red-500' : 'border-gray-300'}
              `}
              {...register('osot_password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none bg-transparent border-0"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-[16px] h-[16px]" />
              ) : (
                <Eye className="w-[16px] h-[16px]" />
              )}
            </button>
          </div>
          {errors.osot_password?.message && (
            <p className="text-sm text-red-600 mt-1">{errors.osot_password.message}</p>
          )}
        </div>

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
            to="/auth/register"
            className="text-sm text-brand-500 hover:text-brand-600 transition-colors font-semibold"
          >
            Register now
          </Link>
        </div>
      </form>
    </AuthFormContainer>
  );
}
