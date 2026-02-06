import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { rejectAffiliate } from '../../services/adminApprovalService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Textarea } from '../../components/ui/textarea';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type RejectionState = 'form' | 'loading' | 'success' | 'error';

const rejectionSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

type RejectionFormData = z.infer<typeof rejectionSchema>;

export function RejectAffiliatePage() {
  const { rejectionToken } = useParams<{ rejectionToken: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<RejectionState>('form');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      reason: '',
    },
  });

  useEffect(() => {
    if (!rejectionToken) {
      setState('error');
      setMessage('Invalid rejection link. Missing rejection token.');
    }
  }, [rejectionToken]);

  const onSubmit = async (data: RejectionFormData) => {
    if (!rejectionToken || isSubmitting) return;

    setIsSubmitting(true);
    setState('loading');

    try {
      const response = await rejectAffiliate(rejectionToken, data.reason);
      
      if (response.success) {
        setState('success');
        setMessage(
          response.message || 
          'Affiliate organization rejected successfully. The organization will receive a notification email with your reason.'
        );
      } else {
        setState('error');
        setMessage(response.message || 'Affiliate rejection failed. Please try again.');
      }
    } catch (error: unknown) {
      setState('error');
      const axiosError = error as AxiosError<{ message?: string }>;
      
      if (axiosError.response?.data?.message) {
        setMessage(axiosError.response.data.message);
      } else if (axiosError.response?.status === 404) {
        setMessage('Rejection session not found or token expired.');
      } else if (axiosError.response?.status === 409) {
        setMessage('Invalid session state. The affiliate may have already been approved or rejected.');
      } else {
        setMessage('An error occurred during rejection. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (state === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Reject Affiliate Organization</CardTitle>
            <CardDescription>
              You are about to reject this affiliate organization registration. Please provide a detailed reason for rejection (minimum 10 characters).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejection Reason (Required) *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter detailed reason for rejection..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-2">
                  <Button 
                    type="submit" 
                    variant="destructive" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Rejecting...' : 'Reject Affiliate'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBackToDashboard}
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {state === 'success' && 'Affiliate Rejected'}
            {state === 'error' && 'Rejection Failed'}
          </CardTitle>
          <CardDescription>
            {state === 'loading' && 'Please wait while we process the affiliate rejection...'}
            {state === 'success' && 'The affiliate organization has been rejected'}
            {state === 'error' && 'We encountered a problem rejecting the affiliate'}
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
