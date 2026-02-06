/**
 * Contact Page
 * Displays and manages user contact information
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useContact } from '@/hooks/useContact';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Globe, Users, Edit, X, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { contactService } from '@/services/contactService';
import { toast } from 'sonner';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import type { UpdateContactDto } from '@/types/contact';

// URL validation regex
const urlRegex = /^https?:\/\/.+/i;

// Validation schema
const contactSchema = z.object({
  osot_secondary_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  osot_job_title: z.string().max(100, 'Job title must be 100 characters or less').optional().or(z.literal('')),
  osot_home_phone: z.string().max(14, 'Phone number is too long').optional().or(z.literal('')),
  osot_work_phone: z.string().max(14, 'Phone number is too long').optional().or(z.literal('')),
  osot_business_website: z.string().optional().refine((val) => !val || urlRegex.test(val), {
    message: 'Must be a valid URL (https://...)',
  }),
  osot_facebook: z.string().optional().refine((val) => !val || urlRegex.test(val), {
    message: 'Must be a valid URL (https://...)',
  }),
  osot_instagram: z.string().optional().refine((val) => !val || urlRegex.test(val), {
    message: 'Must be a valid URL (https://...)',
  }),
  osot_tiktok: z.string().optional().refine((val) => !val || urlRegex.test(val), {
    message: 'Must be a valid URL (https://...)',
  }),
  osot_linkedin: z.string().optional().refine((val) => !val || urlRegex.test(val), {
    message: 'Must be a valid URL (https://...)',
  }),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { data: contact, isLoading, error } = useContact();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  // Reset form when contact data loads
  useEffect(() => {
    if (contact) {
      reset({
        osot_secondary_email: contact.osot_secondary_email || '',
        osot_job_title: contact.osot_job_title || '',
        osot_home_phone: contact.osot_home_phone || '',
        osot_work_phone: contact.osot_work_phone || '',
        osot_business_website: contact.osot_business_website || '',
        osot_facebook: contact.osot_facebook || '',
        osot_instagram: contact.osot_instagram || '',
        osot_tiktok: contact.osot_tiktok || '',
        osot_linkedin: contact.osot_linkedin || '',
      });
    }
  }, [contact, reset]);

  // Mutation for updating contact
  const updateMutation = useMutation({
    mutationFn: (data: UpdateContactDto) => contactService.updateMyContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', 'me'] });
      setIsEditing(false);
      toast.success('Contact Updated!', {
        description: 'Your contact information has been saved successfully.',
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    },
    onError: (err) => {
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to update contact. Please try again.');
      toast.error('Update Failed', {
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (contact) {
      reset({
        osot_secondary_email: contact.osot_secondary_email || '',
        osot_job_title: contact.osot_job_title || '',
        osot_home_phone: contact.osot_home_phone || '',
        osot_work_phone: contact.osot_work_phone || '',
        osot_business_website: contact.osot_business_website || '',
        osot_facebook: contact.osot_facebook || '',
        osot_instagram: contact.osot_instagram || '',
        osot_tiktok: contact.osot_tiktok || '',
        osot_linkedin: contact.osot_linkedin || '',
      });
    }
  };

  const onSubmit = (data: ContactFormData) => {
    // Only send dirty fields and convert empty strings to undefined
    const updates: UpdateContactDto = {};
    
    if (dirtyFields.osot_secondary_email) updates.osot_secondary_email = data.osot_secondary_email || undefined;
    if (dirtyFields.osot_job_title) updates.osot_job_title = data.osot_job_title || undefined;
    if (dirtyFields.osot_home_phone) updates.osot_home_phone = data.osot_home_phone || undefined;
    if (dirtyFields.osot_work_phone) updates.osot_work_phone = data.osot_work_phone || undefined;
    if (dirtyFields.osot_business_website) updates.osot_business_website = data.osot_business_website || undefined;
    if (dirtyFields.osot_facebook) updates.osot_facebook = data.osot_facebook || undefined;
    if (dirtyFields.osot_instagram) updates.osot_instagram = data.osot_instagram || undefined;
    if (dirtyFields.osot_tiktok) updates.osot_tiktok = data.osot_tiktok || undefined;
    if (dirtyFields.osot_linkedin) updates.osot_linkedin = data.osot_linkedin || undefined;

    if (Object.keys(updates).length === 0) {
      toast.info('No Changes', {
        description: 'No fields were modified.',
        duration: 3000,
      });
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading contact information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading contact: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No contact information found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Information</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Edit your contact details' : 'Manage your contact details and social media links'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isEditing ? (
            <Button size="sm" onClick={handleEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Contact
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Contact Information */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-600" />
              Email & Professional Information
            </CardTitle>
            <CardDescription>
              Your secondary email and job title
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_secondary_email">Secondary Email</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_secondary_email"
                    type="email"
                    {...register('osot_secondary_email')}
                    className="mt-1"
                    placeholder="secondary@example.com"
                  />
                  {errors.osot_secondary_email && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_secondary_email.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{contact.osot_secondary_email || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label htmlFor="osot_job_title">Job Title</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_job_title"
                    {...register('osot_job_title')}
                    className="mt-1"
                    placeholder="Senior Developer"
                  />
                  {errors.osot_job_title && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_job_title.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{contact.osot_job_title || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phone Numbers */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Phone Numbers
            </CardTitle>
            <CardDescription>
              Your home and work phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_home_phone">Home Phone</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_home_phone"
                    {...register('osot_home_phone')}
                    className="mt-1"
                    placeholder="4165551234"
                  />
                  {errors.osot_home_phone && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_home_phone.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{contact.osot_home_phone || 'N/A'}</p>
              )}
            </div>
            <div>
              <Label htmlFor="osot_work_phone">Work Phone</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_work_phone"
                    {...register('osot_work_phone')}
                    className="mt-1"
                    placeholder="4165559876"
                  />
                  {errors.osot_work_phone && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_work_phone.message}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground font-medium mt-1">{contact.osot_work_phone || 'N/A'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Website */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Business Website
            </CardTitle>
            <CardDescription>
              Your professional or business website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="osot_business_website">Website URL</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_business_website"
                    {...register('osot_business_website')}
                    className="mt-1"
                    placeholder="https://example.com"
                  />
                  {errors.osot_business_website && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_business_website.message}</p>
                  )}
                </>
              ) : (
                <>
                  {contact.osot_business_website ? (
                    <a 
                      href={contact.osot_business_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 mt-1 block break-all font-medium"
                    >
                      {contact.osot_business_website}
                    </a>
                  ) : (
                    <p className="text-foreground font-medium mt-1">N/A</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              Social Media Links
            </CardTitle>
            <CardDescription>
              Your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="osot_facebook">Facebook</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_facebook"
                    {...register('osot_facebook')}
                    className="mt-1"
                    placeholder="https://facebook.com/username"
                  />
                  {errors.osot_facebook && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_facebook.message}</p>
                  )}
                </>
              ) : (
                <>
                  {contact.osot_facebook ? (
                    <a 
                      href={contact.osot_facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 mt-1 block break-all font-medium"
                    >
                      {contact.osot_facebook}
                    </a>
                  ) : (
                    <p className="text-foreground font-medium mt-1">N/A</p>
                  )}
                </>
              )}
            </div>
            <div>
              <Label htmlFor="osot_instagram">Instagram</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_instagram"
                    {...register('osot_instagram')}
                    className="mt-1"
                    placeholder="https://instagram.com/username"
                  />
                  {errors.osot_instagram && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_instagram.message}</p>
                  )}
                </>
              ) : (
                <>
                  {contact.osot_instagram ? (
                    <a 
                      href={contact.osot_instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 mt-1 block break-all font-medium"
                    >
                      {contact.osot_instagram}
                    </a>
                  ) : (
                    <p className="text-foreground font-medium mt-1">N/A</p>
                  )}
                </>
              )}
            </div>
            <div>
              <Label htmlFor="osot_tiktok">TikTok</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_tiktok"
                    {...register('osot_tiktok')}
                    className="mt-1"
                    placeholder="https://tiktok.com/@username"
                  />
                  {errors.osot_tiktok && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_tiktok.message}</p>
                  )}
                </>
              ) : (
                <>
                  {contact.osot_tiktok ? (
                    <a 
                      href={contact.osot_tiktok} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 mt-1 block break-all font-medium"
                    >
                      {contact.osot_tiktok}
                    </a>
                  ) : (
                    <p className="text-foreground font-medium mt-1">N/A</p>
                  )}
                </>
              )}
            </div>
            <div>
              <Label htmlFor="osot_linkedin">LinkedIn</Label>
              {isEditing ? (
                <>
                  <Input
                    id="osot_linkedin"
                    {...register('osot_linkedin')}
                    className="mt-1"
                    placeholder="https://linkedin.com/in/username"
                  />
                  {errors.osot_linkedin && (
                    <p className="text-sm text-destructive mt-1">{errors.osot_linkedin.message}</p>
                  )}
                </>
              ) : (
                <>
                  {contact.osot_linkedin ? (
                    <a 
                      href={contact.osot_linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 mt-1 block break-all font-medium"
                    >
                      {contact.osot_linkedin}
                    </a>
                  ) : (
                    <p className="text-foreground font-medium mt-1">N/A</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
