
import { ApiError } from '@/types/translation';

export class TranslationErrorHandler {
  private static readonly MAX_RETRIES = 2;
  private static readonly RETRY_DELAYS = {
    NETWORK_ERROR: 3000,
    RATE_LIMIT: 5000,
    SERVER_ERROR: 2000,
    DEFAULT: 1000
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    onRetry?: (attempt: number, error: ApiError) => void
  ): Promise<T> {
    let lastError: ApiError;
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.normalizeError(error);
        
        console.error(`❌ ${context} failed (attempt ${attempt + 1}):`, lastError);
        
        if (attempt === this.MAX_RETRIES || !lastError.retryable) {
          break;
        }
        
        onRetry?.(attempt + 1, lastError);
        
        const delay = this.getRetryDelay(lastError);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  static normalizeError(error: any): ApiError {
    if (this.isApiError(error)) {
      return error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new ApiError({
          code: 'ABORTED',
          message: 'ترجمه توسط کاربر متوقف شد',
          retryable: false
        });
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return new ApiError({
          code: 'NETWORK_ERROR',
          message: 'خطای اتصال به اینترنت',
          retryable: true
        });
      }
      
      if (error.message.includes('quota') || error.message.includes('429')) {
        return new ApiError({
          code: 'RATE_LIMIT',
          message: 'محدودیت API - لطفا چند دقیقه صبر کنید',
          retryable: true
        });
      }
    }
    
    return new ApiError({
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'خطای نامشخص',
      retryable: false
    });
  }

  static getErrorMessage(error: ApiError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'خطای اتصال به اینترنت - لطفا اتصال خود را بررسی کنید';
      case 'RATE_LIMIT':
        return 'محدودیت API - لطفا چند دقیقه صبر کنید و دوباره تلاش کنید';
      case 'INVALID_API_KEY':
        return 'کلید API نامعتبر - لطفا کلید صحیح وارد کنید';
      case 'ABORTED':
        return 'ترجمه توسط کاربر متوقف شد';
      default:
        return error.message;
    }
  }

  private static isApiError(error: any): error is ApiError {
    return error instanceof ApiError;
  }

  private static getRetryDelay(error: ApiError): number {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return this.RETRY_DELAYS.NETWORK_ERROR;
      case 'RATE_LIMIT':
        return this.RETRY_DELAYS.RATE_LIMIT;
      case 'SERVER_ERROR':
        return this.RETRY_DELAYS.SERVER_ERROR;
      default:
        return this.RETRY_DELAYS.DEFAULT;
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
