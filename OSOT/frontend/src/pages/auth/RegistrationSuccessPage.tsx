import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function RegistrationSuccessPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown === 0) {
      navigate('/auth/login');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-emerald-100">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-emerald-600">
            Registration Successful!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your account has been created successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Verification Notice */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-brand-100 rounded-full">
                <Mail className="h-6 w-6 text-brand-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-brand-900 mb-2">
                  Verify Your Email Address
                </h3>
                <p className="text-sm text-brand-800 leading-relaxed">
                  We've sent a verification email to the address you provided during registration. 
                  Please check your inbox and click the verification link to activate your account.
                </p>
                <p className="text-sm text-brand-800 mt-3 leading-relaxed">
                  <strong>Important:</strong> You must verify your email before you can log in to your account.
                </p>
              </div>
            </div>
          </div>

          {/* Session Information */}
          {sessionId && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm">
                <p className="text-gray-600 mb-1">Session ID:</p>
                <p className="font-mono text-gray-900 break-all">{sessionId}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Save this ID for your records. You can use it to check your registration status.
                </p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Check your email inbox (including spam/junk folders)</li>
              <li>Click the verification link in the email we sent you</li>
              <li>Wait for admin approval of your account</li>
              <li>Once approved, you'll receive a confirmation email</li>
              <li>Log in with your credentials and start using the platform</li>
            </ol>
          </div>

          {/* Didn't receive email notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Didn't receive the email?</strong> Check your spam folder or wait a few minutes. 
              If you still don't see it, you can request a new verification email from the login page.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/auth/login')} 
              className="flex-1"
              size="lg"
            >
              Go to Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Auto-redirect notice */}
          <div className="text-center text-sm text-gray-500 pt-2 border-t">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>
                You will be redirected to the login page in {countdown} second{countdown !== 1 ? 's' : ''}...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
