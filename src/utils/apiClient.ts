
import { AdvancedTranslationSettings, ApiError } from '@/types/translation';

export class TranslationApiClient {
  private static readonly DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
  private static readonly DEFAULT_TIMEOUT = 30000;

  static async makeRequest(
    prompt: string,
    settings: AdvancedTranslationSettings,
    signal: AbortSignal
  ): Promise<string> {
    const apiKey = this.getApiKey(settings);
    const requestBody = this.buildRequestBody(prompt, settings);
    const url = this.buildUrl(settings.geminiModel, apiKey);

    try {
      const response = await this.fetchWithTimeout(url, requestBody, signal);
      return this.handleResponse(response);
    } catch (error) {
      throw this.transformError(error);
    }
  }

  private static getApiKey(settings: AdvancedTranslationSettings): string {
    const apiKey = settings.usePersonalApi ? settings.apiKey : 'AIzaSyBvZwZQ_Qy9r8vK7NxY2mL4jP6wX3oE8tA';
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('کلید API یافت نشد');
    }
    
    return apiKey;
  }

  private static buildRequestBody(prompt: string, settings: AdvancedTranslationSettings): any {
    return {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: Math.max(0.1, Math.min(settings.temperature || 0.4, 1.0)),
        topP: Math.max(0.1, Math.min(settings.topP || 0.95, 1.0)),
        topK: Math.max(1, Math.min(settings.topK || 40, 40)),
        maxOutputTokens: 2048,
      }
    };
  }

  private static buildUrl(model: string, apiKey: string): string {
    return `${this.DEFAULT_ENDPOINT}/${model}:generateContent?key=${apiKey}`;
  }

  private static async fetchWithTimeout(
    url: string,
    requestBody: any,
    signal: AbortSignal
  ): Promise<Response> {
    const timeoutId = setTimeout(() => {
      if (!signal.aborted) {
        const controller = new AbortController();
        controller.abort();
      }
    }, this.DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  }

  private static async handleResponse(response: Response): Promise<string> {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status}`, errorText);
      
      const apiError = new ApiError({
        code: response.status.toString(),
        message: this.getErrorMessage(response.status),
        retryable: this.isRetryableError(response.status),
        statusCode: response.status
      });
      
      throw apiError;
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new ApiError({
        code: 'INVALID_RESPONSE',
        message: 'فرمت پاسخ نامعتبر از API',
        retryable: false
      });
    }

    return data.candidates[0].content.parts[0].text;
  }

  private static getErrorMessage(status: number): string {
    switch (status) {
      case 429:
        return 'محدودیت نرخ API - لطفا چند لحظه صبر کنید';
      case 403:
        return 'دسترسی غیرمجاز - کلید API را بررسی کنید';
      case 500:
      case 502:
      case 503:
        return 'خطای سرور Google - لطفا بعدا تلاش کنید';
      default:
        return `خطای API: ${status}`;
    }
  }

  private static isRetryableError(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private static transformError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new ApiError({
          code: 'ABORTED',
          message: 'درخواست لغو شد',
          retryable: false
        });
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return new ApiError({
          code: 'NETWORK_ERROR',
          message: 'خطای شبکه - لطفا اتصال خود را بررسی کنید',
          retryable: true
        });
      }
    }

    return new ApiError({
      code: 'UNKNOWN_ERROR',
      message: 'خطای نامشخص',
      retryable: false
    });
  }
}
