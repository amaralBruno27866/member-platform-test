/**
 * Class: AffiliateResponseDto
 * Objective: Define the structure for affiliate data in API responses with computed fields.
 * Functionality: Inherits all fields from AffiliateBasicDto and adds computed/formatted fields for display.
 * Expected Result: Complete affiliate data with enhanced formatting for API responses.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { AffiliateBasicDto } from './affiliate-basic.dto';
import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';
import {
  AffiliateArea,
  AccountStatus,
  Province,
  AccessModifier,
  Privilege,
  Country,
  City,
} from '../../../../common/enums';
import { getAffiliateAreaDisplayName } from '../../../../common/enums/affiliate-area.enum';
import { getAccountStatusDisplayName } from '../../../../common/enums/account-status.enum';
import { getProvinceDisplayName } from '../../../../common/enums/provinces.enum';
import { getAccessModifierDisplayName } from '../../../../common/enums/access-modifier.enum';
import { getCityDisplayName } from '../../../../common/enums/cities.enum';
import { getCountryDisplayName } from '../../../../common/enums/countries.enum';
import { getPrivilegeDisplayName } from '../../../../common/enums/privilege.enum';

export class AffiliateResponseDto extends PartialType(AffiliateBasicDto) {
  // ========================================
  // FORMATTED FIELDS (Computed)
  // ========================================

  @ApiProperty({
    example: 'John Doe',
    description: 'Full representative name (computed)',
    readOnly: true,
  })
  @Expose()
  get representativeFullName(): string {
    return `${this.osot_representative_first_name || ''} ${
      this.osot_representative_last_name || ''
    }`.trim();
  }

  @ApiProperty({
    example: '(416) 555-0123',
    description: 'Formatted phone number for display',
    readOnly: true,
  })
  @Expose()
  @Transform(({ value }) => formatPhoneNumber(value as string))
  get formattedPhone(): string {
    return formatPhoneNumber(this.osot_affiliate_phone);
  }

  @ApiProperty({
    example: 'K1A 0A6',
    description: 'Formatted postal code for display',
    readOnly: true,
  })
  @Expose()
  get formattedPostalCode(): string {
    if (!this.osot_affiliate_postal_code) return '';

    // Canadian postal code formatting
    const code = this.osot_affiliate_postal_code
      .toUpperCase()
      .replace(/\s/g, '');
    if (code.length === 6 && /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(code)) {
      return `${code.substring(0, 3)} ${code.substring(3)}`;
    }

    return this.osot_affiliate_postal_code;
  }

  @ApiProperty({
    example:
      '123 Business Street Suite 100, Unit 5B, Toronto, ON K1A 0A6, Canada',
    description: 'Complete formatted address',
    readOnly: true,
  })
  @Expose()
  get fullAddress(): string {
    const parts: string[] = [];

    if (this.osot_affiliate_address_1)
      parts.push(this.osot_affiliate_address_1);
    if (this.osot_affiliate_address_2)
      parts.push(this.osot_affiliate_address_2);

    // Add city, province, postal code, country
    const locationParts: string[] = [];
    if (this.cityName) locationParts.push(this.cityName);
    if (this.provinceName) locationParts.push(this.provinceName);
    if (this.formattedPostalCode) locationParts.push(this.formattedPostalCode);
    if (this.countryName) locationParts.push(this.countryName);

    if (locationParts.length > 0) {
      parts.push(locationParts.join(', '));
    }

    return parts.join(', ');
  }

  // ========================================
  // ENUM LABELS (Human-readable)
  // ========================================

  @ApiProperty({
    example: 'Technology',
    description: 'Human-readable affiliate area name',
    readOnly: true,
  })
  @Expose()
  get affiliateAreaName(): string {
    return this.getAffiliateAreaName(this.osot_affiliate_area);
  }

  @ApiProperty({
    example: 'Toronto',
    description: 'Human-readable city name',
    readOnly: true,
  })
  @Expose()
  get cityName(): string {
    return this.getCityName(this.osot_affiliate_city);
  }

  @ApiProperty({
    example: 'Ontario',
    description: 'Human-readable province name',
    readOnly: true,
  })
  @Expose()
  get provinceName(): string {
    return this.getProvinceName(this.osot_affiliate_province);
  }

  @ApiProperty({
    example: 'Canada',
    description: 'Human-readable country name',
    readOnly: true,
  })
  @Expose()
  get countryName(): string {
    return this.getCountryName(this.osot_affiliate_country);
  }

  // ========================================
  // SOCIAL MEDIA SUMMARY (Computed)
  // ========================================

  @ApiProperty({
    example: ['website', 'facebook', 'linkedin'],
    description: 'List of available social media platforms',
    readOnly: true,
  })
  @Expose()
  get socialMediaPlatforms(): string[] {
    const platforms: string[] = [];

    if (this.osot_affiliate_website) platforms.push('website');
    if (this.osot_affiliate_facebook) platforms.push('facebook');
    if (this.osot_affiliate_instagram) platforms.push('instagram');
    if (this.osot_affiliate_tiktok) platforms.push('tiktok');
    if (this.osot_affiliate_linkedin) platforms.push('linkedin');

    return platforms;
  }

  @ApiProperty({
    example: 3,
    description: 'Count of social media platforms configured',
    readOnly: true,
  })
  @Expose()
  get socialMediaCount(): number {
    return this.socialMediaPlatforms.length;
  }

  // ========================================
  // METADATA (Computed)
  // ========================================

  @ApiProperty({
    example: '2024-01-15',
    description: 'Creation date formatted for display',
    readOnly: true,
  })
  @Expose()
  get createdDate(): string {
    return this.createdon
      ? new Date(this.createdon).toISOString().split('T')[0]
      : '';
  }

  @ApiProperty({
    example: '2024-01-20',
    description: 'Last modified date formatted for display',
    readOnly: true,
  })
  @Expose()
  get modifiedDate(): string {
    return this.modifiedon
      ? new Date(this.modifiedon).toISOString().split('T')[0]
      : '';
  }

  @ApiProperty({
    example: 15,
    description: 'Days since last profile update',
    readOnly: true,
  })
  @Expose()
  get daysSinceUpdate(): number {
    if (!this.modifiedon) return 0;

    const modifiedDate = new Date(this.modifiedon);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - modifiedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ========================================
  // HELPER METHODS (Private)
  // ========================================

  private getAffiliateAreaName(area?: AffiliateArea): string {
    return area !== undefined
      ? getAffiliateAreaDisplayName(area) || 'Unknown'
      : '';
  }

  private getAccountStatusName(status?: AccountStatus): string {
    return status !== undefined ? getAccountStatusDisplayName(status) : '';
  }

  private getCityName(city?: City): string {
    return city !== undefined ? getCityDisplayName(city) : '';
  }

  private getProvinceName(province?: Province): string {
    return province !== undefined ? getProvinceDisplayName(province) : '';
  }

  private getCountryName(country?: Country): string {
    return country !== undefined ? getCountryDisplayName(country) : '';
  }

  private getAccessModifierName(modifier?: AccessModifier): string {
    return modifier !== undefined ? getAccessModifierDisplayName(modifier) : '';
  }

  private getPrivilegeName(privilege?: Privilege): string {
    return privilege !== undefined ? getPrivilegeDisplayName(privilege) : '';
  }
}
