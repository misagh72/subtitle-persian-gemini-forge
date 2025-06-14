
import { TranslationSettings, TranslationStatus } from './translator';
import { TranslationQualitySettings, TranslationQualityService } from './translationQuality';
import { TranslationMemory, QualityScore } from './translationMemory';
import { AdvancedQualityService, RecurringPattern, GrammarIssue, CoherenceCheck } from './advancedQuality';

export interface AdvancedTranslationSettings extends TranslationSettings {
  qualitySettings: TranslationQualitySettings;
  enablePatternDetection: boolean;
  enableGrammarCheck: boolean;
  enableSentimentAnalysis: boolean;
  enableCoherenceCheck: boolean;
}

export interface AdvancedQualityReport {
  patterns: RecurringPattern[];
  grammarIssues: GrammarIssue[];
  sentimentConsistency: number;
  coherenceCheck: CoherenceCheck;
  overallScore: number;
  detailedReport: string;
}

export class EnhancedGeminiTranslatorV2 {
  private static readonly DEFAULT_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
  private static abortController: AbortController | null = null;
  
  static async translateTexts(
    texts: string[], 
    settings: AdvancedTranslationSettings,
    onProgress?: (status: TranslationStatus) => void,
    onStatusUpdate?: (message: string) => void,
    onQualityScore?: (scores: QualityScore[]) => void,
    onAdvancedReport?: (report: AdvancedQualityReport) => void
  ): Promise<Map<string, string>> {
    console.log('🔄 Enhanced Translator V2 starting...');
    
    this.abortController = new AbortController();
    
    const translations = new Map<string, string>();
    const qualityScores: QualityScore[] = [];
    const totalTexts = texts.length;
    const chunkSize = Math.max(1, Math.ceil(totalTexts / settings.numberOfChunks));
    const maxRetries = Math.max(1, Math.min(settings.maxRetries || 3, 3)); // Limit retries
    const startTime = Date.now();
    
    console.log(`📊 Processing ${totalTexts} texts in ${Math.ceil(totalTexts / chunkSize)} chunks`);
    
    // Simplified pattern detection
    let recurringPatterns: RecurringPattern[] = [];
    if (settings.enablePatternDetection) {
      try {
        onStatusUpdate?.('تشخیص الگوهای مکرر...');
        recurringPatterns = AdvancedQualityService.detectRecurringPatterns(texts);
        console.log(`✅ Found ${recurringPatterns.length} recurring patterns`);
      } catch (error) {
        console.warn('⚠️ Pattern detection failed:', error);
        recurringPatterns = [];
      }
    }
    
    // Pre-process texts
    const cleanedTexts = texts.map(text => TranslationQualityService.cleanText(text));
    
    onStatusUpdate?.('شروع ترجمه با تحلیل پیشرفته...');
    
    // Process in chunks with error handling
    for (let i = 0; i < totalTexts; i += chunkSize) {
      if (this.abortController.signal.aborted) {
        console.log('🛑 Translation cancelled by user');
        throw new Error('ترجمه توسط کاربر متوقف شد');
      }
      
      const batch = cleanedTexts.slice(i, Math.min(i + chunkSize, totalTexts));
      const originalBatch = texts.slice(i, Math.min(i + chunkSize, totalTexts));
      const currentChunk = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(totalTexts / chunkSize);
      
      console.log(`🔄 Processing chunk ${currentChunk}/${totalChunks} (${batch.length} texts)`);
      onStatusUpdate?.(`ترجمه بخش ${currentChunk} از ${totalChunks}...`);
      
      // Check memory for existing translations
      const memoryResults = new Map<string, string>();
      const needsTranslation: string[] = [];
      const needsTranslationOriginal: string[] = [];
      
      for (let j = 0; j < batch.length; j++) {
        const text = batch[j];
        const originalText = originalBatch[j];
        
        // Quick memory check
        const similar = TranslationMemory.findSimilar(text, 0.95);
        if (similar.length > 0 && similar[0].confidence > 0.98) {
          memoryResults.set(originalText, similar[0].target);
        } else {
          needsTranslation.push(text);
          needsTranslationOriginal.push(originalText);
        }
      }
      
      // Add memory translations
      memoryResults.forEach((translation, original) => {
        translations.set(original, translation);
        console.log(`📚 Used memory translation for: "${original.substring(0, 30)}..."`);
      });
      
      // Translate remaining texts with retry logic
      if (needsTranslation.length > 0) {
        let retryCount = 0;
        let batchSuccess = false;
        
        while (retryCount <= maxRetries && !batchSuccess && !this.abortController.signal.aborted) {
          try {
            console.log(`🌐 API call attempt ${retryCount + 1} for ${needsTranslation.length} texts`);
            
            const enhancedPrompt = this.createEnhancedPrompt(
              needsTranslation, 
              settings, 
              recurringPatterns
            );
            
            const batchTranslations = await this.translateBatch(
              enhancedPrompt, 
              settings, 
              this.abortController.signal
            );
            
            console.log(`✅ Received ${batchTranslations.length} translations from API`);
            
            // Process and store translations
            needsTranslationOriginal.forEach((originalText, index) => {
              if (batchTranslations[index]) {
                let translation = TranslationQualityService.cleanText(batchTranslations[index]);
                
                // Add to memory
                TranslationMemory.addEntry({
                  source: needsTranslation[index],
                  target: translation,
                  confidence: 1.0,
                  timestamp: Date.now(),
                  context: settings.qualitySettings.genre
                });
                
                translations.set(originalText, translation);
                console.log(`✅ Stored translation: "${originalText.substring(0, 30)}..." -> "${translation.substring(0, 30)}..."`);
              }
            });
            
            batchSuccess = true;
            
            // Update progress
            const progress = Math.min(((i + chunkSize) / totalTexts) * 100, 100);
            const elapsedTime = Date.now() - startTime;
            const estimatedTotal = totalTexts > 0 ? (elapsedTime / (i + chunkSize)) * totalTexts : elapsedTime;
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
            console.error(`❌ Translation error (attempt ${retryCount}):`, error);
            
            if (this.abortController.signal.aborted) {
              throw new Error('ترجمه توسط کاربر متوقف شد');
            }
            
            const isQuotaError = error instanceof Error && (
              error.message.includes('quota') || 
              error.message.includes('rate') ||
              error.message.includes('429')
            );
            
            if (isQuotaError && retryCount <= maxRetries) {
              const delayTime = Math.min(settings.quotaDelay || 5000, 10000); // Max 10 seconds
              onStatusUpdate?.(`محدودیت API، انتظار ${delayTime / 1000} ثانیه...`);
              await new Promise(resolve => setTimeout(resolve, delayTime));
            } else if (retryCount <= maxRetries) {
              onStatusUpdate?.(`تلاش مجدد ${retryCount} از ${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              console.error(`💥 Max retries exceeded for chunk ${currentChunk}`);
              onStatusUpdate?.(`خطا در ترجمه بخش ${currentChunk}: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
              break;
            }
          }
        }
      }
      
      // Delay between chunks (but not after the last one)
      if (i + chunkSize < totalTexts && !this.abortController.signal.aborted) {
        const delayTime = Math.min(settings.baseDelay || 1000, 3000); // Max 3 seconds
        console.log(`⏱️ Waiting ${delayTime}ms before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
    }
    
    console.log(`🎉 Translation completed! ${translations.size} texts translated successfully`);
    return translations;
  }

  static cancelTranslation() {
    console.log('🛑 Cancelling translation...');
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private static createEnhancedPrompt(
    texts: string[], 
    settings: AdvancedTranslationSettings,
    patterns: RecurringPattern[]
  ): string {
    let basePrompt = TranslationQualityService.createEnhancedPrompt(texts, settings.qualitySettings);
    
    // Add pattern instructions if available
    if (patterns.length > 0) {
      const patternInstructions = patterns.slice(0, 5).map(p => // Limit to 5 patterns
        `"${p.pattern}" → "${p.preferredTranslation}"`
      ).join('\n');
      
      basePrompt += `\n\n**الگوهای مکرر:**\n${patternInstructions}`;
    }
    
    return basePrompt;
  }

  private static async translateBatch(
    prompt: string, 
    settings: AdvancedTranslationSettings,
    signal: AbortSignal
  ): Promise<string[]> {
    const requestBody: any = {
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

    const apiKey = settings.apiKey || 'AIzaSyBvZwZQ_Qy9r8vK7NxY2mL4jP6wX3oE8tA';
    const model = settings.geminiModel || 'gemini-2.0-flash-exp';
    
    console.log(`🌐 Making API request to ${model}...`);
    
    const response = await fetch(`${this.DEFAULT_API_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`خطای API ترجمه: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid API response format:', data);
      throw new Error('فرمت پاسخ نامعتبر از API ترجمه');
    }

    const translatedText = data.candidates[0].content.parts[0].text;
    console.log(`✅ Received translation response (${translatedText.length} chars)`);
    
    return this.parseTranslationResponse(translatedText);
  }

  private static parseTranslationResponse(response: string): string[] {
    const lines = response.trim().split('\n');
    const translations: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        translations.push(match[1].trim());
      }
    }
    
    if (translations.length === 0) {
      console.warn('⚠️ No numbered translations found, using fallback parsing');
      const fallbackLines = response.split('\n').filter(line => line.trim());
      return fallbackLines;
    }
    
    console.log(`✅ Parsed ${translations.length} translations from response`);
    return translations;
  }
}
