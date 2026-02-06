import mongoose, { Schema, Model } from 'mongoose';
import { AccountDocument } from '../interfaces/account-document.interface';
import { AccountStatus } from '../enums/account-status.enum';
import { AccessModifier } from '../enums/access-modifier.enum';
import { Privilege } from '../enums/privilege.enum';
import { UserGroup } from '../enums/user-group.enum';

const AccountSchema = new Schema<AccountDocument>(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String },
    user_group: { type: Number, enum: Object.values(UserGroup), required: true },
    account_status: { type: Number, enum: Object.values(AccountStatus), required: true },
    privilege: { type: Number, enum: Object.values(Privilege), required: true },
    access_modifier: { type: Number, enum: Object.values(AccessModifier), required: true },
    password_hash: { type: String, required: true },
    is_email_verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const AccountModel: Model<AccountDocument> =
  mongoose.models.Account || mongoose.model<AccountDocument>('Account', AccountSchema);
