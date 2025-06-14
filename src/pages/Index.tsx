import React from 'react';
import MinimalHeader from '@/components/MinimalHeader';
import MinimalFooter from '@/components/MinimalFooter';
import MinimalSettings from '@/components/MinimalSettings';
import MinimalFileUpload from '@/components/MinimalFileUpload';
import TranslationWorkflow from '@/components/TranslationWorkflow';
import { useToast } from '@/hooks/use-toast';
import { useTranslationState, useSettingsState } from '@/hooks/useTranslationState';

const Index = () => {
  const { toast } = useToast();
  const {
    selectedFile,
    isTranslating,
    translatedContent,
    error,
    status,
    statusMessage,
    dialogueCount,
    qualityScores,
    showQualityReport,
    showMemoryManagement,
    updateState,
    resetTranslation,
    setSelectedFile,
    addQualityScores,
    toggleQualityReport,
    toggleMemoryManagement
  } = useTranslationState();
  const {
    settings,
    qualitySettings,
    updateSettings,
    updateQualitySettings,
    applyPreset
  } = useSettingsState();

  // File selection handlers
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    toast({
      title: "فایل انتخاب شد",
      description: `${file.name} آماده ترجمه است`
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    updateState({
      dialogueCount: 0
    });
    resetTranslation();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MinimalHeader />
      <main className="container mx-auto flex-1 px-2 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* File upload */}
            <MinimalFileUpload
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
            />
            {/* Translation workflow logic */}
            <TranslationWorkflow
              selectedFile={selectedFile}
              isTranslating={isTranslating}
              translatedContent={translatedContent}
              error={error}
              status={status}
              statusMessage={statusMessage}
              dialogueCount={dialogueCount}
              updateState={updateState}
              resetTranslation={resetTranslation}
              addQualityScores={addQualityScores}
              settings={settings}
              qualitySettings={qualitySettings}
            />
          </div>
          {/* Minimal settings sidebar */}
          <MinimalSettings
            settings={settings}
            qualitySettings={qualitySettings}
            updateSettings={updateSettings}
            updateQualitySettings={updateQualitySettings}
            applyPreset={applyPreset}
            qualityScores={qualityScores}
            showQualityReport={showQualityReport}
            showMemoryManagement={showMemoryManagement}
          />
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default Index;

// The file has been heavily refactored for maintainability and is now much shorter.
// Consider refactoring additional deeply-nested logic into hooks or further isolated components if your project grows!
