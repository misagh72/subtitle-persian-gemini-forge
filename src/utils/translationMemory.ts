export interface MemoryEntry {
  source: string;
  target: string;
  confidence: number;
  timestamp: number;
  context?: string;
}

export interface QualityScore {
  overall: number;
  fluency: number;
  accuracy: number;
  consistency: number;
  suggestions: string[];
}

export class TranslationMemory {
  private static readonly STORAGE_KEY = 'translation_memory';
  private static readonly MAX_ENTRIES = 1000;
  
  static getMemory(): MemoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static addEntry(entry: MemoryEntry): void {
    const memory = this.getMemory();
    
    // Check for exact match
    const existingIndex = memory.findIndex(e => e.source === entry.source);
    if (existingIndex !== -1) {
      memory[existingIndex] = entry;
    } else {
      memory.unshift(entry);
      
      // Keep only the most recent entries
      if (memory.length > this.MAX_ENTRIES) {
        memory.splice(this.MAX_ENTRIES);
      }
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memory));
    } catch (error) {
      console.warn('Failed to save translation memory:', error);
    }
  }
  
  static findSimilar(text: string, threshold: number = 0.8): MemoryEntry[] {
    const memory = this.getMemory();
    const results: MemoryEntry[] = [];
    
    for (const entry of memory) {
      const similarity = this.calculateSimilarity(text, entry.source);
      if (similarity >= threshold) {
        results.push({ ...entry, confidence: similarity });
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  static generateQualityScore(original: string, translated: string, context?: string): QualityScore {
    let score = 100;
    const suggestions: string[] = [];
    
    // Length ratio check
    const lengthRatio = translated.length / original.length;
    let fluency = 100;
    
    if (lengthRatio > 1.3) {
      fluency -= 15;
      suggestions.push('ترجمه ممکن است بیش از حد طولانی باشد');
    } else if (lengthRatio < 0.7) {
      fluency -= 20;
      suggestions.push('ترجمه ممکن است بیش از حد کوتاه باشد');
    }
    
    // Persian character ratio
    const persianChars = (translated.match(/[\u0600-\u06FF]/g) || []).length;
    const totalChars = translated.replace(/\s/g, '').length;
    let accuracy = totalChars > 0 ? (persianChars / totalChars) * 100 : 0;
    
    if (accuracy < 70) {
      suggestions.push('نسبت کم کاراکترهای فارسی - اطمینان حاصل کنید که ترجمه به درستی انجام شده');
    }
    
    // Consistency check with memory
    const similar = this.findSimilar(original, 0.9);
    let consistency = 100;
    
    if (similar.length > 0) {
      const mostSimilar = similar[0];
      const translationSimilarity = this.calculateSimilarity(translated, mostSimilar.target);
      consistency = translationSimilarity * 100;
      
      if (consistency < 80) {
        suggestions.push(`ترجمه مشابه موجود: "${mostSimilar.target}"`);
      }
    }
    
    const overall = (fluency + accuracy + consistency) / 3;
    
    return {
      overall: Math.round(overall),
      fluency: Math.round(fluency),
      accuracy: Math.round(accuracy),
      consistency: Math.round(consistency),
      suggestions
    };
  }
  
  static clearMemory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  static exportMemory(): string {
    const memory = this.getMemory();
    return JSON.stringify(memory, null, 2);
  }
  
  static importMemory(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(imported));
        return true;
      }
    } catch {
      // Invalid JSON
    }
    return false;
  }
}
