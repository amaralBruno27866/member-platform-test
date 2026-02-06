/**
 * Bootstrap Service
 * Handles initial system setup and first-time initialization
 *
 * Purpose: Solve chicken-and-egg problem (need org for user, need user for org)
 * Solution: Use MAIN credentials directly on first startup if no orgs exist
 *
 * Flow:
 * 1. Check if any organizations exist in Dataverse
 * 2. If none exist, prompt user for initial setup data
 * 3. Create first organization using MAIN credentials (bypass JWT)
 * 4. Create first MAIN user linked to that organization
 * 5. After first setup, this service does nothing (system initialized)
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../integrations/dataverse.service';
import { OrganizationLookupService } from '../classes/others/organization/services/organization-lookup.service';
import { AccountGroup, Privilege } from '../common/enums';
import { hashPassword } from '../common/keys/password-hash.util';
import * as readline from 'readline';

interface BootstrapData {
  organization: {
    osot_name: string;
    osot_legal_name: string;
    osot_acronym?: string;
    osot_slug: string;
    osot_organization_logo: string;
    osot_organization_website: string;
    osot_representative: string;
    osot_email: string;
    osot_phone: string;
  };
  address: {
    osot_address_1: string;
    osot_address_2?: string;
    osot_city: string;
    osot_province: string;
    osot_postal_code: string;
    osot_country: string;
    osot_address_type: string;
  };
  adminUser: {
    osot_first_name: string;
    osot_last_name: string;
    osot_email: string;
    osot_password: string;
    osot_mobile_phone: string;
    osot_date_of_birth: string;
  };
}

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    private readonly organizationLookupService: OrganizationLookupService,
  ) {}

  /**
   * Check if system needs initialization
   * Returns true if no organizations exist (first-time setup)
   */
  async needsInitialization(): Promise<boolean> {
    try {
      const credentials = this.dataverseService.getCredentialsByApp('main');
      const endpoint =
        'osot_table_organizations?$top=1&$select=osot_table_organizationid';

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: Array<{ osot_table_organizationid: string }> };

      return !response.value || response.value.length === 0;
    } catch (error) {
      this.logger.error('Error checking initialization status', error);
      return false; // If error, assume already initialized to avoid breaking startup
    }
  }

  /**
   * Interactive prompt to collect bootstrap data from user
   */
  async promptBootstrapData(): Promise<BootstrapData | null> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer.trim());
        });
      });
    };

    console.log(
      '\n═══════════════════════════════════════════════════════════════',
    );
    console.log('🚀 OSOT DATAVERSE API - FIRST TIME SETUP');
    console.log(
      '═══════════════════════════════════════════════════════════════',
    );
    console.log(
      "No organizations found. Let's create the main organization.\n",
    );

    try {
      // Organization data
      console.log('📋 ORGANIZATION INFORMATION:\n');
      const orgName = await question(
        'Organization Name (e.g., "OSOT - Organization of OT"): ',
      );
      const orgLegalName = await question(
        'Legal Name (e.g., "Organization of Occupational Therapists Inc."): ',
      );
      const orgAcronym = await question('Acronym (optional, e.g., "OSOT"): ');
      const orgSlug = await question(
        'Organization Slug (lowercase, e.g., "osot"): ',
      );
      const orgLogo = await question(
        'Organization Logo URL (e.g., "https://osot.com/logo.png"): ',
      );
      const orgWebsite = await question(
        'Organization Website (e.g., "https://osot.com"): ',
      );
      const orgRepresentative = await question(
        'Representative Name (e.g., "John Doe, CEO"): ',
      );
      const orgEmail = await question('Organization Email: ');
      const orgPhone = await question(
        'Organization Phone (format: (XXX) XXX-XXXX): ',
      );

      // Address data (NEW - required for 1:1 relationship)
      console.log('\n🏠 ORGANIZATION ADDRESS INFORMATION:\n');
      const addrLine1 = await question('Street Address (Address Line 1): ');
      const addrLine2 = await question(
        'Address Line 2 (optional, e.g., "Suite 200"): ',
      );
      const addrCity = await question(
        'City (e.g., "1" for Toronto, "2" for Ottawa - use city code): ',
      );
      const addrProvince = await question(
        'Province (e.g., "1" for Ontario - use province code): ',
      );
      const addrPostalCode = await question('Postal Code (format: A1A 1A1): ');
      const addrCountry = await question(
        'Country (e.g., "1" for Canada - use country code): ',
      );
      const addrType = await question(
        'Address Type (e.g., "1" for Mailing - use address type code): ',
      );

      // Admin user data
      console.log('\n👤 ADMIN USER INFORMATION:\n');
      const adminFirstName = await question('Admin First Name: ');
      const adminLastName = await question('Admin Last Name: ');
      const adminEmail = await question('Admin Email: ');
      const adminPhone = await question(
        'Admin Phone (format: (XXX) XXX-XXXX): ',
      );
      const adminDOB = await question('Admin Date of Birth (YYYY-MM-DD): ');
      const adminPassword = await question(
        'Admin Password (min 8 chars, uppercase, lowercase, number, special): ',
      );

      console.log(
        '\n═══════════════════════════════════════════════════════════════\n',
      );

      rl.close();

      return {
        organization: {
          osot_name: orgName,
          osot_legal_name: orgLegalName,
          osot_acronym: orgAcronym || undefined,
          osot_slug: orgSlug.toLowerCase(),
          osot_organization_logo: orgLogo,
          osot_organization_website: orgWebsite,
          osot_representative: orgRepresentative,
          osot_email: orgEmail,
          osot_phone: orgPhone,
        },
        address: {
          osot_address_1: addrLine1,
          osot_address_2: addrLine2 || undefined,
          osot_city: addrCity,
          osot_province: addrProvince,
          osot_postal_code: addrPostalCode,
          osot_country: addrCountry,
          osot_address_type: addrType,
        },
        adminUser: {
          osot_first_name: adminFirstName,
          osot_last_name: adminLastName,
          osot_email: adminEmail,
          osot_mobile_phone: adminPhone,
          osot_date_of_birth: adminDOB,
          osot_password: adminPassword,
        },
      };
    } catch (error) {
      this.logger.error('Error during bootstrap prompt', error);
      rl.close();
      return null;
    }
  }

  /**
   * Initialize system with first organization and admin user
   * Uses MAIN credentials to bypass authentication requirements
   */
  async initialize(
    data: BootstrapData,
  ): Promise<{ success: boolean; organizationId?: string; userId?: string }> {
    const operationId = `bootstrap_init_${Date.now()}`;
    this.logger.log(
      `Starting system initialization - Operation: ${operationId}`,
    );

    try {
      // Get MAIN credentials
      const mainCredentials = this.dataverseService.getCredentialsByApp('main');

      // 1. Create organization
      this.logger.log('Creating organization in Dataverse...');
      const orgPayload: Record<string, unknown> = {
        osot_organization_name: data.organization.osot_name,
        osot_legal_name: data.organization.osot_legal_name,
        osot_slug: data.organization.osot_slug,
        osot_organization_logo: data.organization.osot_organization_logo,
        osot_organization_website: data.organization.osot_organization_website,
        osot_representative: data.organization.osot_representative,
        osot_organization_email: data.organization.osot_email,
        osot_organization_phone: data.organization.osot_phone,
        osot_organization_status: 1, // Active
        osot_privilege: 3, // MAIN
        osot_access_modifier: 3, // PRIVATE
      };

      // Add optional acronym if provided
      if (data.organization.osot_acronym) {
        orgPayload.osot_acronym = data.organization.osot_acronym;
      }

      const orgResponse = (await this.dataverseService.request(
        'POST',
        'osot_table_organizations',
        orgPayload,
        mainCredentials,
      )) as { osot_table_organizationid: string };

      const organizationId = orgResponse.osot_table_organizationid;
      this.logger.log(`✅ Organization created: ${organizationId}`);

      // 2. Create address for the organization (NEW - required 1:1 relationship)
      this.logger.log('Creating organization address...');
      const addressPayload: Record<string, unknown> = {
        osot_address_1: data.address.osot_address_1,
        osot_city: parseInt(data.address.osot_city, 10),
        osot_province: parseInt(data.address.osot_province, 10),
        osot_postal_code: data.address.osot_postal_code,
        osot_country: parseInt(data.address.osot_country, 10),
        osot_address_type: parseInt(data.address.osot_address_type, 10),
        osot_access_modifiers: 3, // PRIVATE
        osot_privilege: 3, // MAIN
        // Link address to organization
        'osot_Table_Organization@odata.bind': `/osot_table_organizations(${organizationId})`,
      };

      // Add optional address line 2 if provided
      if (data.address.osot_address_2) {
        addressPayload.osot_address_2 = data.address.osot_address_2;
      }

      const addressResponse = (await this.dataverseService.request(
        'POST',
        'osot_table_addresses',
        addressPayload,
        mainCredentials,
      )) as { osot_table_addressid: string };

      const addressId = addressResponse.osot_table_addressid;
      this.logger.log(
        `✅ Address created and linked to organization: ${addressId}`,
      );

      // 3. Create admin user linked to organization
      this.logger.log('Creating MAIN admin user (STAFF type)...');

      try {
        // Hash password before storing
        const hashedPassword = await hashPassword(data.adminUser.osot_password);

        const userPayload = {
          osot_first_name: data.adminUser.osot_first_name,
          osot_last_name: data.adminUser.osot_last_name,
          osot_email: data.adminUser.osot_email,
          osot_mobile_phone: data.adminUser.osot_mobile_phone,
          osot_date_of_birth: data.adminUser.osot_date_of_birth,
          osot_password: hashedPassword, // Hashed with bcrypt
          osot_account_group: AccountGroup.STAFF, // STAFF type - no email verification needed
          osot_account_declaration: true,
          osot_account_status: 1, // Active
          osot_active_member: true,
          osot_access_modifiers: 3, // PRIVATE
          osot_privilege: Privilege.MAIN, // MAIN privilege
          'osot_Table_Organization@odata.bind': `/osot_table_organizations(${organizationId})`,
        };

        const userResponse = (await this.dataverseService.request(
          'POST',
          'osot_table_accounts',
          userPayload,
          mainCredentials,
        )) as { osot_table_accountid: string };

        const userId = userResponse.osot_table_accountid;
        this.logger.log(`✅ Admin user created: ${userId}`);

        console.log(
          '\n═══════════════════════════════════════════════════════════════',
        );
        console.log('✅ INITIALIZATION COMPLETE!');
        console.log(
          '═══════════════════════════════════════════════════════════════',
        );
        console.log(
          `Organization: ${data.organization.osot_name} (${data.organization.osot_slug})`,
        );
        console.log(`Address: ${data.address.osot_address_1}`);
        console.log(`Admin User: ${data.adminUser.osot_email}`);
        console.log(`Organization ID: ${organizationId}`);
        console.log(`Address ID: ${addressId}`);
        console.log(`User ID: ${userId}`);
        console.log('\nYou can now login with the admin credentials.');
        console.log(
          '═══════════════════════════════════════════════════════════════\n',
        );

        return { success: true, organizationId, userId };
      } catch (userError) {
        // Rollback: Delete address and organization if user creation fails
        this.logger.error(
          'User creation failed - Rolling back address and organization',
          userError,
        );

        try {
          this.logger.log(`Rolling back: Deleting address ${addressId}...`);
          await this.dataverseService.request(
            'DELETE',
            `osot_table_addresses(${addressId})`,
            null,
            mainCredentials,
          );
          this.logger.log(`✅ Address deleted`);

          this.logger.log(
            `Rolling back: Deleting organization ${organizationId}...`,
          );
          await this.dataverseService.request(
            'DELETE',
            `osot_table_organizations(${organizationId})`,
            null,
            mainCredentials,
          );
          this.logger.log(`✅ Organization deleted`);
        } catch (rollbackError) {
          this.logger.error(
            'Error during rollback - manual cleanup may be required',
            rollbackError,
          );
        }

        throw userError; // Re-throw to trigger main error handler
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Bootstrap initialization failed - Operation: ${operationId}`,
        error,
      );
      console.error('\n❌ INITIALIZATION FAILED:', errorMessage);
      return { success: false };
    }
  }

  /**
   * Main bootstrap flow - checks and initializes if needed
   */
  async checkAndInitialize(): Promise<void> {
    const needsInit = await this.needsInitialization();

    if (!needsInit) {
      this.logger.log('✅ System already initialized - Skipping bootstrap');
      return;
    }

    this.logger.warn('⚠️  No organizations found - First-time setup required');

    const data = await this.promptBootstrapData();

    if (!data) {
      this.logger.error('❌ Bootstrap cancelled - No data provided');
      process.exit(1);
    }

    const result = await this.initialize(data);

    if (!result.success) {
      this.logger.error('❌ Bootstrap failed - Exiting');
      process.exit(1);
    }
  }
}
