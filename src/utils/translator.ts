export interface TranslationSettings {
  temperature: number;
  topP: number;
  topK: number;
  apiKey?: string;
  baseDelay: number;
  quotaDelay: number;
  numberOfChunks: number;
  geminiModel: string;
}

export class GeminiTranslator {
  private static readonly DEFAULT_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  static async translateTexts(
    texts: string[], 
    settings: TranslationSettings,
    onProgress?: (progress: number) => void
  ): Promise<Map<string, string>> {
    const translations = new Map<string, string>();
    const totalTexts = texts.length;
    
    // Calculate chunk size based on numberOfChunks setting
    const chunkSize = Math.ceil(totalTexts / settings.numberOfChunks);
    
    for (let i = 0; i < totalTexts; i += chunkSize) {
      const batch = texts.slice(i, Math.min(i + chunkSize, totalTexts));
      
      try {
        const batchTranslations = await this.translateBatch(batch, settings);
        
        batch.forEach((text, index) => {
          if (batchTranslations[index]) {
            translations.set(text, batchTranslations[index]);
          }
        });
        
        const progress = Math.min(((i + chunkSize) / totalTexts) * 100, 100);
        onProgress?.(Math.round(progress));
        
        // Apply base delay between batches
        if (i + chunkSize < totalTexts) {
          await new Promise(resolve => setTimeout(resolve, settings.baseDelay));
        }
      } catch (error) {
        console.error('Translation batch failed:', error);
        
        // Check if it's a quota/rate limit error and apply quota delay
        if (error instanceof Error && (
          error.message.includes('quota') || 
          error.message.includes('rate') ||
          error.message.includes('429')
        )) {
          console.log(`Quota limit hit, waiting ${settings.quotaDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, settings.quotaDelay));
          
          // Retry the batch after quota delay
          try {
            const retryTranslations = await this.translateBatch(batch, settings);
            batch.forEach((text, index) => {
              if (retryTranslations[index]) {
                translations.set(text, retryTranslations[index]);
              }
            });
          } catch (retryError) {
            console.error('Retry after quota delay also failed:', retryError);
          }
        }
      }
    }
    
    return translations;
  }

  private static async translateBatch(texts: string[], settings: TranslationSettings): Promise<string[]> {
    const prompt = this.createTranslationPrompt(texts);
    
    const requestBody = {
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

    const apiKey = settings.apiKey || 'AIzaSyBvZwZQ_Qy9r8vK7NxY2mL4jP6wX3oE8tA';
    const response = await fetch(`${this.DEFAULT_API_ENDPOINT}/${settings.geminiModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from translation API');
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
