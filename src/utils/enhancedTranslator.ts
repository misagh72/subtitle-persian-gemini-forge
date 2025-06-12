
import { TranslationSettings, TranslationStatus } from './translator';
import { TranslationQualitySettings, TranslationQualityService } from './translationQuality';
import { TranslationMemory, QualityScore } from './translationMemory';

export interface EnhancedTranslationSettings extends TranslationSettings {
  qualitySettings: TranslationQualitySettings;
}

export class EnhancedGeminiTranslator {
  private static readonly DEFAULT_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
  private static abortController: AbortController | null = null;
  
  static async translateTexts(
    texts: string[], 
    settings: EnhancedTranslationSettings,
    onProgress?: (status: TranslationStatus) => void,
    onStatusUpdate?: (message: string) => void,
    onQualityScore?: (scores: QualityScore[]) => void
  ): Promise<Map<string, string>> {
    this.abortController = new AbortController();
    
    const translations = new Map<string, string>();
    const qualityScores: QualityScore[] = [];
    const totalTexts = texts.length;
    const chunkSize = Math.ceil(totalTexts / settings.numberOfChunks);
    const maxRetries = settings.maxRetries || 3;
    const startTime = Date.now();
    
    // Pre-process texts
    const cleanedTexts = texts.map(text => TranslationQualityService.cleanText(text));
    
    onStatusUpdate?.('شروع ترجمه با تنظیمات کیفیت بهبود یافته...');
    
    for (let i = 0; i < totalTexts; i += chunkSize) {
      if (this.abortController.signal.aborted) {
        throw new Error('ترجمه توسط کاربر متوقف شد');
      }
      
      const batch = cleanedTexts.slice(i, Math.min(i + chunkSize, totalTexts));
      const originalBatch = texts.slice(i, Math.min(i + chunkSize, totalTexts));
      const currentChunk = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(totalTexts / chunkSize);
      
      onStatusUpdate?.(`ترجمه بخش ${currentChunk} از ${totalChunks} با بررسی حافظه ترجمه...`);
      
      // Check memory for existing translations
      const memoryResults = new Map<string, string>();
      const needsTranslation: string[] = [];
      const needsTranslationOriginal: string[] = [];
      
      for (let j = 0; j < batch.length; j++) {
        const text = batch[j];
        const originalText = originalBatch[j];
        const similar = TranslationMemory.findSimilar(text, 0.95);
        
        if (similar.length > 0 && similar[0].confidence > 0.98) {
          // Use memory translation
          memoryResults.set(originalText, similar[0].target);
          onStatusUpdate?.(`استفاده از حافظه ترجمه: ${similar[0].confidence.toFixed(2)} اطمینان`);
        } else {
          needsTranslation.push(text);
          needsTranslationOriginal.push(originalText);
        }
      }
      
      // Add memory translations
      memoryResults.forEach((translation, original) => {
        translations.set(original, translation);
      });
      
      // Translate remaining texts
      if (needsTranslation.length > 0) {
        let retryCount = 0;
        let batchSuccess = false;
        
        while (retryCount <= maxRetries && !batchSuccess && !this.abortController.signal.aborted) {
          try {
            const batchTranslations = await this.translateBatch(
              needsTranslation, 
              settings, 
              this.abortController.signal
            );
            
            // Post-process and validate translations
            needsTranslationOriginal.forEach((originalText, index) => {
              if (batchTranslations[index]) {
                let translation = TranslationQualityService.cleanText(batchTranslations[index]);
                
                // Quality check and scoring
                if (settings.qualitySettings.qualityCheck) {
                  const qualityScore = TranslationMemory.generateQualityScore(
                    originalText, 
                    translation, 
                    settings.qualitySettings.genre
                  );
                  qualityScores.push(qualityScore);
                  
                  // Log quality issues
                  if (qualityScore.overall < 70) {
                    console.warn(`Low quality translation detected for: "${originalText}"`);
                    console.warn(`Score: ${qualityScore.overall}, Suggestions: ${qualityScore.suggestions.join(', ')}`);
                  }
                }
                
                // Add to memory
                TranslationMemory.addEntry({
                  source: needsTranslation[index],
                  target: translation,
                  confidence: 1.0,
                  timestamp: Date.now(),
                  context: settings.qualitySettings.genre
                });
                
                translations.set(originalText, translation);
              }
            });
            
            batchSuccess = true;
            
            // Report quality scores
            if (qualityScores.length > 0) {
              onQualityScore?.(qualityScores);
            }
            
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
              break;
            }
          }
        }
      }
      
      if (i + chunkSize < totalTexts && !this.abortController.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, settings.baseDelay));
      }
    }
    
    // Generate final quality report
    if (settings.qualitySettings.qualityCheck && qualityScores.length > 0) {
      const avgScore = qualityScores.reduce((sum, score) => sum + score.overall, 0) / qualityScores.length;
      const report = `گزارش نهایی کیفیت ترجمه:
امتیاز کلی: ${avgScore.toFixed(1)}/100
تعداد ترجمه: ${qualityScores.length}
استفاده از حافظه: ${translations.size - qualityScores.length} ترجمه
نوع محتوا: ${settings.qualitySettings.genre}
سطح رسمیت: ${settings.qualitySettings.formalityLevel}`;
      
      console.log('Final Quality Report:', report);
      onStatusUpdate?.('گزارش کیفیت نهایی تولید شد');
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
    settings: EnhancedTranslationSettings,
    signal: AbortSignal
  ): Promise<string[]> {
    const prompt = TranslationQualityService.createEnhancedPrompt(texts, settings.qualitySettings);
    
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

    if (settings.geminiModel === 'gemini-2.5-flash-preview-05-20' && settings.enableThinking) {
      requestBody.systemInstruction = {
        parts: [{ 
          text: "Think step by step about the translation. Consider context, cultural nuances, subtitle formatting requirements, and the specific genre before providing the final translation. Ensure natural and fluent Persian output."
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

  private static parseTranslationResponse(response: string, expectedCount: number): string[] {
    const lines = response.trim().split('\n');
    const translations: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        translations.push(match[1].trim());
      }
    }
    
    if (translations.length !== expectedCount) {
      console.warn('Translation parsing mismatch, using fallback');
      const fallbackLines = response.split('\n').filter(line => line.trim());
      return fallbackLines.slice(0, expectedCount);
    }
    
    return translations;
  }
}
