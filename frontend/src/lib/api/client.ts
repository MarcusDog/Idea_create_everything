/**
 * API Client for Idea Create Everything
 * Handles communication with the backend FastAPI service
 */

import { getApiUrl } from './config';

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiClient {
  // Don't store baseUrl - get it dynamically on each request
  private getBaseUrl(): string {
    const apiUrl = getApiUrl().replace(/\/$/, ''); // Remove trailing slash
    return `${apiUrl}/api/v1`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include',
      // Add timeout support
      signal: options.signal,
    };

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          if (isJson) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          }
        } catch {
          // Ignore JSON parsing errors for error responses
        }

        const error: ApiError = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      return isJson ? await response.json() : (await response.text()) as T;
    } catch (error) {
      if (error instanceof Error) {
        // Handle abort errors
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - API took too long to respond');
        }
        throw error;
      }
      throw new Error('Network error: Unable to connect to API');
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Health check utility
export async function checkApiHealth(): Promise<{ status: string; version: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

    const response = await fetch(`${getApiUrl()}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API health check failed: HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API health check timeout');
    }
    throw error;
  }
}

export default apiClient;
