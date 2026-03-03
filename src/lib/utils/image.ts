const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

/**
 * Resolve an image URL — if it's a relative /uploads path, prefix with backend URL.
 * If it's already an absolute URL (https://...), return as-is.
 */
export function resolveImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Relative upload path — prefix with backend URL
  if (url.startsWith('/uploads')) {
    return `${BACKEND_URL}${url}`;
  }
  
  return url;
}
