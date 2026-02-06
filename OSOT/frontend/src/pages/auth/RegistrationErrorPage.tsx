import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

export default function RegistrationErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const errorMessage = searchParams.get('message') || 'An unexpected error occurred during registration';
  const errorCode = searchParams.get('code');
  const canRetry = searchParams.get('retry') !== 'false';

  const getErrorTitle = () => {
    if (errorCode === 'EMAIL_EXISTS') return 'Email Already Registered';
    if (errorCode === 'VALIDATION_ERROR') return 'Invalid Information';
    if (errorCode === 'NETWORK_ERROR') return 'Connection Failed';
    if (errorCode === 'SERVER_ERROR') return 'Server Error';
    return 'Registration Failed';
  };

  const getErrorDetails = () => {
    if (errorCode === 'EMAIL_EXISTS') {
      return 'The email address you provided is already associated with an existing account. Please use a different email or try logging in.';
    }
    if (errorCode === 'VALIDATION_ERROR') {
      return 'Some of the information you provided did not meet our requirements. Please review your information and try again.';
    }
    if (errorCode === 'NETWORK_ERROR') {
      return 'We couldn\'t connect to our servers. Please check your internet connection and try again.';
    }
    if (errorCode === 'SERVER_ERROR') {
      return 'Our servers are experiencing technical difficulties. Please try again later or contact support if the problem persists.';
    }
    return errorMessage;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-red-100">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-red-600">
            {getErrorTitle()}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            We encountered a problem processing your registration
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  What Happened?
                </h3>
                <p className="text-sm text-red-800 leading-relaxed">
                  {getErrorDetails()}
                </p>
              </div>
            </div>
          </div>

          {/* Error Code (if provided) */}
          {errorCode && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm">
                <p className="text-gray-600 mb-1">Error Code:</p>
                <p className="font-mono text-gray-900">{errorCode}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Reference this code when contacting support for faster assistance.
                </p>
              </div>
            </div>
          )}

          {/* What You Can Do */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">What You Can Do:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              {canRetry && (
                <li>Review your information and try registering again</li>
              )}
              {errorCode === 'EMAIL_EXISTS' && (
                <>
                  <li>Try logging in if you already have an account</li>
                  <li>Use a different email address</li>
                  <li>Use the "Forgot Password" option if you can't remember your password</li>
                </>
              )}
              {errorCode === 'NETWORK_ERROR' && (
                <>
                  <li>Check your internet connection</li>
                  <li>Try again in a few moments</li>
                </>
              )}
              {errorCode === 'SERVER_ERROR' && (
                <>
                  <li>Wait a few minutes and try again</li>
                  <li>Contact our support team if the issue persists</li>
                </>
              )}
              {!errorCode && (
                <>
                  <li>Double-check all required fields are filled correctly</li>
                  <li>Ensure your password meets all requirements</li>
                  <li>Try using a different browser if the problem continues</li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Support */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-brand-600 mt-0.5" />
              <div>
                <p className="text-sm text-brand-900">
                  <strong>Need Help?</strong> If you continue to experience issues, please contact our support team. 
                  Include the error code above (if shown) for faster assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/auth/login')} 
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
            {canRetry && (
              <Button 
                onClick={() => navigate('/register/professional')} 
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>

          {/* Additional Help */}
          {errorCode === 'EMAIL_EXISTS' && (
            <div className="text-center text-sm text-gray-600 pt-2 border-t">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/auth/login')}
                className="text-primary hover:underline font-medium"
              >
                Log in here
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
