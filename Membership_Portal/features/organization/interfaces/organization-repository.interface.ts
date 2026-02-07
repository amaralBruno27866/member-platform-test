import { OrganizationDocument } from './organization-document.interface';

export interface OrganizationCreateInput {
  organization_business_id: string;
  organization_name: string;
  organization_email: string;
  organization_phone: string;
  organization_password_hash: string;
  organization_logo_url?: string;
  organization_acronym?: string;
  is_email_verified?: boolean;
}

export interface OrganizationUpdateInput {
  organization_name?: string;
  organization_email?: string;
  organization_phone?: string;
  organization_password_hash?: string;
  organization_logo_url?: string;
  organization_acronym?: string;
  is_email_verified?: boolean;
}

export interface OrganizationRepository {
  create(data: OrganizationCreateInput): Promise<OrganizationDocument>;
  findById(id: string): Promise<OrganizationDocument | null>;
  findByBusinessId(businessId: string): Promise<OrganizationDocument | null>;
  findByEmail(email: string): Promise<OrganizationDocument | null>;
  updateById(id: string, data: OrganizationUpdateInput): Promise<OrganizationDocument | null>;
  deleteById(id: string): Promise<boolean>;
}
