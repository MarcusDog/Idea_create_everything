/**
 * API Configuration
 * Handles different API URLs for server-side and client-side requests
 */

// Server-side API URL (from container to container)
export const SERVER_API_URL = process.env.API_URL || 'http://backend:8000';

// Client-side API URL (from browser to host)
export const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get the appropriate API URL based on execution context
 */
export function getApiUrl(): string {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    return SERVER_API_URL;
  }

  // Client side - use the public URL
  return CLIENT_API_URL;
}

/**
 * Get base API URL for API routes
 */
export function getApiBaseUrl(): string {
  return `${getApiUrl()}/api/v1`;
}

export default getApiUrl;
