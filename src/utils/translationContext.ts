import { TranslationMemory } from '@/utils/translationMemory';
import { TranslationChunk } from '@/types/translation';

export interface TranslationContextEntry {
  source: string;
  target: string;
  chunkIndex: number;
  confidence: number;
  timestamp: number;
}

export interface ContextBuildOptions {
  mode: 'full' | 'limited';
  maxTokens: number;
  maxExamples: number;
  similarityThreshold: number;
}

export interface TokenEstimate {
  context: number;
  prompt: number;
  total: number;
  isWithinLimit: boolean;
}

export class TranslationContext {
  private static chunkHistory: TranslationContextEntry[] = [];
  private static readonly AVERAGE_TOKENS_PER_CHAR = 0.25; // Rough estimate for multilingual content
  
  static addChunkTranslations(chunk: TranslationChunk, translations: Map<string, string>) {
    const entries: TranslationContextEntry[] = [];
    
    chunk.originalTexts.forEach((original, index) => {
      const translation = translations.get(original);
      if (translation) {
        entries.push({
          source: chunk.texts[index],
          target: translation,
          chunkIndex: chunk.chunkIndex,
          confidence: 1.0,
          timestamp: Date.now()
        });
      }
    });
    
    this.chunkHistory.push(...entries);
    
    // Limit history size to prevent memory issues
    if (this.chunkHistory.length > 500) {
      this.chunkHistory = this.chunkHistory.slice(-300);
    }
    
    console.log(`📚 Added ${entries.length} entries to chunk history (total: ${this.chunkHistory.length})`);
  }
  
  static buildContext(currentTexts: string[], options: ContextBuildOptions): string {
    const { mode, maxTokens, maxExamples, similarityThreshold } = options;
    let context = '';
    
    if (mode === 'full') {
      context = this.buildFullContext(currentTexts, maxExamples, similarityThreshold);
    } else {
      context = this.buildLimitedContext(currentTexts, maxExamples, similarityThreshold);
    }
    
    // Truncate if exceeds token limit
    const tokenEstimate = this.estimateTokens(context);
    if (tokenEstimate > maxTokens) {
      const targetChars = Math.floor(maxTokens / this.AVERAGE_TOKENS_PER_CHAR);
      context = context.substring(0, targetChars) + '...';
      console.log(`✂️ Context truncated to ${targetChars} chars to fit token limit`);
    }
    
    return context;
  }
  
  private static buildFullContext(currentTexts: string[], maxExamples: number, similarityThreshold: number): string {
    const contextParts: string[] = [];
    
    // Add relevant chunk history
    const relevantHistory = this.findRelevantChunkHistory(currentTexts, similarityThreshold);
    if (relevantHistory.length > 0) {
      contextParts.push('📖 Previous translations in this session:');
      relevantHistory.slice(0, Math.floor(maxExamples * 0.6)).forEach(entry => {
        contextParts.push(`• "${entry.source}" → "${entry.target}"`);
      });
    }
    
    // Add relevant translation memory
    const memoryContext = this.buildMemoryContext(currentTexts, Math.floor(maxExamples * 0.4), similarityThreshold);
    if (memoryContext) {
      if (contextParts.length > 0) contextParts.push('');
      contextParts.push(memoryContext);
    }
    
    return contextParts.join('\n');
  }
  
  private static buildLimitedContext(currentTexts: string[], maxExamples: number, similarityThreshold: number): string {
    const contextParts: string[] = [];
    
    // Add only last chunk history (limited)
    const lastChunkEntries = this.getLastChunkEntries(5);
    if (lastChunkEntries.length > 0) {
      contextParts.push('📖 Recent translations:');
      lastChunkEntries.forEach(entry => {
        contextParts.push(`• "${entry.source}" → "${entry.target}"`);
      });
    }
    
    // Add limited memory context
    const memoryContext = this.buildMemoryContext(currentTexts, Math.max(3, maxExamples - lastChunkEntries.length), similarityThreshold);
    if (memoryContext) {
      if (contextParts.length > 0) contextParts.push('');
      contextParts.push(memoryContext);
    }
    
    return contextParts.join('\n');
  }
  
  private static buildMemoryContext(currentTexts: string[], maxExamples: number, similarityThreshold: number): string {
    const recentMemory = TranslationMemory.getMemory().slice(0, 20);
    if (recentMemory.length === 0) return '';
    
    // Find relevant memory entries
    const relevantEntries = this.findRelevantMemoryEntries(currentTexts, recentMemory, similarityThreshold);
    
    if (relevantEntries.length === 0) {
      // Fallback to recent entries
      const fallbackEntries = recentMemory.slice(0, Math.min(maxExamples, 3));
      if (fallbackEntries.length > 0) {
        return '📚 Recent translation patterns:\n' + 
               fallbackEntries.map(entry => `• "${entry.source}" → "${entry.target}"`).join('\n');
      }
      return '';
    }
    
    return '📚 Similar translation patterns:\n' + 
           relevantEntries.slice(0, maxExamples).map(entry => `• "${entry.source}" → "${entry.target}"`).join('\n');
  }
  
  private static findRelevantChunkHistory(currentTexts: string[], threshold: number): TranslationContextEntry[] {
    const relevant: Array<{ entry: TranslationContextEntry; similarity: number }> = [];
    
    this.chunkHistory.forEach(entry => {
      const maxSimilarity = Math.max(
        ...currentTexts.map(text => this.calculateSimilarity(text.toLowerCase(), entry.source.toLowerCase()))
      );
      
      if (maxSimilarity >= threshold) {
        relevant.push({ entry, similarity: maxSimilarity });
      }
    });
    
    return relevant
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.entry);
  }
  
  private static findRelevantMemoryEntries(currentTexts: string[], memoryEntries: any[], threshold: number): any[] {
    const relevant: Array<{ entry: any; similarity: number }> = [];
    
    memoryEntries.forEach(entry => {
      const maxSimilarity = Math.max(
        ...currentTexts.map(text => this.calculateSimilarity(text.toLowerCase(), entry.source.toLowerCase()))
      );
      
      if (maxSimilarity >= threshold) {
        relevant.push({ entry, similarity: maxSimilarity });
      }
    });
    
    return relevant
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.entry);
  }
  
  private static getLastChunkEntries(count: number): TranslationContextEntry[] {
    if (this.chunkHistory.length === 0) return [];
    
    const lastChunkIndex = this.chunkHistory[this.chunkHistory.length - 1].chunkIndex;
    return this.chunkHistory
      .filter(entry => entry.chunkIndex === lastChunkIndex)
      .slice(-count);
  }
  
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  static estimateTokens(text: string): number {
    return Math.ceil(text.length * this.AVERAGE_TOKENS_PER_CHAR);
  }
  
  static getTokenEstimate(context: string, promptBase: string): TokenEstimate {
    const contextTokens = this.estimateTokens(context);
    const promptTokens = this.estimateTokens(promptBase);
    const total = contextTokens + promptTokens;
    
    return {
      context: contextTokens,
      prompt: promptTokens,
      total,
      isWithinLimit: total < 30000 // Conservative limit
    };
  }
  
  static clearHistory() {
    this.chunkHistory = [];
    console.log('🗑️ Translation context history cleared');
  }
  
  static getHistoryStats() {
    const totalEntries = this.chunkHistory.length;
    const chunks = new Set(this.chunkHistory.map(e => e.chunkIndex)).size;
    const avgEntriesPerChunk = chunks > 0 ? Math.round(totalEntries / chunks) : 0;
    
    return {
      totalEntries,
      chunks,
      avgEntriesPerChunk,
      memoryEntries: TranslationMemory.getMemory().length
    };
  }
}