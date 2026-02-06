import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

export class EmailTemplateUtil {
  private static templatesCache: Record<string, Handlebars.TemplateDelegate> =
    {};

  /**
   * Renders an email Handlebars template from an HTML file.
   * @param templateName Template file name (without extension)
   * @param variables Variables for template interpolation
   * @returns Rendered HTML
   */
  static renderTemplate(
    templateName: string,
    variables: Record<string, any>,
  ): string {
    const template = this.getTemplate(templateName);
    return template(variables);
  }

  /**
   * Loads and compiles the Handlebars template from disk (with cache).
   * @param templateName Template file name (without extension)
   * @returns Compiled Handlebars function
   */
  private static getTemplate(
    templateName: string,
  ): Handlebars.TemplateDelegate {
    if (this.templatesCache[templateName]) {
      return this.templatesCache[templateName];
    }

    // Try to find in dist/emails/templates first
    let templatePath = path.resolve(
      __dirname,
      'templates',
      `${templateName}.html`,
    );
    if (!fs.existsSync(templatePath)) {
      // If not found, try src/emails/templates
      templatePath = path.resolve(
        process.cwd(),
        'src',
        'emails',
        'templates',
        `${templateName}.html`,
      );
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templatePath}`);
      }
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const compiled = Handlebars.compile(templateContent);
    this.templatesCache[templateName] = compiled;
    return compiled;
  }
}
