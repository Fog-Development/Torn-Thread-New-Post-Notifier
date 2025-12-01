import { TornApiError, TornApiErrorCode } from '../models/api-types.js';

const BASE_URL = 'https://api.torn.com/v2';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class TornApiClient {
  private async fetchWithRetry<T>(url: string, retries = 0): Promise<T> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data.error) {
        const apiError = data as TornApiError;
        throw new ApiError(apiError.error.code, apiError.error.error);
      }

      return data as T;
    } catch (error) {
      // Retry on network errors, but not on API errors
      if (error instanceof ApiError) {
        throw error;
      }

      if (retries < MAX_RETRIES) {
        await this.delay(RETRY_DELAY_MS * Math.pow(2, retries));
        return this.fetchWithRetry<T>(url, retries + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string, apiKey: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}?key=${apiKey}`;
    return this.fetchWithRetry<T>(url);
  }
}

export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }

  isInvalidKey(): boolean {
    return this.code === TornApiErrorCode.KEY_INVALID || this.code === TornApiErrorCode.KEY_EMPTY;
  }

  isRateLimited(): boolean {
    return this.code === TornApiErrorCode.TOO_MANY_REQUESTS;
  }

  isNotFound(): boolean {
    return this.code === TornApiErrorCode.INCORRECT_ID;
  }
}
