
import { TranslationSettings, TranslationStatus } from '@/utils/translator';
import { TranslationQualitySettings } from '@/utils/translationQuality';

export interface AdvancedTranslationSettings extends TranslationSettings {
  qualitySettings: TranslationQualitySettings;
  enablePatternDetection: boolean;
  enableGrammarCheck: boolean;
  enableSentimentAnalysis: boolean;
  enableCoherenceCheck: boolean;
  usePersonalApi: boolean;
}

export interface QualityScore {
  overall: number;
  fluency: number;
  accuracy: number;
  consistency: number;
  suggestions: string[];
}

export interface RecurringPattern {
  pattern: string;
  frequency: number;
  translations: string[];
  confidence: number;
}

export interface GrammarIssue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface CoherenceCheck {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface TranslationRequest {
  texts: string[];
  settings: AdvancedTranslationSettings;
}

export interface TranslationResponse {
  translations: Map<string, string>;
  qualityScores: QualityScore[];
  processingTime: number;
}

export class ApiError extends Error {
  public code: string;
  public retryable: boolean;
  public statusCode?: number;

  constructor(options: {
    code: string;
    message: string;
    retryable: boolean;
    statusCode?: number;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.code = options.code;
    this.retryable = options.retryable;
    this.statusCode = options.statusCode;
  }
}

export interface TranslationChunk {
  texts: string[];
  originalTexts: string[];
  chunkIndex: number;
  totalChunks: number;
}

export interface ProcessingMetrics {
  startTime: number;
  processedTexts: number;
  failedTexts: number;
  retryCount: number;
}

// Re-export commonly used types
export type { TranslationSettings, TranslationStatus } from '@/utils/translator';
export type { TranslationQualitySettings } from '@/utils/translationQuality';
