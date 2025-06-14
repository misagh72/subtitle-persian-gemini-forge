import React from 'react';
import { Button } from '@/components/ui/button';
import FileStats from '@/components/FileStats';
import TranslationProgress from '@/components/TranslationProgress';
import TranslationPreview from '@/components/TranslationPreview';
import { AssParser } from '@/utils/assParser';
import { EnhancedGeminiTranslatorV2 } from '@/utils/enhancedTranslatorV2';
import { TranslationErrorHandler } from '@/utils/errorHandler';
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
    console.log('🚀 Translation started');
    
    if (!selectedFile) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا فایل ASS خود را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }
    
    // Validate API key if using personal API
    if (settings.usePersonalApi && (!settings.apiKey || settings.apiKey.trim() === '')) {
      toast({
        title: "خطا",
        description: "لطفاً کلید API خود را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Initial validation passed');
    
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
      console.log('📖 Reading file content...');
      const fileContent = await selectedFile.text();
      
      console.log('📝 Parsing ASS file...');
      const parsedLines = AssParser.parseAssFile(fileContent);
      const dialogueLines = parsedLines.filter(line => line.type === 'dialogue' && line.text && line.text.trim());

      console.log(`📊 Found ${dialogueLines.length} dialogue lines`);

      // Get unique texts for translation
      const uniqueDialogueTexts = Array.from(new Set(dialogueLines.map(line => line.text!)));
      
      if (uniqueDialogueTexts.length === 0) {
        throw new Error('هیچ متن قابل ترجمه‌ای در فایل یافت نشد');
      }

      console.log(`🔤 Found ${uniqueDialogueTexts.length} unique texts to translate`);

      toast({
        title: "شروع ترجمه",
        description: `${uniqueDialogueTexts.length} خط متن برای ترجمه یافت شد`
      });

      // Enhanced settings with validation
      const enhancedSettings = {
        ...settings,
        qualitySettings,
        // Optimize for performance
        enablePatternDetection: false,
        enableGrammarCheck: false,     
        enableSentimentAnalysis: false, 
        enableCoherenceCheck: false,   
        enableThinking: false,         
        temperature: Math.max(0.1, Math.min(settings.temperature || 0.4, 1.0)),
        numberOfChunks: Math.min(settings.numberOfChunks || 3, 5),
        maxRetries: 2,
      };

      console.log('🎛️ Enhanced settings prepared');
      console.log('🌐 Starting translation API call...');
      
      const translations = await EnhancedGeminiTranslatorV2.translateTexts(
        uniqueDialogueTexts,
        enhancedSettings,
        (newStatus) => {
          console.log('📈 Status update:', newStatus);
          updateState({ status: newStatus });
        },
        (message) => {
          console.log('💬 Status message:', message);
          updateState({ statusMessage: message });
        },
        (scores) => {
          console.log('⭐ Quality scores:', scores);
          addQualityScores(scores);
        }
      );

      console.log('✨ Translation completed, processing results...');
      console.log('🔧 Reconstructing ASS file...');
      const translatedAssContent = AssParser.reconstructAssFile(parsedLines, translations);

      console.log('🎉 Translation process completed successfully');

      updateState({
        translatedContent: translatedAssContent,
        status: { ...status, progress: 100 }
      });
      
      toast({
        title: "ترجمه تکمیل شد",
        description: `${translations.size} خط با موفقیت ترجمه شد`
      });
      
    } catch (err) {
      console.error('❌ Translation error:', err);
      const normalizedError = TranslationErrorHandler.normalizeError(err);
      const errorMessage = TranslationErrorHandler.getErrorMessage(normalizedError);
      
      updateState({ error: errorMessage });
      toast({
        title: "خطا در ترجمه",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('🏁 Translation process finished');
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
