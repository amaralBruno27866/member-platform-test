import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Mail, Key, ArrowLeft, HelpCircle } from 'lucide-react';
import { AuthButton } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationState {
  message: string;
  maskedEmail: string;
  suggestion?: string;
}

export default function RegistrationDuplicateErrorContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // Se não há dados de erro (acesso direto à URL), redirecionar para registro
  if (!state || !state.message || !state.maskedEmail) {
    return <Navigate to="/auth/register" replace />;
  }

  const { message, maskedEmail } = state;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full flex items-center justify-center px-4 sm:px-8 md:px-12 py-8"
    >
      <div className="w-full max-w-3xl space-y-6">
        {/* Header with Icon and Title */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="rounded-full bg-amber-100 p-4 sm:p-5">
              <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-amber-600" />
            </div>
          </motion.div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Account Already Registered
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {message}
            </p>
          </div>
        </div>

        {/* Masked Email Display */}
        <Alert className="bg-gray-50 border-gray-300">
          <Mail className="h-5 w-5 text-gray-600" />
          <AlertDescription>
            <p className="text-sm text-gray-600 mb-2 font-medium">Registered email:</p>
            <p className="font-mono text-base text-gray-900 break-all">
              {maskedEmail}
            </p>
          </AlertDescription>
        </Alert>

        {/* Two Column Layout - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What You Can Do */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-3 text-base">What you can do:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Log in with your existing credentials</li>
              <li>Recover your password if you forgot it</li>
              <li>Verify if your email has been confirmed</li>
              <li>Contact support if you need assistance</li>
            </ol>
          </div>

          {/* Help Notice */}
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong className="block mb-2">Why am I seeing this?</strong>
                <p>
                  To protect your privacy and prevent duplicate accounts, our system 
                  detected that an account already exists with your information.
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-sm text-amber-900">
                <strong className="block mb-2">Don't recognize this account?</strong>
                <p>
                  Contact our support at{' '}
                  <a 
                    href="mailto:support@osot.ca" 
                    className="text-amber-700 hover:text-amber-800 font-medium underline"
                  >
                    support@osot.ca
                  </a>
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <AuthButton
            onClick={() => navigate('/auth/login')}
            className="!w-full sm:!w-auto px-6 py-2.5 inline-flex items-center justify-center text-sm bg-brand-600 hover:bg-brand-700"
          >
            <Mail className="mr-2 h-4 w-4" />
            Log In
          </AuthButton>

          <AuthButton
            onClick={() => navigate('/auth/forgot-password')}
            variant="secondary"
            className="!w-full sm:!w-auto px-6 py-2.5 inline-flex items-center justify-center text-sm"
          >
            <Key className="mr-2 h-4 w-4" />
            Forgot Password
          </AuthButton>
        </div>

        {/* Back to Register Link */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/auth/register')}
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to registration
          </button>
        </div>
      </div>
    </motion.div>
  );
}
