
export interface TranslationRequest {
  texts: string[];
  settings: AdvancedTranslationSettings;
}

export interface TranslationResponse {
  translations: Map<string, string>;
  qualityScores: QualityScore[];
  processingTime: number;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  statusCode?: number;
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
export type { QualityScore } from '@/utils/translationMemory';
export type { AdvancedQualityReport, AdvancedTranslationSettings } from '@/utils/enhancedTranslatorV2';
