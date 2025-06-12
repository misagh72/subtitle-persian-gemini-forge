export interface TranslationSettings {
  temperature: number;
  topP: number;
  topK: number;
  apiKey?: string;
  baseDelay: number;
  quotaDelay: number;
  numberOfChunks: number;
  geminiModel: string;
  maxRetries?: number;
  enableThinking?: boolean;
}

export interface TranslationStatus {
  isTranslating: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
  translatedCount: number;
  totalTexts: number;
  estimatedTimeRemaining?: number;
}

export class GeminiTranslator {
  private static readonly DEFAULT_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
  private static abortController: AbortController | null = null;
  
  static async translateTexts(
    texts: string[], 
    settings: TranslationSettings,
    onProgress?: (status: TranslationStatus) => void,
    onStatusUpdate?: (message: string) => void
  ): Promise<Map<string, string>> {
    // Create new abort controller for this translation
    this.abortController = new AbortController();
    
    const translations = new Map<string, string>();
    const totalTexts = texts.length;
    const chunkSize = Math.ceil(totalTexts / settings.numberOfChunks);
    const maxRetries = settings.maxRetries || 3;
    const startTime = Date.now();
    
    onStatusUpdate?.('شروع ترجمه...');
    
    for (let i = 0; i < totalTexts; i += chunkSize) {
      // Check if translation was cancelled
      if (this.abortController.signal.aborted) {
        throw new Error('ترجمه توسط کاربر متوقف شد');
      }
      
      const batch = texts.slice(i, Math.min(i + chunkSize, totalTexts));
      const currentChunk = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(totalTexts / chunkSize);
      
      onStatusUpdate?.(`ترجمه بخش ${currentChunk} از ${totalChunks}...`);
      
      let retryCount = 0;
      let batchSuccess = false;
      
      while (retryCount <= maxRetries && !batchSuccess && !this.abortController.signal.aborted) {
        try {
          const batchTranslations = await this.translateBatch(
            batch, 
            settings, 
            this.abortController.signal
          );
          
          batch.forEach((text, index) => {
            if (batchTranslations[index]) {
              translations.set(text, batchTranslations[index]);
            }
          });
          
          batchSuccess = true;
          
          const progress = Math.min(((i + chunkSize) / totalTexts) * 100, 100);
          const elapsedTime = Date.now() - startTime;
          const estimatedTotal = (elapsedTime / progress) * 100;
          const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsedTime);
          
          onProgress?.({
            isTranslating: true,
            progress: Math.round(progress),
            currentChunk,
            totalChunks,
            translatedCount: translations.size,
            totalTexts,
            estimatedTimeRemaining
          });
          
        } catch (error) {
          retryCount++;
          
          if (this.abortController.signal.aborted) {
            throw new Error('ترجمه توسط کاربر متوقف شد');
          }
          
          console.error(`خطا در ترجمه بخش ${currentChunk}, تلاش ${retryCount}:`, error);
          
          const isQuotaError = error instanceof Error && (
            error.message.includes('quota') || 
            error.message.includes('rate') ||
            error.message.includes('429')
          );
          
          if (isQuotaError && retryCount <= maxRetries) {
            onStatusUpdate?.(`محدودیت API رسید، انتظار ${settings.quotaDelay / 1000} ثانیه...`);
            await new Promise(resolve => setTimeout(resolve, settings.quotaDelay));
          } else if (retryCount <= maxRetries) {
            onStatusUpdate?.(`تلاش مجدد ${retryCount} از ${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            onStatusUpdate?.(`خطا در ترجمه بخش ${currentChunk}: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
            // Continue with next batch instead of failing completely
            break;
          }
        }
      }
      
      // Apply base delay between successful batches
      if (batchSuccess && i + chunkSize < totalTexts && !this.abortController.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, settings.baseDelay));
      }
    }
    
    return translations;
  }

  static cancelTranslation() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private static async translateBatch(
    texts: string[], 
    settings: TranslationSettings,
    signal: AbortSignal
  ): Promise<string[]> {
    const prompt = this.createTranslationPrompt(texts);
    
    const requestBody: any = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        maxOutputTokens: 2048,
      }
    };

    // Add thinking mode for Gemini 2.5 Flash if enabled
    if (settings.geminiModel === 'gemini-2.5-flash-preview-05-20' && settings.enableThinking) {
      requestBody.systemInstruction = {
        parts: [{ 
          text: "Think step by step about the translation. Consider context, cultural nuances, and subtitle formatting requirements before providing the final translation."
        }]
      };
    }

    const apiKey = settings.apiKey || 'AIzaSyBvZwZQ_Qy9r8vK7NxY2mL4jP6wX3oE8tA';
    const response = await fetch(`${this.DEFAULT_API_ENDPOINT}/${settings.geminiModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`خطای API ترجمه: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('فرمت پاسخ نامعتبر از API ترجمه');
    }

    const translatedText = data.candidates[0].content.parts[0].text;
    return this.parseTranslationResponse(translatedText, texts.length);
  }

  private static createTranslationPrompt(texts: string[]): string {
    const textList = texts.map((text, index) => `${index + 1}. ${text}`).join('\n');
    
    return `لطفاً متن‌های زیر را از هر زبانی که هستند به فارسی ترجمه کنید. این متن‌ها بخشی از زیرنویس فیلم هستند. ترجمه باید طبیعی، روان و مناسب برای زیرنویس باشد.

متن‌های مورد نظر:
${textList}

لطفاً پاسخ خود را دقیقاً به همین فرمت ارائه دهید:
1. [ترجمه فارسی متن اول]
2. [ترجمه فارسی متن دوم]
...

نکات مهم:
- فقط ترجمه را بنویسید، توضیح اضافی ندهید
- ترجمه باید مناسب برای زیرنویس فیلم باشد
- از کلمات ساده و روان استفاده کنید
- ترتیب و شماره‌گذاری را حفظ کنید`;
  }

  private static parseTranslationResponse(response: string, expectedCount: number): string[] {
    const lines = response.trim().split('\n');
    const translations: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        translations.push(match[1].trim());
      }
    }
    
    // Fallback if parsing fails
    if (translations.length !== expectedCount) {
      console.warn('Translation parsing mismatch, using fallback');
      const fallbackLines = response.split('\n').filter(line => line.trim());
      return fallbackLines.slice(0, expectedCount);
    }
    
    return translations;
  }
}
