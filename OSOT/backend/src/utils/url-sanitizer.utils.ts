/**
 * Utility: URL Sanitization and Validation
 * Objective: Sanitize, validate, and normalize URLs for safe storage and usage  // Force HTTPS by default (unless allowHttp is true)
  if (!options?.allowHttp && parsedUrl.protocol === 'http:') {
    parsedUrl.protocol = 'https:';
  }

  // Normalize the URL
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

  // Remove trailing slash if path is just '/'
  if (parsedUrl.pathname === '/') {
    parsedUrl.pathname = '';
  } * - Validates URL format and structure
 * - Sanitizes potentially dangerous characters
 * - Normalizes URLs (adds protocol if missing)
 * - Validates domain restrictions for social media platforms
 * - Protects against malicious URLs
 *
 * Examples:
 *   'facebook.com/user'                    => 'https://facebook.com/user'
 *   'HTTPS://WWW.FACEBOOK.COM/USER'        => 'https://www.facebook.com/user'
 *   'linkedin.com/in/user'                 => 'https://linkedin.com/in/user'
 *   'javascript:alert(1)'                  => throws error
 *   'http://malicious-site.com'            => throws error (if social media validation)
 */

/**
 * Supported social media platforms for domain validation
 */
export enum SocialMediaPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  WEBSITE = 'website', // General website (no domain restriction)
}

/**
 * Configuration for each social media platform
 */
const PLATFORM_CONFIG: Record<
  SocialMediaPlatform,
  {
    domains: string[];
    pathPattern: RegExp | null;
    name: string;
  }
> = {
  [SocialMediaPlatform.FACEBOOK]: {
    domains: ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com'],
    pathPattern: null, // Allow any Facebook URL path
    name: 'Facebook',
  },
  [SocialMediaPlatform.INSTAGRAM]: {
    domains: ['instagram.com', 'www.instagram.com'],
    pathPattern: null, // Allow any Instagram URL path
    name: 'Instagram',
  },
  [SocialMediaPlatform.LINKEDIN]: {
    domains: ['linkedin.com', 'www.linkedin.com'],
    pathPattern: null, // Allow any LinkedIn URL path
    name: 'LinkedIn',
  },
  [SocialMediaPlatform.TIKTOK]: {
    domains: ['tiktok.com', 'www.tiktok.com'],
    pathPattern: null, // Allow any TikTok URL path
    name: 'TikTok',
  },
  [SocialMediaPlatform.YOUTUBE]: {
    domains: ['youtube.com', 'www.youtube.com'],
    pathPattern: null, // Allow any YouTube URL path
    name: 'YouTube',
  },
  [SocialMediaPlatform.WEBSITE]: {
    domains: [], // No domain restriction for general websites
    pathPattern: null, // No path restriction
    name: 'Website',
  },
};

/**
 * Sanitize and validate a URL
 * @param url - The URL to sanitize
 * @param platform - The social media platform (optional, for domain validation)
 * @param options - Additional options for sanitization
 * @returns The sanitized and normalized URL
 * @throws Error if URL is invalid or doesn't match platform requirements
 */
export function sanitizeUrl(
  url: string,
  platform?: SocialMediaPlatform,
  options: {
    allowHttp?: boolean; // Allow HTTP URLs (default: false, force HTTPS)
    maxLength?: number; // Maximum URL length (default: 255)
  } = {},
): string {
  const { allowHttp = false, maxLength = 255 } = options;

  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string.');
  }

  // Trim whitespace
  url = url.trim();

  if (url.length === 0) {
    throw new Error('URL cannot be empty.');
  }

  if (url.length > maxLength) {
    throw new Error(`URL cannot exceed ${maxLength} characters.`);
  }

  // Check for dangerous protocols (before adding protocol)
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'ftp:',
  ];
  const lowerUrl = url.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      throw new Error(`Dangerous protocol detected: ${protocol}`);
    }
  }

  // Add protocol if missing
  if (!url.match(/^https?:\/\//i)) {
    url = `https://${url}`;
  }

  // Force HTTPS if allowHttp is false
  if (!allowHttp && url.toLowerCase().startsWith('http://')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);

    // Additional validation for malformed URLs
    if (
      parsedUrl.hostname === '.' ||
      parsedUrl.hostname === '..' ||
      parsedUrl.hostname.includes('..') ||
      parsedUrl.hostname === ''
    ) {
      throw new Error('Invalid URL format.');
    }
  } catch {
    throw new Error('Invalid URL format.');
  }

  // Normalize the URL
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

  // Remove trailing slash if path is just '/'
  if (parsedUrl.pathname === '/') {
    parsedUrl.pathname = '';
  }

  // Platform-specific validation
  if (platform && platform !== SocialMediaPlatform.WEBSITE) {
    const config = PLATFORM_CONFIG[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Check domain
    if (
      config.domains.length > 0 &&
      !config.domains.includes(parsedUrl.hostname)
    ) {
      throw new Error(
        `Invalid ${config.name} URL. Expected domains: ${config.domains.join(', ')}`,
      );
    }

    // Check path pattern
    if (config.pathPattern && !config.pathPattern.test(parsedUrl.pathname)) {
      throw new Error(
        `Invalid ${config.name} URL path format. Please check the profile/page URL format.`,
      );
    }
  }

  // Return the sanitized URL, removing trailing slash if it's just the root
  const result = parsedUrl.toString();

  // Remove trailing slash from root URLs
  if (
    result.endsWith('/') &&
    (parsedUrl.pathname === '/' || parsedUrl.pathname === '')
  ) {
    return result.slice(0, -1);
  }

  return result;
}

/**
 * Validate if a URL is valid without sanitizing
 * @param url - The URL to validate
 * @param platform - The social media platform (optional)
 * @returns true if valid, false otherwise
 */
export function isValidUrl(
  url: string,
  platform?: SocialMediaPlatform,
): boolean {
  try {
    sanitizeUrl(url, platform);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 * @param url - The URL to extract domain from
 * @returns The domain name
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsedUrl.hostname;
  } catch {
    throw new Error('Invalid URL format.');
  }
}

/**
 * Check if URL belongs to a specific social media platform
 * @param url - The URL to check
 * @param platform - The platform to check against
 * @returns true if URL belongs to the platform
 */
export function isUrlFromPlatform(
  url: string,
  platform: SocialMediaPlatform,
): boolean {
  try {
    const domain = extractDomain(url);
    const config = PLATFORM_CONFIG[platform];
    return config.domains.length > 0 && config.domains.includes(domain);
  } catch {
    return false;
  }
}
