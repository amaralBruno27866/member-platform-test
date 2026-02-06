import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { rejectAccount } from '../../services/adminApprovalService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type RejectionState = 'loading' | 'success' | 'error';

export function RejectAccountPage() {
  const { rejectionToken } = useParams<{ rejectionToken: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<RejectionState>('loading');
  const [message, setMessage] = useState('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processRejection = async () => {
      // Prevent duplicate execution (React StrictMode, etc.)
      if (hasProcessed.current) return;
      hasProcessed.current = true;
      if (!rejectionToken) {
        setState('error');
        setMessage('Invalid rejection link. Missing rejection token.');
        return;
      }

      try {
        const response = await rejectAccount(rejectionToken);
        
        if (response.success) {
          setState('success');
          setMessage(
            response.message || 
            'Professional account rejected successfully. The user will receive a notification email.'
          );
        } else {
          setState('error');
          setMessage(response.message || 'Account rejection failed. Please try again.');
        }
      } catch (error: unknown) {
        setState('error');
        const axiosError = error as AxiosError<{ message?: string }>;
        
        if (axiosError.response?.data?.message) {
          setMessage(axiosError.response.data.message);
        } else if (axiosError.response?.status === 404) {
          setMessage('Rejection session not found or token expired.');
        } else if (axiosError.response?.status === 409) {
          setMessage('Invalid session state. The account may have already been approved or rejected.');
        } else {
          setMessage('An error occurred during rejection. Please try again later.');
        }
      }
    };

    processRejection();
  }, [rejectionToken]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
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
              <CheckCircle2 className="h-16 w-16 text-brand-600" />
            )}
            {state === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {state === 'loading' && 'Processing Rejection'}
            {state === 'success' && 'Account Rejected'}
            {state === 'error' && 'Rejection Failed'}
          </CardTitle>
          <CardDescription>
            {state === 'loading' && 'Please wait while we process the account rejection...'}
            {state === 'success' && 'The professional account has been rejected'}
            {state === 'error' && 'We encountered a problem rejecting the account'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert variant={state === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {state !== 'loading' && (
            <Button onClick={handleBackToDashboard} className="w-full">
              Back to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
