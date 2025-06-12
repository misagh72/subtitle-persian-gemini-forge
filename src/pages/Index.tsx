import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import FileStats from '@/components/FileStats';
import SettingsPanel from '@/components/SettingsPanel';
import TranslationProgress from '@/components/TranslationProgress';
import { AssParser } from '@/utils/assParser';
import { GeminiTranslator } from '@/utils/translator';
import { useTranslationState, useSettingsState } from '@/hooks/useTranslationState';
const Index = () => {
  const {
    toast
  } = useToast();
  const {
    selectedFile,
    isTranslating,
    translatedContent,
    error,
    status,
    statusMessage,
    dialogueCount,
    updateState,
    resetTranslation,
    setSelectedFile
  } = useTranslationState();
  const {
    settings,
    updateSettings,
    applyPreset
  } = useSettingsState();

  // Calculate dialogue count when file is selected
  useEffect(() => {
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
      const dialogueTexts = parsedLines.filter(line => line.type === 'dialogue' && line.text && line.text.trim()).map(line => line.text!).filter((text, index, array) => array.indexOf(text) === index);
      if (dialogueTexts.length === 0) {
        throw new Error('هیچ متن قابل ترجمه‌ای در فایل یافت نشد');
      }
      toast({
        title: "شروع ترجمه",
        description: `${dialogueTexts.length} خط متن برای ترجمه یافت شد`
      });
      const translationSettings = {
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        apiKey: settings.usePersonalApi ? settings.apiKey : undefined,
        baseDelay: settings.baseDelay,
        quotaDelay: settings.quotaDelay,
        numberOfChunks: settings.numberOfChunks,
        geminiModel: settings.geminiModel,
        maxRetries: settings.maxRetries
      };
      const translations = await GeminiTranslator.translateTexts(dialogueTexts, translationSettings, newStatus => updateState({
        status: newStatus
      }), message => updateState({
        statusMessage: message
      }));
      const translatedAssContent = AssParser.reconstructAssFile(parsedLines, translations);
      updateState({
        translatedContent: translatedAssContent,
        status: {
          ...status,
          progress: 100
        }
      });
      toast({
        title: "ترجمه تکمیل شد",
        description: `${translations.size} خط با موفقیت ترجمه شد`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطای نامشخص در ترجمه';
      updateState({
        error: errorMessage
      });
      toast({
        title: "خطا در ترجمه",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      updateState({
        isTranslating: false
      });
    }
  };
  const handleCancelTranslation = () => {
    GeminiTranslator.cancelTranslation();
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
  return <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 glass-effect">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Languages className="w-8 h-8 text-primary animate-pulse-glow" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent py-[9px]">
                مترجم زیرنویس ASS
              </h1>
              <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ترجمه حرفه‌ای زیرنویس‌های ASS به فارسی با حفظ فرمت و تگ‌های اصلی
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* File Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-effect hover-glow animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">انتخاب فایل</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} onRemoveFile={handleRemoveFile} />
              </CardContent>
            </Card>

            {/* File Statistics */}
            <FileStats selectedFile={selectedFile} dialogueCount={dialogueCount} estimatedTime={Math.ceil(dialogueCount / 10)} // Rough estimate
          />

            {/* Translation Button */}
            {selectedFile && !isTranslating && <div className="animate-slide-up">
                <Button onClick={handleTranslate} className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground hover-glow transition-all duration-300">
                  <Languages className="w-5 h-5 mr-2" />
                  شروع ترجمه به فارسی
                </Button>
              </div>}

            {/* Translation Progress */}
            <TranslationProgress isTranslating={isTranslating} status={status} translatedText={translatedContent} error={error} statusMessage={statusMessage} onDownload={handleDownload} onCancel={handleCancelTranslation} originalFileName={selectedFile?.name || ''} />
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <SettingsPanel apiKey={settings.apiKey} setApiKey={key => updateSettings({
            apiKey: key
          })} temperature={settings.temperature} setTemperature={temp => updateSettings({
            temperature: temp
          })} topP={settings.topP} setTopP={topP => updateSettings({
            topP
          })} topK={settings.topK} setTopK={topK => updateSettings({
            topK
          })} usePersonalApi={settings.usePersonalApi} setUsePersonalApi={use => updateSettings({
            usePersonalApi: use
          })} baseDelay={settings.baseDelay} setBaseDelay={delay => updateSettings({
            baseDelay: delay
          })} quotaDelay={settings.quotaDelay} setQuotaDelay={delay => updateSettings({
            quotaDelay: delay
          })} numberOfChunks={settings.numberOfChunks} setNumberOfChunks={chunks => updateSettings({
            numberOfChunks: chunks
          })} geminiModel={settings.geminiModel} setGeminiModel={model => updateSettings({
            geminiModel: model
          })} maxRetries={settings.maxRetries} setMaxRetries={retries => updateSettings({
            maxRetries: retries
          })} enableThinking={settings.enableThinking} setEnableThinking={enable => updateSettings({
            enableThinking: enable
          })} onApplyPreset={applyPreset} />

            {/* Features Card */}
            <Card className="glass-effect hover-glow animate-fade-in">
              <CardHeader>
                <CardTitle className="text-foreground">ویژگی‌های جدید</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>سیستم retry هوشمند</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>نمایش پیشرفت دقیق</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>امکان توقف ترجمه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>تنظیمات پیش‌فرض</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>آمار فایل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>تخمین زمان</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 glass-effect mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground">
            <p>مترجم زیرنویس ASS - ساخته شده با ❤️ برای ترجمه حرفه‌ای</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;