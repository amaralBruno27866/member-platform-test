import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { AuthButton } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegistrationSuccessContent() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

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
            <div className="rounded-full bg-green-100 p-4 sm:p-5">
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
            </div>
          </motion.div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Your account has been created successfully
            </p>
          </div>
        </div>

        {/* Email Verification Notice */}
        <Alert className="bg-brand-50 border-brand-200">
          <Mail className="h-5 w-5 text-brand-600" />
          <AlertDescription className="text-sm text-brand-900">
            <strong className="block mb-2 text-base">Verify Your Email Address</strong>
            <p className="mb-2">
              We've sent a verification email. Check your inbox and click the verification link.
            </p>
            <p className="font-medium">
              <strong>Important:</strong> You must verify your email before you can log in.
            </p>
          </AlertDescription>
        </Alert>

        {/* Two Column Layout - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next Steps */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-3 text-base">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>Wait for admin approval</li>
              <li>You'll receive a confirmation email</li>
              <li>Log in and start using the platform</li>
            </ol>
          </div>

          {/* Right Column: Session ID + Help */}
          <div className="space-y-4">
            {/* Session Information */}
            {sessionId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2 font-medium">Session ID:</p>
                <p className="font-mono text-sm text-gray-900 break-all mb-2">{sessionId}</p>
                <p className="text-xs text-gray-500">
                  Save this ID for your records.
                </p>
              </div>
            )}

            {/* Help Notice */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-sm text-amber-900">
                <strong className="block mb-2">Didn't receive the email?</strong>
                <p>
                  Check your spam folder or request a new verification email from the login page.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <AuthButton
            onClick={() => navigate('/auth/login')}
            className="!w-auto px-6 py-2 inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </AuthButton>
        </div>
      </div>
    </motion.div>
  );
}
