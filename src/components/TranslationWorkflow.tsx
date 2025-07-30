import React from 'react';
import FileStats from '@/components/FileStats';
import TranslationProgress from '@/components/TranslationProgress';
import TranslationPreview from '@/components/TranslationPreview';
import TranslationActions from '@/components/TranslationActions';
import { useFileAnalysis } from '@/hooks/useFileAnalysis';
import { useTranslationActions } from '@/hooks/useTranslationActions';

interface TranslationWorkflowProps {
  selectedFile: File | null;
  isTranslating: boolean;
  translatedContent: string;
  error: string | null;
  status: any;
  statusMessage: string;
  dialogueCount: number;
  updateState: (updates: any) => void;
  resetTranslation: () => void;
  addQualityScores: (scores: any[]) => void;
  settings: any;
  qualitySettings: any;
}

const TranslationWorkflow: React.FC<TranslationWorkflowProps> = ({
  selectedFile,
  isTranslating,
  translatedContent,
  error,
  status,
  statusMessage,
  dialogueCount,
  updateState,
  resetTranslation,
  addQualityScores,
  settings,
  qualitySettings,
}) => {
  const { originalContent } = useFileAnalysis({ selectedFile, updateState });
  
  const {
    handleTranslate,
    handleDownload,
    handleCancelTranslation,
    handleRemoveFile,
  } = useTranslationActions({
    selectedFile,
    isTranslating,
    translatedContent,
    status,
    updateState,
    resetTranslation,
    addQualityScores,
    settings,
    qualitySettings,
  });

  return (
    <React.Fragment>
      {/* File Stats */}
      <FileStats
        selectedFile={selectedFile}
        dialogueCount={dialogueCount}
        estimatedTime={Math.ceil(dialogueCount / 10)}
      />
      {/* Translate Button */}
      <TranslationActions
        selectedFile={selectedFile}
        isTranslating={isTranslating}
        onTranslate={handleTranslate}
      />
      {/* Translation Progress */}
      <TranslationProgress
        isTranslating={isTranslating}
        status={status}
        translatedText={translatedContent}
        error={error}
        statusMessage={statusMessage}
        onDownload={handleDownload}
        onCancel={handleCancelTranslation}
        originalFileName={selectedFile?.name || ''}
      />
      {/* Translation Preview */}
      <TranslationPreview
        original={originalContent}
        translated={translatedContent}
        isVisible={!!translatedContent && !error}
        onDownload={handleDownload}
        fileName={selectedFile?.name || ''}
      />
    </React.Fragment>
  );
};

export default TranslationWorkflow;
