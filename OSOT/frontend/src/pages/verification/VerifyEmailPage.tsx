import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { verifyEmail } from '../../services/verificationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type VerificationState = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    const processVerification = async () => {
      // Prevent duplicate execution (React StrictMode, etc.)
      if (hasVerified.current) return;
      hasVerified.current = true;
      const sessionId = searchParams.get('sessionId');
      const token = searchParams.get('token');

      if (!sessionId || !token) {
        setState('error');
        setMessage('Invalid verification link. Missing session ID or verification token.');
        return;
      }

      try {
        const response = await verifyEmail(sessionId, token);
        
        if (response.success) {
          setState('success');
          setMessage(
            response.message || 
            'Email verified successfully! Your registration is now pending admin approval. You will receive an email once your account is approved.'
          );
        } else {
          setState('error');
          setMessage(response.message || 'Email verification failed. Please try again.');
        }
      } catch (error: unknown) {
        setState('error');
        const axiosError = error as AxiosError<{ message?: string }>;
        
        if (axiosError.response?.data?.message) {
          setMessage(axiosError.response.data.message);
        } else if (axiosError.response?.status === 404) {
          setMessage('Verification session not found or expired. Please register again.');
        } else if (axiosError.response?.status === 400) {
          setMessage('Invalid verification token. The link may have expired.');
        } else {
          setMessage('An error occurred during verification. Please try again later.');
        }
      }
    };

    processVerification();
  }, [searchParams]);

  const handleBackToLogin = () => {
    navigate('/auth/login');
  };

  const handleBackToRegister = () => {
    navigate('/register/professional');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {state === 'loading' && (
              <Loader2 className="h-16 w-16 text-brand-600 animate-spin" />
            )}
            {state === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {state === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {state === 'loading' && 'Verifying Email'}
            {state === 'success' && 'Email Verified!'}
            {state === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {state === 'loading' && 'Please wait while we verify your email address...'}
            {state === 'success' && 'Your email has been successfully verified'}
            {state === 'error' && 'We encountered a problem verifying your email'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert variant={state === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {state === 'success' && (
              <Button onClick={handleBackToLogin} className="w-full">
                Go to Login
              </Button>
            )}
            
            {state === 'error' && (
              <>
                <Button onClick={handleBackToRegister} className="w-full">
                  Register Again
                </Button>
                <Button onClick={handleBackToLogin} variant="outline" className="w-full">
                  Back to Login
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
