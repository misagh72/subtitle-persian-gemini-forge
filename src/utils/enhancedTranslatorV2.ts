import { TranslationSettings, TranslationStatus } from './translator';
import { TranslationQualitySettings } from './translationQuality';
import { QualityScore } from './translationMemory';
import { cleanPersianTranslation } from './postProcessPersian';
import { TranslationProcessor } from './translationProcessor';
import { TranslationErrorHandler } from './errorHandler';
import { ProcessingMetrics } from '@/types/translation';

export interface AdvancedTranslationSettings extends TranslationSettings {
  qualitySettings: TranslationQualitySettings;
  enablePatternDetection: boolean;
  enableGrammarCheck: boolean;
  enableSentimentAnalysis: boolean;
  enableCoherenceCheck: boolean;
  usePersonalApi: boolean;
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
    const totalTexts = texts.length;
    const startTime = Date.now();
    
    const metrics: ProcessingMetrics = {
      startTime,
      processedTexts: 0,
      failedTexts: 0,
      retryCount: 0
    };
    
    console.log(`📊 Processing ${totalTexts} texts`);
    onStatusUpdate?.('شروع ترجمه...');
    
    try {
      // Create processing chunks
      const chunks = TranslationProcessor.createChunks(texts, settings.numberOfChunks);
      console.log(`📦 Created ${chunks.length} processing chunks`);
      
      // Process each chunk
      for (const chunk of chunks) {
        if (this.abortController.signal.aborted) {
          throw new Error('ترجمه توسط کاربر متوقف شد');
        }
        
        onStatusUpdate?.(`ترجمه بخش ${chunk.chunkIndex + 1} از ${chunk.totalChunks}...`);
        
        await TranslationErrorHandler.withRetry(
          async () => {
            const chunkResults = await TranslationProcessor.processChunk(
              chunk,
              settings,
              this.abortController!.signal,
              metrics
            );
            
            // Merge results
            chunkResults.forEach((translation, original) => {
              const cleanedTranslation = cleanPersianTranslation(translation);
              translations.set(original, cleanedTranslation);
            });
          },
          `Chunk ${chunk.chunkIndex + 1}`,
          (attempt, error) => {
            metrics.retryCount++;
            onStatusUpdate?.(`تلاش مجدد ${attempt} برای بخش ${chunk.chunkIndex + 1}...`);
          }
        );
        
        // Update progress
        const progress = Math.min(((chunk.chunkIndex + 1) / chunks.length) * 100, 100);
        const elapsedTime = Date.now() - startTime;
        const estimatedTotal = chunks.length > 0 ? (elapsedTime / (chunk.chunkIndex + 1)) * chunks.length : elapsedTime;
        const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsedTime);
        
        onProgress?.({
          isTranslating: true,
          progress: Math.round(progress),
          currentChunk: chunk.chunkIndex + 1,
          totalChunks: chunks.length,
          translatedCount: translations.size,
          totalTexts,
          estimatedTimeRemaining
        });
        
        // Small delay between chunks
        if (chunk.chunkIndex + 1 < chunks.length && !this.abortController.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`🎉 Translation completed! ${translations.size} texts translated successfully`);
      return translations;
      
    } catch (error) {
      const normalizedError = TranslationErrorHandler.normalizeError(error);
      console.error('❌ Translation failed:', normalizedError);
      throw new Error(TranslationErrorHandler.getErrorMessage(normalizedError));
    }
  }

  static cancelTranslation() {
    console.log('🛑 Cancelling translation...');
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
