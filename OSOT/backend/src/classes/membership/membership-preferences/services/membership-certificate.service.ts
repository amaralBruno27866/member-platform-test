/**
 * Membership Certificate Service
 *
 * Generates HTML for the Membership Certificate using Handlebars template.
 * This HTML can be used to render a PDF or display in dashboard.
 *
 * @file membership-certificate.service.ts
 * @module MembershipPreferenceModule
 * @layer Services
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

export interface MembershipCertificateTemplateData {
  organizationName: string;
  organizationLogo?: string;
  memberFirstName: string;
  memberLastName: string;
  memberBusinessId: string;
  categoryName: string;
  membershipYear: string;
  issueDate: string;
  expiryDate: string;
  accountGroup?: string;
  certificateId: string;
}

@Injectable()
export class MembershipCertificateService {
  private readonly logger = new Logger(MembershipCertificateService.name);
  private templateCache?: Handlebars.TemplateDelegate;

  /**
   * Generate membership certificate HTML
   */
  generateMembershipCertificateHtml(
    data: MembershipCertificateTemplateData,
  ): string {
    const template = this.getTemplate();
    return template(data);
  }

  private getTemplate(): Handlebars.TemplateDelegate {
    if (this.templateCache) {
      return this.templateCache;
    }

    const templatePath = this.resolveTemplatePath();
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    this.templateCache = Handlebars.compile(templateContent);

    this.logger.log(`Membership certificate template loaded: ${templatePath}`);
    return this.templateCache;
  }

  private resolveTemplatePath(): string {
    // Prefer dist path (production build)
    const distPath = path.resolve(
      __dirname,
      '..',
      'view',
      'html',
      'membership-certificate.html',
    );

    if (fs.existsSync(distPath)) {
      return distPath;
    }

    // Fallback to src path (development)
    const srcPath = path.resolve(
      process.cwd(),
      'src',
      'classes',
      'membership',
      'membership-preferences',
      'view',
      'html',
      'membership-certificate.html',
    );

    if (fs.existsSync(srcPath)) {
      return srcPath;
    }

    throw new Error(
      `Membership certificate template not found in dist or src locations. Tried: ${distPath} and ${srcPath}`,
    );
  }
}
