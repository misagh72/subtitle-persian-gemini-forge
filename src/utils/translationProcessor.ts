import { TranslationMemory } from '@/utils/translationMemory';
import { TranslationQualityService } from '@/utils/translationQuality';
import { TranslationChunk, ProcessingMetrics, AdvancedTranslationSettings, QualityScore } from '@/types/translation';
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
    const parsedTranslations = this.parseResponse(response, texts.length);
    
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

  private static parseResponse(response: string, expectedCount: number): string[] {
    console.log('🔍 Parsing response:', response.substring(0, 200) + '...');
    
    // Split by separator used in prompt (---)
    let translations = response.split('\n---\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // If separator method doesn't work, try line-by-line
    if (translations.length !== expectedCount) {
      console.log('⚠️ Separator parsing failed, trying line-by-line');
      translations = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // Remove any leading numbers or bullets
          return line
            .replace(/^\d+\.\s*/, '')
            .replace(/^[۰-۹]+\.\s*/, '')
            .replace(/^[-•*]\s*/, '')
            .trim();
        })
        .filter(line => line.length > 0);
    }
    
    // If still doesn't match, try numbered parsing as fallback
    if (translations.length !== expectedCount) {
      console.log('⚠️ Line parsing failed, trying numbered parsing');
      const numberedTranslations: string[] = [];
      const lines = response.trim().split('\n');
      
      for (const line of lines) {
        const match = line.match(/^\d+\.\s*(.+)$/) || line.match(/^[۰-۹]+\.\s*(.+)$/);
        if (match) {
          numberedTranslations.push(match[1].trim());
        }
      }
      
      if (numberedTranslations.length > 0) {
        translations = numberedTranslations;
      }
    }
    
    // Final cleanup and validation
    translations = translations
      .slice(0, expectedCount)
      .map(text => TranslationQualityService.cleanText(text));
    
    console.log(`📊 Parsed ${translations.length} translations (expected: ${expectedCount})`);
    
    // If we still don't have enough translations, pad with empty strings
    while (translations.length < expectedCount) {
      translations.push('');
    }
    
    return translations;
  }
}
