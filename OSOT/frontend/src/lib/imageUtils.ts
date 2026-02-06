/**
 * Image Utilities
 * Helpers for handling external image URLs from Google Drive and SharePoint
 */

/**
 * Convert Google Drive share link to direct image URL
 * @param url - Google Drive URL (share link or file link)
 * @returns Direct image URL that can be used in <img> src
 * 
 * @example
 * // Input: https://drive.google.com/file/d/1aB2cD3eF4gH5iJ6k/view
 * // Output: https://drive.google.com/uc?export=view&id=1aB2cD3eF4gH5iJ6k
 */
export function convertGoogleDriveUrl(url: string): string {
  // Already a direct link
  if (url.includes('drive.google.com/uc?')) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,  // /file/d/FILE_ID/view
    /id=([a-zA-Z0-9_-]+)/,          // ?id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/,        // /d/FILE_ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const directUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      console.log('[Google Drive URL Conversion]', {
        original: url,
        fileId: match[1],
        converted: directUrl,
      });
      return directUrl;
    }
  }

  // Return original URL if no pattern matches
  console.warn('[Google Drive URL] No pattern matched for:', url);
  return url;
}

/**
 * Convert SharePoint/OneDrive share link to direct image URL
 * @param url - SharePoint/OneDrive URL
 * @returns Direct image URL
 * 
 * @example
 * // Input: https://contoso.sharepoint.com/:i:/s/site/image.jpg?e=abc
 * // Output: https://contoso.sharepoint.com/:i:/s/site/image.jpg?e=abc&download=1
 */
export function convertSharePointUrl(url: string): string {
  // Already has download parameter
  if (url.includes('download=1')) {
    return url;
  }

  // Add download parameter to force direct download/display
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}download=1`;
}

/**
 * Convert cloud storage URLs to direct image URLs
 * Automatically detects and converts Google Drive or SharePoint URLs
 * 
 * @param url - Image URL from Google Drive or SharePoint
 * @returns Direct image URL that can be used in <img> src
 * 
 * @example
 * getDirectImageUrl('https://drive.google.com/file/d/ABC/view')
 * // Returns: 'https://drive.google.com/uc?export=view&id=ABC'
 * 
 * getDirectImageUrl('https://tenant.sharepoint.com/:i:/s/site/image.jpg')
 * // Returns: 'https://tenant.sharepoint.com/:i:/s/site/image.jpg?download=1'
 */
export function getDirectImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  // Validate URL format
  try {
    new URL(url);
  } catch {
    console.warn('[Image URL] Invalid URL format:', url);
    return undefined;
  }

  // Google Drive - convert share links to direct URLs
  if (url.includes('drive.google.com')) {
    return convertGoogleDriveUrl(url);
  }

  // Invalid shortened Google share links - return undefined to show placeholder
  if (url.includes('share.google')) {
    console.warn('[Image URL] Invalid shortened Google share link:', url);
    return undefined;
  }

  // SharePoint/OneDrive - add download parameter
  if (url.includes('sharepoint.com') || url.includes('1drv.ms')) {
    return convertSharePointUrl(url);
  }

  // Direct URLs (already in correct format)
  return url;
}
