
import { useState, useCallback } from 'react';
import { TranslationStatus } from '@/utils/translator';
import { TranslationQualitySettings } from '@/utils/translationQuality';
import { QualityScore } from '@/utils/translationMemory';
import { AdvancedQualityReport, AdvancedTranslationSettings } from '@/utils/enhancedTranslatorV2';

export interface AdvancedTranslationState {
  selectedFile: File | null;
  isTranslating: boolean;
  translatedContent: string;
  error: string | null;
  status: TranslationStatus;
  statusMessage: string;
  dialogueCount: number;
  qualityScores: QualityScore[];
  advancedReport: AdvancedQualityReport | null;
  showQualityReport: boolean;
  showAdvancedReport: boolean;
  showMemoryManagement: boolean;
}

export const useAdvancedTranslationState = () => {
  const [state, setState] = useState<AdvancedTranslationState>({
    selectedFile: null,
    isTranslating: false,
    translatedContent: '',
    error: null,
    status: {
      isTranslating: false,
      progress: 0,
      currentChunk: 0,
      totalChunks: 0,
      translatedCount: 0,
      totalTexts: 0
    },
    statusMessage: '',
    dialogueCount: 0,
    qualityScores: [],
    advancedReport: null,
    showQualityReport: false,
    showAdvancedReport: false,
    showMemoryManagement: false
  });

  const updateState = useCallback((updates: Partial<AdvancedTranslationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetTranslation = useCallback(() => {
    updateState({
      isTranslating: false,
      translatedContent: '',
      error: null,
      status: {
        isTranslating: false,
        progress: 0,
        currentChunk: 0,
        totalChunks: 0,
        translatedCount: 0,
        totalTexts: 0
      },
      statusMessage: '',
      qualityScores: [],
      advancedReport: null
    });
  }, [updateState]);

  const setSelectedFile = useCallback((file: File | null) => {
    updateState({ selectedFile: file });
    if (file) {
      resetTranslation();
    }
  }, [updateState, resetTranslation]);

  const addQualityScores = useCallback((scores: QualityScore[]) => {
    setState(prev => ({
      ...prev,
      qualityScores: [...prev.qualityScores, ...scores]
    }));
  }, []);

  const setAdvancedReport = useCallback((report: AdvancedQualityReport) => {
    updateState({ advancedReport: report });
  }, [updateState]);

  const toggleQualityReport = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showQualityReport: !prev.showQualityReport 
    }));
  }, []);

  const toggleAdvancedReport = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showAdvancedReport: !prev.showAdvancedReport 
    }));
  }, []);

  const toggleMemoryManagement = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showMemoryManagement: !prev.showMemoryManagement 
    }));
  }, []);

  return {
    ...state,
    updateState,
    resetTranslation,
    setSelectedFile,
    addQualityScores,
    setAdvancedReport,
    toggleQualityReport,
    toggleAdvancedReport,
    toggleMemoryManagement
  };
};

export const useAdvancedSettingsState = () => {
  const [settings, setSettings] = useState<AdvancedTranslationSettings>({
    apiKey: '',
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    baseDelay: 1000,
    quotaDelay: 10000,
    numberOfChunks: 5,
    geminiModel: 'gemini-2.0-flash-exp',
    maxRetries: 3,
    enableThinking: false,
    qualitySettings: {
      genre: 'movie',
      formalityLevel: 'neutral',
      preserveNames: true,
      contextualTranslation: true,
      qualityCheck: true,
      useTranslationContext: true
    },
    enablePatternDetection: true,
    enableGrammarCheck: true,
    enableSentimentAnalysis: true,
    enableCoherenceCheck: true,
    usePersonalApi: false
  });

  const updateSettings = useCallback((updates: Partial<AdvancedTranslationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const updateQualitySettings = useCallback((updates: Partial<TranslationQualitySettings>) => {
    setSettings(prev => ({ 
      ...prev, 
      qualitySettings: { ...prev.qualitySettings, ...updates }
    }));
  }, []);

  const toggleAdvancedFeature = useCallback((
    feature: keyof Pick<AdvancedTranslationSettings, 
      'enablePatternDetection' | 'enableGrammarCheck' | 'enableSentimentAnalysis' | 'enableCoherenceCheck'>
  ) => {
    setSettings(prev => ({ ...prev, [feature]: !prev[feature] }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings({
      apiKey: '',
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      baseDelay: 1000,
      quotaDelay: 10000,
      numberOfChunks: 5,
      geminiModel: 'gemini-2.0-flash-exp',
      maxRetries: 3,
      enableThinking: false,
      qualitySettings: {
        genre: 'movie',
        formalityLevel: 'neutral',
        preserveNames: true,
        contextualTranslation: true,
        qualityCheck: true,
        useTranslationContext: true
      },
      enablePatternDetection: true,
      enableGrammarCheck: true,
      enableSentimentAnalysis: true,
      enableCoherenceCheck: true,
      usePersonalApi: false
    });
  }, []);

  const validateSettings = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (settings.usePersonalApi && (!settings.apiKey || settings.apiKey.trim() === '')) {
      errors.push('کلید API الزامی است');
    }
    
    if (settings.temperature < 0 || settings.temperature > 1) {
      errors.push('دمای تولید باید بین 0 تا 1 باشد');
    }
    
    if (settings.numberOfChunks < 1 || settings.numberOfChunks > 10) {
      errors.push('تعداد بخش‌ها باید بین 1 تا 10 باشد');
    }
    
    return errors;
  }, [settings]);

  return {
    settings,
    updateSettings,
    updateQualitySettings,
    toggleAdvancedFeature,
    resetToDefaults,
    validateSettings,
    isValid: validateSettings().length === 0
  };
};
