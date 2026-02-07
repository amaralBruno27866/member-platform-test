import mongoose, { Schema, Model } from 'mongoose';
import { OrganizationDocument } from '../interfaces/organization-document.interface';

const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    organization_business_id: { type: String, required: true, unique: true, index: true },
    organization_name: { type: String, required: true },
    organization_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    organization_phone: { type: String, required: true },
    organization_password_hash: { type: String, required: true },
    organization_logo_url: { type: String },
    organization_acronym: { type: String },
    is_email_verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const OrganizationModel: Model<OrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);
