import { TranslationMemory } from '@/utils/translationMemory';
import { TranslationQualityService } from '@/utils/translationQuality';
import { TranslationChunk, ProcessingMetrics, AdvancedTranslationSettings, QualityScore } from '@/types/translation';
import { TranslationApiClient } from './apiClient';
import { TranslationContext } from './translationContext';

export class TranslationProcessor {
  private static readonly MAX_CHUNK_SIZE = 10;
  private static readonly MEMORY_CONFIDENCE_THRESHOLD = 0.95;

  static createChunks(texts: string[], numberOfChunks: number): TranslationChunk[] {
    const totalTexts = texts.length;
    const actualChunks = Math.min(numberOfChunks, 5); // Limit chunks
    const chunkSize = Math.max(1, Math.ceil(totalTexts / actualChunks));
    const chunks: TranslationChunk[] = [];
    
    console.log(`📦 Creating chunks: ${totalTexts} texts into ${actualChunks} chunks (size: ${chunkSize})`);
    
    for (let i = 0; i < totalTexts; i += chunkSize) {
      const cleanedTexts = texts.slice(i, Math.min(i + chunkSize, totalTexts))
        .map(text => TranslationQualityService.cleanText(text));
      
      chunks.push({
        texts: cleanedTexts,
        originalTexts: texts.slice(i, Math.min(i + chunkSize, totalTexts)),
        chunkIndex: Math.floor(i / chunkSize),
        totalChunks: Math.ceil(totalTexts / chunkSize)
      });
      
      console.log(`📦 Chunk ${Math.floor(i / chunkSize) + 1}: ${cleanedTexts.length} texts`);
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
    
    console.log(`🔄 Processing chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} with ${chunk.texts.length} texts`);
    
    // Check memory first
    const { memoryHits, needsTranslation, needsTranslationOriginal } = 
      this.checkMemoryForChunk(chunk);
    
    console.log(`📚 Memory hits: ${memoryHits.size}, Need translation: ${needsTranslation.length}`);
    
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

    // Add chunk results to translation context
    TranslationContext.addChunkTranslations(chunk, results);

    console.log(`✅ Chunk ${chunk.chunkIndex + 1} completed: ${results.size} translations`);
    return results;
  }

  private static async translateTexts(
    texts: string[],
    originalTexts: string[],
    settings: AdvancedTranslationSettings,
    signal: AbortSignal,
    metrics: ProcessingMetrics
  ): Promise<Map<string, string>> {
    console.log(`🌐 Translating ${texts.length} texts via API`);
    
    const prompt = this.createPrompt(texts, settings);
    console.log(`📝 Prompt created for ${texts.length} texts`);
    
    const response = await TranslationApiClient.makeRequest(prompt, settings, signal);
    console.log(`📨 API response received (${response.length} chars)`);
    
    const parsedTranslations = this.parseResponse(response, texts.length);
    console.log(`🔍 Parsed ${parsedTranslations.length} translations (expected: ${texts.length})`);
    
    const results = new Map<string, string>();
    
    originalTexts.forEach((originalText, index) => {
      if (index < parsedTranslations.length && parsedTranslations[index]) {
        const cleanedTranslation = TranslationQualityService.cleanText(parsedTranslations[index]);
        
        console.log(`✅ Mapping [${index}]: "${originalText.substring(0, 20)}..." → "${cleanedTranslation.substring(0, 20)}..."`);
        
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
      } else {
        console.warn(`⚠️ Missing translation for index ${index}: "${originalText.substring(0, 30)}..."`);
      }
    });
    
    console.log(`📊 Translation results: ${results.size}/${originalTexts.length} successful`);
    return results;
  }

  private static createPrompt(texts: string[], settings: AdvancedTranslationSettings): string {
    let translationContext = '';
    
    if (settings.qualitySettings.useTranslationContext) {
      const contextOptions = {
        mode: settings.qualitySettings.fullContextMode ? 'full' as const : 'limited' as const,
        maxTokens: settings.qualitySettings.maxContextTokens || 8000,
        maxExamples: settings.qualitySettings.maxContextExamples || 15,
        similarityThreshold: 0.3
      };
      
      translationContext = TranslationContext.buildContext(texts, contextOptions);
      
      const tokenEstimate = TranslationContext.getTokenEstimate(translationContext, '');
      console.log(`📊 Context stats: ${tokenEstimate.context} tokens, mode: ${contextOptions.mode}`);
    }
    
    return TranslationQualityService.createEnhancedPrompt(texts, settings.qualitySettings, translationContext);
  }

  private static parseResponse(response: string, expectedCount: number): string[] {
    console.log(`🔍 Parsing response for ${expectedCount} expected translations`);
    console.log(`📄 Response preview: "${response.substring(0, 200)}${response.length > 200 ? '...' : ''}"`);
    
    let translations: string[] = [];
    
    // Method 1: Try splitting by double newlines (paragraph separator)
    translations = response.split('\n\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log(`🔍 Method 1 (double newlines): Found ${translations.length} translations`);
    
    // Method 2: If that doesn't work, try single newlines
    if (translations.length !== expectedCount) {
      console.log('⚠️ Double newline parsing failed, trying single newlines');
      translations = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.match(/^[1-9۰-۹]+\.?\s*$/)) // Remove standalone numbers
        .map(line => {
          // Remove any leading numbers or bullets
          return line
            .replace(/^\d+\.\s*/, '')
            .replace(/^[۰-۹]+\.\s*/, '')
            .replace(/^[-•*]\s*/, '')
            .trim();
        })
        .filter(line => line.length > 0);
      
      console.log(`🔍 Method 2 (single newlines): Found ${translations.length} translations`);
    }
    
    // Method 3: Try triple dash separator (---)
    if (translations.length !== expectedCount) {
      console.log('⚠️ Newline parsing failed, trying triple dash separator');
      translations = response.split('---')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      console.log(`🔍 Method 3 (triple dash): Found ${translations.length} translations`);
    }
    
    // Method 4: Try to extract only Persian text lines
    if (translations.length !== expectedCount) {
      console.log('⚠️ Separator parsing failed, extracting Persian text');
      const lines = response.split('\n');
      translations = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Check if line contains significant Persian content
        const persianChars = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
        const totalChars = trimmed.replace(/\s/g, '').length;
        
        if (trimmed.length > 0 && persianChars > totalChars * 0.5 && trimmed.length > 2) {
          // Clean the line
          const cleaned = trimmed
            .replace(/^\d+\.\s*/, '')
            .replace(/^[۰-۹]+\.\s*/, '')
            .replace(/^[-•*]\s*/, '')
            .trim();
          
          if (cleaned.length > 0) {
            translations.push(cleaned);
          }
        }
      }
      
      console.log(`🔍 Method 4 (Persian extraction): Found ${translations.length} translations`);
    }
    
    // Final cleanup and validation
    translations = translations
      .slice(0, expectedCount)
      .map(text => TranslationQualityService.cleanText(text))
      .filter(text => text.length > 0);
    
    console.log(`📊 Final result: ${translations.length} translations (expected: ${expectedCount})`);
    
    // Log each translation for debugging
    translations.forEach((translation, index) => {
      console.log(`🔤 Translation [${index}]: "${translation.substring(0, 50)}${translation.length > 50 ? '...' : ''}"`);
    });
    
    // If we still don't have enough translations, pad with empty strings
    while (translations.length < expectedCount) {
      console.warn(`⚠️ Adding empty string for missing translation ${translations.length + 1}`);
      translations.push('');
    }
    
    return translations;
  }
}
