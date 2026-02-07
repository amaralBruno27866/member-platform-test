import { Document } from 'mongoose';

/** 
 * Organization Document Interface
 * 
 * MongoDB representation of the Organization entity.
 * 
 * @file organization-document.interface.ts
 * @module Organization
 * @layer Interfaces
 */
export interface OrganizationDocument extends Document {
  organization_business_id: string; // Public-facing business ID (e.g., ORG-01234)
  organization_name: string; // Name of the organization
  organization_email: string; // Contact email for the organization
  organization_phone: string; // Contact phone number
  organization_password_hash: string; // Hashed password for organization account
  organization_logo_url?: string; // Optional URL to the organization's logo
  organization_acronym?: string; // Optional acronym for the organization
  is_email_verified: boolean; // Flag indicating if the organization's email is verified
  createdAt: Date; // Timestamp of when the organization was created
  updatedAt: Date; // Timestamp of when the organization was last updated
}