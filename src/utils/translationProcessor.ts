
import { TranslationMemory, QualityScore } from '@/utils/translationMemory';
import { TranslationQualityService } from '@/utils/translationQuality';
import { AdvancedTranslationSettings } from '@/utils/enhancedTranslatorV2';
import { TranslationChunk, ProcessingMetrics } from '@/types/translation';
import { TranslationApiClient } from './apiClient';

export class TranslationProcessor {
  private static readonly MAX_CHUNK_SIZE = 10;
  private static readonly MEMORY_CONFIDENCE_THRESHOLD = 0.95;

  static createChunks(texts: string[], numberOfChunks: number): TranslationChunk[] {
    const totalTexts = texts.length;
    const actualChunks = Math.min(numberOfChunks, 5); // Limit chunks
    const chunkSize = Math.max(1, Math.ceil(totalTexts / actualChunks));
    const chunks: TranslationChunk[] = [];
    
    for (let i = 0; i < totalTexts; i += chunkSize) {
      const cleanedTexts = texts.slice(i, Math.min(i + chunkSize, totalTexts))
        .map(text => TranslationQualityService.cleanText(text));
      
      chunks.push({
        texts: cleanedTexts,
        originalTexts: texts.slice(i, Math.min(i + chunkSize, totalTexts)),
        chunkIndex: Math.floor(i / chunkSize),
        totalChunks: Math.ceil(totalTexts / chunkSize)
      });
    }
    
    return chunks;
  }

  static checkMemoryForChunk(chunk: TranslationChunk): {
    memoryHits: Map<string, string>;
    needsTranslation: string[];
    needsTranslationOriginal: string[];
  } {
    const memoryHits = new Map<string, string>();
    const needsTranslation: string[] = [];
    const needsTranslationOriginal: string[] = [];

    for (let i = 0; i < chunk.texts.length; i++) {
      const text = chunk.texts[i];
      const originalText = chunk.originalTexts[i];
      
      const similar = TranslationMemory.findSimilar(text, this.MEMORY_CONFIDENCE_THRESHOLD);
      if (similar.length > 0 && similar[0].confidence > 0.98) {
        memoryHits.set(originalText, similar[0].target);
        console.log(`📚 Memory hit: "${originalText.substring(0, 30)}..."`);
      } else {
        needsTranslation.push(text);
        needsTranslationOriginal.push(originalText);
      }
    }

    return { memoryHits, needsTranslation, needsTranslationOriginal };
  }

  static async processChunk(
    chunk: TranslationChunk,
    settings: AdvancedTranslationSettings,
    signal: AbortSignal,
    metrics: ProcessingMetrics
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Check memory first
    const { memoryHits, needsTranslation, needsTranslationOriginal } = 
      this.checkMemoryForChunk(chunk);
    
    // Add memory hits to results
    memoryHits.forEach((translation, original) => {
      results.set(original, translation);
    });

    // Translate remaining texts
    if (needsTranslation.length > 0) {
      const translations = await this.translateTexts(
        needsTranslation,
        needsTranslationOriginal,
        settings,
        signal,
        metrics
      );
      
      translations.forEach((translation, original) => {
        results.set(original, translation);
      });
    }

    return results;
  }

  private static async translateTexts(
    texts: string[],
    originalTexts: string[],
    settings: AdvancedTranslationSettings,
    signal: AbortSignal,
    metrics: ProcessingMetrics
  ): Promise<Map<string, string>> {
    const prompt = this.createPrompt(texts, settings);
    const response = await TranslationApiClient.makeRequest(prompt, settings, signal);
    const parsedTranslations = this.parseResponse(response);
    
    const results = new Map<string, string>();
    
    originalTexts.forEach((originalText, index) => {
      if (parsedTranslations[index]) {
        const cleanedTranslation = TranslationQualityService.cleanText(parsedTranslations[index]);
        
        // Add to memory
        TranslationMemory.addEntry({
          source: texts[index],
          target: cleanedTranslation,
          confidence: 1.0,
          timestamp: Date.now(),
          context: settings.qualitySettings.genre
        });
        
        results.set(originalText, cleanedTranslation);
        metrics.processedTexts++;
      }
    });
    
    return results;
  }

  private static createPrompt(texts: string[], settings: AdvancedTranslationSettings): string {
    return TranslationQualityService.createEnhancedPrompt(texts, settings.qualitySettings);
  }

  private static parseResponse(response: string): string[] {
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
      return response.split('\n').filter(line => line.trim());
    }
    
    return translations;
  }
}
