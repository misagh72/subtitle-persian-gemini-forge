
import { useState, useCallback } from 'react';
import { TranslationSettings, TranslationStatus } from '@/utils/translator';
import { TranslationQualitySettings } from '@/utils/translationQuality';
import { QualityScore } from '@/utils/translationMemory';
import { TranslationMemory } from '@/utils/translationMemory';

export interface TranslationState {
  selectedFile: File | null;
  isTranslating: boolean;
  translatedContent: string;
  error: string | null;
  status: TranslationStatus;
  statusMessage: string;
  dialogueCount: number;
  qualityScores: QualityScore[];
  showQualityReport: boolean;
  showMemoryManagement: boolean;
}

export const useTranslationState = () => {
  const [state, setState] = useState<TranslationState>({
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
    showQualityReport: false,
    showMemoryManagement: false
  });

  const updateState = useCallback((updates: Partial<TranslationState>) => {
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
      qualityScores: []
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

  const toggleQualityReport = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showQualityReport: !prev.showQualityReport 
    }));
  }, []);

  const toggleMemoryManagement = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showMemoryManagement: !prev.showMemoryManagement 
    }));
  }, []);

  // function to clear translation memory
  const clearTranslationMemory = useCallback(() => {
    TranslationMemory.clearMemory();
  }, []);

  // memory count function
  const getMemoryCount = useCallback(() => {
    return TranslationMemory.getMemory().length;
  }, []);

  return {
    ...state,
    updateState,
    resetTranslation,
    setSelectedFile,
    addQualityScores,
    toggleQualityReport,
    toggleMemoryManagement,
    clearTranslationMemory,
    getMemoryCount,
  };
};

// Settings presets
export const TRANSLATION_PRESETS = {
  fast: {
    name: 'سریع',
    settings: {
      temperature: 0.3,
      topP: 0.8,
      topK: 20,
      numberOfChunks: 10,
      baseDelay: 500,
      quotaDelay: 5000,
      maxRetries: 2
    }
  },
  balanced: {
    name: 'متعادل',
    settings: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      numberOfChunks: 5,
      baseDelay: 1000,
      quotaDelay: 10000,
      maxRetries: 3
    }
  },
  quality: {
    name: 'با کیفیت',
    settings: {
      temperature: 0.9,
      topP: 0.95,
      topK: 60,
      numberOfChunks: 3,
      baseDelay: 2000,
      quotaDelay: 15000,
      maxRetries: 5
    }
  }
};

export const useSettingsState = () => {
  const [settings, setSettings] = useState<TranslationSettings & { usePersonalApi: boolean; enableThinking: boolean }>({
    apiKey: '',
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    usePersonalApi: false,
    baseDelay: 1000,
    quotaDelay: 10000,
    numberOfChunks: 5,
    geminiModel: 'gemini-2.0-flash-exp',
    maxRetries: 3,
    enableThinking: false
  });

  const [qualitySettings, setQualitySettings] = useState<TranslationQualitySettings>({
    genre: 'animation',
    formalityLevel: 'informal',
    preserveNames: true,
    contextualTranslation: true,
    qualityCheck: true,
    useTranslationContext: true,
    fullContextMode: false,
    maxContextTokens: 8000,
    maxContextExamples: 15
  });

  const updateSettings = useCallback((updates: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const updateQualitySettings = useCallback((updates: Partial<TranslationQualitySettings>) => {
    setQualitySettings(prev => ({ ...prev, ...updates }));
  }, []);

  const applyPreset = useCallback((presetName: keyof typeof TRANSLATION_PRESETS) => {
    const preset = TRANSLATION_PRESETS[presetName];
    updateSettings(preset.settings);
  }, [updateSettings]);

  return {
    settings,
    qualitySettings,
    updateSettings,
    updateQualitySettings,
    applyPreset
  };
};
