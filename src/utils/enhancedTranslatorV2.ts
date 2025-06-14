
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
    this.abortController = new AbortController();
    
    const translations = new Map<string, string>();
    const qualityScores: QualityScore[] = [];
    const totalTexts = texts.length;
    const chunkSize = Math.ceil(totalTexts / settings.numberOfChunks);
    const maxRetries = settings.maxRetries || 3;
    const startTime = Date.now();
    
    // مرحله 1: تشخیص الگوهای مکرر
    let recurringPatterns: RecurringPattern[] = [];
    if (settings.enablePatternDetection) {
      onStatusUpdate?.('تشخیص الگوهای مکرر...');
      recurringPatterns = AdvancedQualityService.detectRecurringPatterns(texts);
      console.log(`شناسایی ${recurringPatterns.length} الگوی مکرر`);
    }
    
    // Pre-process texts
    const cleanedTexts = texts.map(text => TranslationQualityService.cleanText(text));
    
    onStatusUpdate?.('شروع ترجمه با تحلیل پیشرفته...');
    
    for (let i = 0; i < totalTexts; i += chunkSize) {
      if (this.abortController.signal.aborted) {
        throw new Error('ترجمه توسط کاربر متوقف شد');
      }
      
      const batch = cleanedTexts.slice(i, Math.min(i + chunkSize, totalTexts));
      const originalBatch = texts.slice(i, Math.min(i + chunkSize, totalTexts));
      const currentChunk = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(totalTexts / chunkSize);
      
      onStatusUpdate?.(`ترجمه بخش ${currentChunk} از ${totalChunks} با بررسی کیفیت پیشرفته...`);
      
      // Check memory for existing translations
      const memoryResults = new Map<string, string>();
      const needsTranslation: string[] = [];
      const needsTranslationOriginal: string[] = [];
      
      for (let j = 0; j < batch.length; j++) {
        const text = batch[j];
        const originalText = originalBatch[j];
        
        // بررسی الگوهای مکرر
        let foundPattern = false;
        if (settings.enablePatternDetection) {
          for (const pattern of recurringPatterns) {
            if (text.includes(pattern.pattern) && pattern.translations.size > 0) {
              const preferredTranslation = Array.from(pattern.translations.entries())
                .sort((a, b) => b[1] - a[1])[0][0];
              memoryResults.set(originalText, text.replace(pattern.pattern, preferredTranslation));
              foundPattern = true;
              break;
            }
          }
        }
        
        if (!foundPattern) {
          const similar = TranslationMemory.findSimilar(text, 0.95);
          if (similar.length > 0 && similar[0].confidence > 0.98) {
            memoryResults.set(originalText, similar[0].target);
          } else {
            needsTranslation.push(text);
            needsTranslationOriginal.push(originalText);
          }
        }
      }
      
      // Add memory/pattern translations
      memoryResults.forEach((translation, original) => {
        translations.set(original, translation);
      });
      
      // Translate remaining texts
      if (needsTranslation.length > 0) {
        let retryCount = 0;
        let batchSuccess = false;
        
        while (retryCount <= maxRetries && !batchSuccess && !this.abortController.signal.aborted) {
          try {
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
            
            // Post-process and validate translations
            needsTranslationOriginal.forEach((originalText, index) => {
              if (batchTranslations[index]) {
                let translation = TranslationQualityService.cleanText(batchTranslations[index]);
                
                // مرحله بررسی گرامر
                if (settings.enableGrammarCheck) {
                  const grammarIssues = AdvancedQualityService.checkPersianGrammar(translation);
                  if (grammarIssues.length > 0) {
                    // اعمال تصحیحات خودکار
                    grammarIssues.forEach(issue => {
                      if (issue.severity === 'high') {
                        translation = issue.suggestion;
                      }
                    });
                  }
                }
                
                // تحلیل احساسات
                if (settings.enableSentimentAnalysis) {
                  const sentimentAnalysis = AdvancedQualityService.analyzeSentiment(
                    originalText, 
                    translation
                  );
                  
                  if (sentimentAnalysis.consistency < 70) {
                    console.warn(`انسجام احساسی پایین: ${sentimentAnalysis.consistency}% برای "${originalText}"`);
                  }
                }
                
                // Quality check and scoring
                if (settings.qualitySettings.qualityCheck) {
                  const qualityScore = TranslationMemory.generateQualityScore(
                    originalText, 
                    translation, 
                    settings.qualitySettings.genre
                  );
                  qualityScores.push(qualityScore);
                }
                
                // بروزرسانی الگوهای مکرر
                if (settings.enablePatternDetection) {
                  recurringPatterns.forEach(pattern => {
                    if (needsTranslation[index].includes(pattern.pattern)) {
                      if (!pattern.translations.has(translation)) {
                        pattern.translations.set(translation, 0);
                      }
                      pattern.translations.set(translation, pattern.translations.get(translation)! + 1);
                    }
                  });
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
    
    // تولید گزارش پیشرفته نهایی
    if (translations.size > 0) {
      onStatusUpdate?.('تولید گزارش کیفیت پیشرفته...');
      
      const allGrammarIssues: GrammarIssue[] = [];
      const sentimentAnalyses: { consistency: number }[] = [];
      
      if (settings.enableGrammarCheck || settings.enableSentimentAnalysis) {
        translations.forEach((translated, original) => {
          if (settings.enableGrammarCheck) {
            const grammarIssues = AdvancedQualityService.checkPersianGrammar(translated);
            allGrammarIssues.push(...grammarIssues);
          }
          
          if (settings.enableSentimentAnalysis) {
            const sentimentAnalysis = AdvancedQualityService.analyzeSentiment(original, translated);
            sentimentAnalyses.push({ consistency: sentimentAnalysis.consistency });
          }
        });
      }
      
      let coherenceCheck: CoherenceCheck = {
        consistency: 100,
        terminologyIssues: [],
        styleIssues: [],
        suggestions: []
      };
      
      if (settings.enableCoherenceCheck) {
        coherenceCheck = AdvancedQualityService.checkCoherence(translations);
      }
      
      const avgSentimentConsistency = sentimentAnalyses.length > 0 
        ? sentimentAnalyses.reduce((sum, s) => sum + s.consistency, 0) / sentimentAnalyses.length 
        : 100;
      
      const overallScore = (
        (avgSentimentConsistency * 0.3) +
        (coherenceCheck.consistency * 0.4) +
        (Math.max(0, 100 - allGrammarIssues.length * 5) * 0.3)
      );
      
      const detailedReport = AdvancedQualityService.generateAdvancedReport(
        recurringPatterns,
        allGrammarIssues,
        sentimentAnalyses,
        coherenceCheck
      );
      
      const advancedReport: AdvancedQualityReport = {
        patterns: recurringPatterns,
        grammarIssues: allGrammarIssues,
        sentimentConsistency: avgSentimentConsistency,
        coherenceCheck,
        overallScore,
        detailedReport
      };
      
      onAdvancedReport?.(advancedReport);
      console.log('Advanced Quality Report:', detailedReport);
    }
    
    return translations;
  }

  static cancelTranslation() {
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
    
    // اضافه کردن اطلاعات الگوهای مکرر
    if (patterns.length > 0) {
      const patternInstructions = patterns.map(p => 
        `"${p.pattern}" → "${p.preferredTranslation}"`
      ).join('\n');
      
      basePrompt += `\n\n**الگوهای مکرر شناسایی شده:**
برای عبارات زیر از ترجمه‌های ثابت استفاده کنید:
${patternInstructions}`;
    }
    
    // اضافه کردن دستورالعمل‌های پیشرفته
    basePrompt += `\n\n**دستورالعمل‌های کیفیت پیشرفته:**`;
    
    if (settings.enableGrammarCheck) {
      basePrompt += `\n- گرامر فارسی را دقیق رعایت کنید و از نیم‌فاصله استفاده کنید`;
    }
    
    if (settings.enableSentimentAnalysis) {
      basePrompt += `\n- بار احساسی و تون متن اصلی را حفظ کنید`;
    }
    
    if (settings.enableCoherenceCheck) {
      basePrompt += `\n- ثبات در استفاده از اصطلاحات و سبک ترجمه را حفظ کنید`;
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
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        maxOutputTokens: 2048,
      }
    };

    if (settings.geminiModel === 'gemini-2.5-flash-preview-05-20' && settings.enableThinking) {
      requestBody.systemInstruction = {
        parts: [{ 
          text: "Think step by step about the translation. Consider context, cultural nuances, subtitle formatting requirements, recurring patterns, grammatical correctness, sentiment preservation, and coherence across all translations before providing the final translation. Ensure natural and fluent Persian output with consistent terminology."
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
      const fallbackLines = response.split('\n').filter(line => line.trim());
      return fallbackLines;
    }
    
    return translations;
  }
}
