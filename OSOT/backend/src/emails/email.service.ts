import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { EmailTemplateUtil } from './email-template.util';

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateOptions {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('EMAIL_FROM') || '';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: Number(this.configService.get<string>('EMAIL_PORT')),
      secure: this.configService.get<string>('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    }) as unknown as nodemailer.Transporter;
  }

  async send(options: EmailSendOptions): Promise<void> {
    const mailOptions = {
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(
        `Error sending email: ${error instanceof Error ? error.message : error}`,
      );
      throw new Error('Failed to send email.');
    }
  }

  /**
   * Send email using template
   * @param to Recipient email
   * @param subject Email subject
   * @param templateName Template name (without .html extension)
   * @param variables Variables for template interpolation
   */
  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, any>,
  ): Promise<void> {
    try {
      const html = EmailTemplateUtil.renderTemplate(templateName, variables);
      await this.send({
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send template email: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  /**
   * Send email using template options interface
   */
  async sendTemplateEmail(options: EmailTemplateOptions): Promise<void> {
    return this.sendEmail(
      options.to,
      options.subject,
      options.template,
      options.variables,
    );
  }
}
