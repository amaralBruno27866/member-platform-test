/**
 * Utility function to detect the organization slug from the current hostname
 * 
 * For production with subdomains: "osot.platform.com" → "osot"
 * For localhost/development: always returns "osot"
 * 
 * @returns {string} The organization slug (e.g., "osot")
 */
export function getOrganizationSlug(): string {
  const hostname = window.location.hostname;
  
  // For localhost or local IP addresses, return default 'osot'
  if (
    hostname === 'localhost' || 
    hostname.startsWith('127.0.0.') || 
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  ) {
    return 'osot';
  }
  
  // Extract subdomain from hostname: "osot.platform.com" → "osot"
  const parts = hostname.split('.');
  
  // If hostname has at least 2 parts, use the first as organization slug
  if (parts.length >= 2) {
    return parts[0];
  }
  
  // Fallback to 'osot' if unable to determine
  return 'osot';
}
