
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileUpload from '@/components/FileUpload';
import FileStats from '@/components/FileStats';
import SettingsPanel from '@/components/SettingsPanel';
import QualitySettingsPanel from '@/components/QualitySettingsPanel';
import TranslationProgress from '@/components/TranslationProgress';
import QualityReport from '@/components/QualityReport';
import TranslationPreview from '@/components/TranslationPreview';
import MemoryManagement from '@/components/MemoryManagement';
import { useToast } from '@/hooks/use-toast';
import { AssParser } from '@/utils/assParser';
import { EnhancedGeminiTranslator } from '@/utils/enhancedTranslator';
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
  }, [selectedFile, updateState]);

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
  };

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
      const dialogueTexts = parsedLines
        .filter(line => line.type === 'dialogue' && line.text && line.text.trim())
        .map(line => line.text!)
        .filter((text, index, array) => array.indexOf(text) === index);

      if (dialogueTexts.length === 0) {
        throw new Error('هیچ متن قابل ترجمه‌ای در فایل یافت نشد');
      }
      toast({
        title: "شروع ترجمه با سیستم هوشمند",
        description: `${dialogueTexts.length} خط متن برای ترجمه یافت شد`
      });
      const enhancedSettings = {
        ...settings,
        qualitySettings
      };
      const translations = await EnhancedGeminiTranslator.translateTexts(
        dialogueTexts, 
        enhancedSettings,
        newStatus => updateState({ status: newStatus }),
        message => updateState({ statusMessage: message }),
        scores => addQualityScores(scores)
      );
      const translatedAssContent = AssParser.reconstructAssFile(parsedLines, translations);
      updateState({
        translatedContent: translatedAssContent,
        status: {
          ...status,
          progress: 100
        }
      });
      toast({
        title: "ترجمه با کیفیت بالا تکمیل شد",
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
  const handleCancelTranslation = () => {
    EnhancedGeminiTranslator.cancelTranslation();
    updateState({
      isTranslating: false,
      statusMessage: 'ترجمه توسط کاربر متوقف شد'
    });
    toast({
      title: "ترجمه متوقف شد",
      description: "ترجمه توسط کاربر لغو شد"
    });
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER - ساده، مینیمال و بدون افکت‌های تصویری و انیمیشن */}
      <header className="border-b border-border/20 bg-background">
        <div className="container mx-auto py-8 px-4 text-center">
          <h1 className="text-3xl font-bold text-primary mb-1" style={{ letterSpacing: '-0.02em' }}>
            مترجم زیرنویس ASS
          </h1>
          <p className="text-base text-muted-foreground">
            ترجمه سریع و با کیفیت زیرنویس‌های شما به فارسی
          </p>
        </div>
      </header>
      {/* مینیمال: فقط محتوای اصلی، حذف افکت و کارت‌های اضافه */}
      <main className="container mx-auto flex-1 px-2 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* محتوای اصلی */}
          <div className="md:col-span-2 space-y-6">
            {/* آپلود فایل */}
            <Card className="border bg-card rounded-lg shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">انتخاب فایل زیرنویس</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onRemoveFile={handleRemoveFile}
                />
              </CardContent>
            </Card>
            {/* آمار فایل */}
            <FileStats
              selectedFile={selectedFile}
              dialogueCount={dialogueCount}
              estimatedTime={Math.ceil(dialogueCount / 10)}
            />
            {/* دکمه ترجمه */}
            {selectedFile && !isTranslating && (
              <Button onClick={handleTranslate} className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground rounded-md">
                شروع ترجمه
              </Button>
            )}
            {/* پیشرفت ترجمه */}
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
            {/* پیش‌نمایش */}
            <TranslationPreview
              original={selectedFile ? '' : ''}
              translated={translatedContent}
              isVisible={!!translatedContent && !error}
              onDownload={handleDownload}
              fileName={selectedFile?.name || ''}
            />
          </div>
          {/* تنظیمات */}
          <div className="space-y-4">
            <Card className="border bg-card rounded-lg shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">تنظیمات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <SettingsPanel
                  apiKey={settings.apiKey}
                  setApiKey={key => updateSettings({ apiKey: key })}
                  temperature={settings.temperature}
                  setTemperature={temp => updateSettings({ temperature: temp })}
                  topP={settings.topP}
                  setTopP={topP => updateSettings({ topP })}
                  topK={settings.topK}
                  setTopK={topK => updateSettings({ topK })}
                  usePersonalApi={settings.usePersonalApi}
                  setUsePersonalApi={use => updateSettings({ usePersonalApi: use })}
                  baseDelay={settings.baseDelay}
                  setBaseDelay={delay => updateSettings({ baseDelay: delay })}
                  quotaDelay={settings.quotaDelay}
                  setQuotaDelay={delay => updateSettings({ quotaDelay: delay })}
                  numberOfChunks={settings.numberOfChunks}
                  setNumberOfChunks={chunks => updateSettings({ numberOfChunks: chunks })}
                  geminiModel={settings.geminiModel}
                  setGeminiModel={model => updateSettings({ geminiModel: model })}
                  maxRetries={settings.maxRetries}
                  setMaxRetries={retries => updateSettings({ maxRetries: retries })}
                  enableThinking={settings.enableThinking}
                  setEnableThinking={enable => updateSettings({ enableThinking: enable })}
                  onApplyPreset={applyPreset}
                />
              </CardContent>
            </Card>
            <Card className="border bg-card rounded-lg shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">تنظیمات کیفیت</CardTitle>
              </CardHeader>
              <CardContent>
                <QualitySettingsPanel
                  qualitySettings={qualitySettings}
                  onUpdateQualitySettings={updateQualitySettings}
                />
              </CardContent>
            </Card>
            <QualityReport scores={qualityScores} isVisible={showQualityReport} />
            <MemoryManagement isVisible={showMemoryManagement} />
          </div>
        </div>
      </main>
      {/* فوتر مینیمال */}
      <footer className="border-t border-border/20 py-6 mt-12 text-center text-sm text-muted-foreground bg-background">
        مترجم زیرنویس ASS • نسخه ۲.۰
      </footer>
    </div>
  );
};

export default Index;
