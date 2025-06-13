
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Sparkles, BarChart3, Brain, Zap, Shield, Cpu, Rocket, Star, Award } from 'lucide-react';
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Enhanced Header with parallax background */}
      <header className="relative border-b border-border/30 overflow-hidden parallax-bg z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/50 to-accent/10"></div>
        <div className="relative container-enhanced py-16">
          <div className="text-center animate-fade-in-up">
            {/* Hero Icons with enhanced animations */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="relative group">
                <Languages className="w-16 h-16 text-primary animate-pulse-glow floating" />
                <div className="absolute inset-0 w-16 h-16 bg-primary/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="absolute -inset-2 border border-primary/20 rounded-full animate-pulse"></div>
              </div>
              <div className="relative">
                <h1 className="text-6xl md:text-7xl font-bold text-gradient bg-size-200 animate-gradient-shift">
                  مترجم زیرنویس ASS
                </h1>
              </div>
              <div className="relative group">
                <Sparkles className="w-16 h-16 text-accent animate-pulse-glow floating-delayed" />
                <div className="absolute inset-0 w-16 h-16 bg-accent/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="absolute -inset-2 border border-accent/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Enhanced subtitle with typewriter effect */}
            <div className="relative mb-10">
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-1">
                ترجمه حرفه‌ای زیرنویس‌های ASS به فارسی با تکنولوژی هوش مصنوعی پیشرفته
              </p>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-primary rounded-full animate-shimmer"></div>
            </div>
            
            {/* Enhanced feature badges with new animations */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 animate-fade-in-up animate-stagger-2">
              {[
                { icon: Zap, text: "سریع و دقیق", color: "primary" },
                { icon: Shield, text: "امن و مطمئن", color: "accent" },
                { icon: Cpu, text: "هوش مصنوعی", color: "secondary" },
                { icon: Rocket, text: "کیفیت بالا", color: "primary" },
                { icon: Star, text: "پیشرفته", color: "accent" }
              ].map((feature, index) => (
                <div 
                  key={feature.text}
                  className={`feature-badge animate-bounce-in text-${feature.color} group cursor-pointer`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <feature.icon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 animate-fade-in-up animate-stagger-3">
              {[
                { number: "99%", label: "دقت ترجمه", icon: Award },
                { number: "24/7", label: "در دسترس", icon: Zap },
                { number: "∞", label: "پشتیبانی زبان", icon: Languages },
                { number: "0", label: "نگرانی امنیت", icon: Shield }
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className="text-center p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/20 hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with enhanced responsive layout */}
      <main className="relative container-enhanced py-16 z-10">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content Area with improved spacing */}
          <div className="xl:col-span-3 space-y-10">
            {/* File Upload Section with enhanced design */}
            <Card className="enhanced-card animate-scale-in hover-lift group">
              <CardHeader className="pb-6">
                <CardTitle className="text-3xl font-bold text-foreground flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Languages className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    انتخاب فایل زیرنویس
                  </span>
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

            {/* File Statistics with enhanced responsive design */}
            <div className="animate-scale-in animate-stagger-1">
              <FileStats 
                selectedFile={selectedFile} 
                dialogueCount={dialogueCount} 
                estimatedTime={Math.ceil(dialogueCount / 10)}
              />
            </div>

            {/* Enhanced Translation Button with advanced effects */}
            {selectedFile && !isTranslating && (
              <div className="animate-bounce-in animate-stagger-2">
                <Button 
                  onClick={handleTranslate} 
                  className="w-full h-20 text-xl gradient-button group relative overflow-hidden shadow-glow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative flex items-center justify-center gap-4 z-10">
                    <div className="relative">
                      <Languages className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-white/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    </div>
                    <span className="font-bold tracking-wide">شروع ترجمه هوشمند با کیفیت بالا</span>
                    <Sparkles className="w-6 h-6 group-hover:scale-125 transition-transform duration-300" />
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

            {/* Translation Preview with improved layout */}
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

          {/* Enhanced Sidebar with improved responsive behavior */}
          <div className="xl:col-span-1 space-y-8">
            {/* Control Panel with enhanced design */}
            <Card className="enhanced-card animate-slide-in-right hover-lift">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  پنل کنترل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant={showQualityReport ? "default" : "outline"}
                  size="sm"
                  onClick={toggleQualityReport}
                  className="w-full justify-start hover-glow group"
                >
                  <BarChart3 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  گزارش کیفیت
                </Button>
                <Button
                  variant={showMemoryManagement ? "default" : "outline"}
                  size="sm"
                  onClick={toggleMemoryManagement}
                  className="w-full justify-start hover-glow group"
                >
                  <Brain className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  حافظه ترجمه
                </Button>
              </CardContent>
            </Card>

            {/* Quality Report with staggered animation */}
            <div className="animate-slide-in-right animate-stagger-1">
              <QualityReport scores={qualityScores} isVisible={showQualityReport} />
            </div>

            {/* Memory Management with enhanced visibility */}
            <div className="animate-slide-in-right animate-stagger-2">
              <MemoryManagement isVisible={showMemoryManagement} />
            </div>

            {/* Quality Settings with improved spacing */}
            <div className="animate-slide-in-right animate-stagger-3">
              <QualitySettingsPanel 
                qualitySettings={qualitySettings}
                onUpdateQualitySettings={updateQualitySettings}
              />
            </div>

            {/* Technical Settings with enhanced design */}
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

            {/* Enhanced Features Card with improved visual hierarchy */}
            <Card className="enhanced-card animate-slide-in-right animate-stagger-5 hover-lift">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse-glow" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                  </div>
                  ویژگی‌های پیشرفته
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  {[
                    { icon: Brain, text: 'حافظه ترجمه هوشمند', color: 'text-primary' },
                    { icon: BarChart3, text: 'امتیازدهی کیفیت real-time', color: 'text-accent' },
                    { icon: Zap, text: 'تشخیص ترجمه‌های مشابه', color: 'text-primary' },
                    { icon: Star, text: 'پیش‌نمایش و مقایسه', color: 'text-accent' },
                    { icon: Shield, text: 'صادرات و وارد کردن حافظه', color: 'text-primary' },
                    { icon: Award, text: 'گزارش تفصیلی کیفیت', color: 'text-accent' }
                  ].map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/20 transition-all duration-300 group cursor-pointer hover-lift"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative">
                        <feature.icon className={`w-5 h-5 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                        <div className={`absolute inset-0 ${feature.color.replace('text-', 'bg-')}/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300`}></div>
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300 font-medium">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Enhanced Footer with better visual design */}
      <footer className="relative border-t border-border/30 mt-24 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent"></div>
        <div className="relative container-enhanced py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Languages className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                مترجم زیرنویس ASS
              </span>
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              ساخته شده با ❤️ برای ترجمه حرفه‌ای و با کیفیت
            </p>
            <div className="flex justify-center gap-2 text-sm text-muted-foreground/70">
              <span>نسخه 2.0</span>
              <span>•</span>
              <span>پیشرفته و قدرتمند</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
