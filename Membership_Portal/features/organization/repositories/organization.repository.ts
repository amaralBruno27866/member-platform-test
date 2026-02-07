import { OrganizationModel } from '../schemas/organization.schema';
import {
  OrganizationCreateInput,
  OrganizationRepository,
  OrganizationUpdateInput
} from '../interfaces/organization-repository.interface';
import { OrganizationDocument } from '../interfaces/organization-document.interface';

export class OrganizationMongoRepository implements OrganizationRepository {
  async create(data: OrganizationCreateInput): Promise<OrganizationDocument> {
    return OrganizationModel.create(data);
  }

  async findById(id: string): Promise<OrganizationDocument | null> {
    return OrganizationModel.findById(id).exec();
  }

  async findByBusinessId(businessId: string): Promise<OrganizationDocument | null> {
    return OrganizationModel.findOne({ organization_business_id: businessId }).exec();
  }

  async findByEmail(email: string): Promise<OrganizationDocument | null> {
    return OrganizationModel.findOne({ organization_email: email.toLowerCase() }).exec();
  }

  async updateById(
    id: string,
    data: OrganizationUpdateInput
  ): Promise<OrganizationDocument | null> {
    return OrganizationModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await OrganizationModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }
}
