import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FileStats from '@/components/FileStats';
import TranslationProgress from '@/components/TranslationProgress';
import TranslationPreview from '@/components/TranslationPreview';
import { AssParser } from '@/utils/assParser';
import { EnhancedGeminiTranslatorV2 } from '@/utils/enhancedTranslatorV2';
import { cleanPersianTranslation } from '@/utils/postProcessPersian';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  React.useEffect(() => {
    if (selectedFile) {
      selectedFile.text().then(content => {
        const parsedLines = AssParser.parseAssFile(content);
        const dialogues = parsedLines.filter(line => line.type === 'dialogue' && line.text && line.text.trim());
        updateState({
          dialogueCount: dialogues.length
        });
      }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  const handleTranslate = async () => {
    if (!selectedFile) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا فایل ASS خود را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }
    if (settings.usePersonalApi && !settings.apiKey.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً کلید API خود را وارد کنید",
        variant: "destructive"
      });
      return;
    }
    updateState({
      isTranslating: true,
      error: null,
      qualityScores: [],
      status: {
        isTranslating: true,
        progress: 0,
        currentChunk: 0,
        totalChunks: 0,
        translatedCount: 0,
        totalTexts: 0
      }
    });
    try {
      const fileContent = await selectedFile.text();
      const parsedLines = AssParser.parseAssFile(fileContent);
      const dialogueLines = parsedLines.filter(line => line.type === 'dialogue' && line.text && line.text.trim());

      // Gather context for each dialogue
      const dialogueTextsWithContext = dialogueLines.map((line, idx, arr) => {
        const prev = arr[idx - 1]?.text || '';
        const next = arr[idx + 1]?.text || '';
        return {
          text: line.text!,
          context: [prev, line.text!, next].filter(Boolean).join('\n')
        };
      });

      // Only line.text for unique mapping, but pass context to translator
      const uniqueDialogueTexts = Array.from(new Set(dialogueTextsWithContext.map(d => d.text)));
      if (uniqueDialogueTexts.length === 0) {
        throw new Error('هیچ متن قابل ترجمه‌ای در فایل یافت نشد');
      }
      toast({
        title: "شروع ترجمه پیشرفته",
        description: `${uniqueDialogueTexts.length} خط متن برای ترجمه یافت شد`
      });

      // Prepare advanced settings with best quality options
      const enhancedSettings = {
        ...settings,
        qualitySettings,
        enablePatternDetection: true,
        enableGrammarCheck: true,
        enableSentimentAnalysis: true,
        enableCoherenceCheck: true,
        enableThinking: true,
        temperature: 0.4,
        numberOfChunks: 3,
        maxRetries: 5,
      };

      // Use new Enhanced V2 Translator with context support and reporting hooks
      const translations = await EnhancedGeminiTranslatorV2.translateTexts(
        uniqueDialogueTexts,
        enhancedSettings,
        (newStatus) => updateState({ status: newStatus }),
        (message) => updateState({ statusMessage: message }),
        (scores) => addQualityScores(scores),
        { dialogueContexts: dialogueTextsWithContext }
      );

      // Clean up resulting translations with Persian-focused post-processing
      const cleanedTranslations = new Map<string, string>();
      translations.forEach((persian, orig) => {
        cleanedTranslations.set(orig, cleanPersianTranslation(persian));
      });

      const translatedAssContent = AssParser.reconstructAssFile(parsedLines, cleanedTranslations);

      updateState({
        translatedContent: translatedAssContent,
        status: { ...status, progress: 100 }
      });
      toast({
        title: "ترجمه پیشرفته و باکیفیت تکمیل شد",
        description: `${translations.size} خط با موفقیت ترجمه شد`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطای نامشخص در ترجمه';
      updateState({ error: errorMessage });
      toast({
        title: "خطا در ترجمه",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      updateState({ isTranslating: false });
    }
  };

  const handleDownload = () => {
    if (!translatedContent || !selectedFile) return;
    const blob = new Blob([translatedContent], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name.replace('.ass', '_persian.ass');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "دانلود انجام شد",
      description: "فایل ترجمه شده دانلود شد"
    });
  };

  const handleCancelTranslation = () => {
    EnhancedGeminiTranslatorV2.cancelTranslation();
    updateState({
      isTranslating: false,
      statusMessage: 'ترجمه توسط کاربر متوقف شد'
    });
    toast({
      title: "ترجمه متوقف شد",
      description: "ترجمه توسط کاربر لغو شد"
    });
  };

  const handleRemoveFile = () => {
    updateState({
      selectedFile: null,
      dialogueCount: 0
    });
    resetTranslation();
  };

  return (
    <React.Fragment>
      {/* File Stats */}
      <FileStats
        selectedFile={selectedFile}
        dialogueCount={dialogueCount}
        estimatedTime={Math.ceil(dialogueCount / 10)}
      />
      {/* Translate Button */}
      {selectedFile && !isTranslating && (
        <Button onClick={handleTranslate} className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground rounded-md">
          شروع ترجمه
        </Button>
      )}
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
        original={selectedFile ? '' : ''}
        translated={translatedContent}
        isVisible={!!translatedContent && !error}
        onDownload={handleDownload}
        fileName={selectedFile?.name || ''}
      />
    </React.Fragment>
  );
};

export default TranslationWorkflow;
