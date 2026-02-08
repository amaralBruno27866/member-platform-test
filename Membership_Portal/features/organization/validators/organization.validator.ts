import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

export const organizationRegisterSchema = z.object({
  organization_name: z.string().min(2).max(200),
  organization_email: z.string().email(),
  organization_phone: z.string().min(6).max(20),
  organization_password: passwordSchema,
  organization_logo_url: z.string().url().optional(),
  organization_acronym: z.string().max(20).optional()
});

export const organizationUpdateSchema = z
  .object({
    organization_name: z.string().min(2).max(200).optional(),
    organization_email: z.string().email().optional(),
    organization_phone: z.string().min(6).max(20).optional(),
    organization_password: passwordSchema.optional(),
    organization_logo_url: z.string().url().optional(),
    organization_acronym: z.string().max(20).optional(),
    is_email_verified: z.boolean().optional()
  })
  .strict();

export type OrganizationRegisterPayload = z.infer<typeof organizationRegisterSchema>;
export type OrganizationUpdatePayload = z.infer<typeof organizationUpdateSchema>;
