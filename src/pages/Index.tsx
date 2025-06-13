
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Sparkles, BarChart3, Brain, Zap, Shield, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import FileStats from '@/components/FileStats';
import SettingsPanel from '@/components/SettingsPanel';
import QualitySettingsPanel from '@/components/QualitySettingsPanel';
import TranslationProgress from '@/components/TranslationProgress';
import QualityReport from '@/components/QualityReport';
import TranslationPreview from '@/components/TranslationPreview';
import MemoryManagement from '@/components/MemoryManagement';
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
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with gradient background */}
      <header className="relative border-b border-border/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
        <div className="relative container-enhanced py-12">
          <div className="text-center animate-fade-in-up">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <Languages className="w-12 h-12 text-primary animate-pulse-glow floating" />
                <div className="absolute inset-0 w-12 h-12 bg-primary/20 rounded-full blur-xl"></div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gradient">
                مترجم زیرنویس ASS
              </h1>
              <div className="relative">
                <Sparkles className="w-12 h-12 text-accent animate-pulse-glow floating" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 w-12 h-12 bg-accent/20 rounded-full blur-xl"></div>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-1">
              ترجمه حرفه‌ای زیرنویس‌های ASS به فارسی با تکنولوژی هوش مصنوعی پیشرفته
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in-up animate-stagger-2">
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">سریع و دقیق</span>
              </div>
              <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full border border-accent/20">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">امن و مطمئن</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 text-secondary-foreground px-4 py-2 rounded-full border border-secondary/20">
                <Cpu className="w-4 h-4" />
                <span className="text-sm font-medium">هوش مصنوعی</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with enhanced layout */}
      <main className="container-enhanced py-12">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            {/* File Upload Section */}
            <Card className="enhanced-card animate-scale-in">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Languages className="w-5 h-5 text-primary" />
                  </div>
                  انتخاب فایل زیرنویس
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFileSelect={handleFileSelect} 
                  selectedFile={selectedFile} 
                  onRemoveFile={handleRemoveFile} 
                />
              </CardContent>
            </Card>

            {/* File Statistics with enhanced design */}
            <div className="animate-scale-in animate-stagger-1">
              <FileStats 
                selectedFile={selectedFile} 
                dialogueCount={dialogueCount} 
                estimatedTime={Math.ceil(dialogueCount / 10)}
              />
            </div>

            {/* Enhanced Translation Button */}
            {selectedFile && !isTranslating && (
              <div className="animate-slide-in-right animate-stagger-2">
                <Button 
                  onClick={handleTranslate} 
                  className="w-full h-16 text-lg gradient-button group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    <Languages className="w-6 h-6" />
                    <span className="font-semibold">شروع ترجمه هوشمند با کیفیت بالا</span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                </Button>
              </div>
            )}

            {/* Translation Progress with enhanced styling */}
            <div className="animate-scale-in animate-stagger-3">
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
            </div>

            {/* Translation Preview */}
            <div className="animate-scale-in animate-stagger-4">
              <TranslationPreview
                original={selectedFile ? '' : ''} 
                translated={translatedContent}
                isVisible={!!translatedContent && !error}
                onDownload={handleDownload}
                fileName={selectedFile?.name || ''}
              />
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Control Panel */}
            <Card className="enhanced-card animate-slide-in-right">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">پنل کنترل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={showQualityReport ? "default" : "outline"}
                  size="sm"
                  onClick={toggleQualityReport}
                  className="w-full justify-start"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  گزارش کیفیت
                </Button>
                <Button
                  variant={showMemoryManagement ? "default" : "outline"}
                  size="sm"
                  onClick={toggleMemoryManagement}
                  className="w-full justify-start"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  حافظه ترجمه
                </Button>
              </CardContent>
            </Card>

            {/* Quality Report */}
            <div className="animate-slide-in-right animate-stagger-1">
              <QualityReport scores={qualityScores} isVisible={showQualityReport} />
            </div>

            {/* Memory Management */}
            <div className="animate-slide-in-right animate-stagger-2">
              <MemoryManagement isVisible={showMemoryManagement} />
            </div>

            {/* Quality Settings */}
            <div className="animate-slide-in-right animate-stagger-3">
              <QualitySettingsPanel 
                qualitySettings={qualitySettings}
                onUpdateQualitySettings={updateQualitySettings}
              />
            </div>

            {/* Technical Settings */}
            <div className="animate-slide-in-right animate-stagger-4">
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
            </div>

            {/* Enhanced Features Card */}
            <Card className="enhanced-card animate-slide-in-right animate-stagger-5">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  ویژگی‌های پیشرفته
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  {[
                    'حافظه ترجمه هوشمند',
                    'امتیازدهی کیفیت real-time',
                    'تشخیص ترجمه‌های مشابه',
                    'پیش‌نمایش و مقایسه',
                    'صادرات و وارد کردن حافظه',
                    'گزارش تفصیلی کیفیت'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-border/30 mt-20">
        <div className="container-enhanced py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Languages className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg font-semibold text-foreground">مترجم زیرنویس ASS</span>
            </div>
            <p className="text-muted-foreground">
              ساخته شده با ❤️ برای ترجمه حرفه‌ای و با کیفیت
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
