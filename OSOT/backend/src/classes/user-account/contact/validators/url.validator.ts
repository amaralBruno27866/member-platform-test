import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  sanitizeUrl,
  SocialMediaPlatform,
} from '../../../../utils/url-sanitizer.utils';

@ValidatorConstraint({ name: 'socialMediaUrl', async: false })
export class SocialMediaUrlValidator implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url) return true; // Allow empty values for optional fields

    const platform = args.constraints[0] as SocialMediaPlatform;
    try {
      sanitizeUrl(url, platform);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const platform = args.constraints[0] as SocialMediaPlatform;
    return `URL must be a valid ${platform} profile URL`;
  }
}

@ValidatorConstraint({ name: 'websiteUrl', async: false })
export class WebsiteUrlValidator implements ValidatorConstraintInterface {
  validate(url: string) {
    if (!url) return true; // Allow empty values for optional fields

    try {
      sanitizeUrl(url, SocialMediaPlatform.WEBSITE);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'URL must be a valid website URL';
  }
}
