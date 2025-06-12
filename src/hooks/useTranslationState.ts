
import { useState, useCallback } from 'react';
import { TranslationSettings, TranslationStatus } from '@/utils/translator';

export interface TranslationState {
  selectedFile: File | null;
  isTranslating: boolean;
  translatedContent: string;
  error: string | null;
  status: TranslationStatus;
  statusMessage: string;
  dialogueCount: number;
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
    dialogueCount: 0
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
      statusMessage: ''
    });
  }, [updateState]);

  const setSelectedFile = useCallback((file: File | null) => {
    updateState({ selectedFile: file });
    if (file) {
      resetTranslation();
    }
  }, [updateState, resetTranslation]);

  return {
    ...state,
    updateState,
    resetTranslation,
    setSelectedFile
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

  const updateSettings = useCallback((updates: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const applyPreset = useCallback((presetName: keyof typeof TRANSLATION_PRESETS) => {
    const preset = TRANSLATION_PRESETS[presetName];
    updateSettings(preset.settings);
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    applyPreset
  };
};
