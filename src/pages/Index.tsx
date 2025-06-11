
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Languages, Sparkles, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import SettingsPanel from '@/components/SettingsPanel';
import TranslationProgress from '@/components/TranslationProgress';
import { AssParser, type AssLine } from '@/utils/assParser';
import { GeminiTranslator, type TranslationSettings } from '@/utils/translator';

const Index = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);
  const [usePersonalApi, setUsePersonalApi] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTranslatedContent('');
    setError(null);
    setProgress(0);
    
    toast({
      title: "فایل انتخاب شد",
      description: `${file.name} آماده ترجمه است`,
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setTranslatedContent('');
    setError(null);
    setProgress(0);
  };

  const handleTranslate = async () => {
    if (!selectedFile) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا فایل ASS خود را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    if (usePersonalApi && !apiKey.trim()) {
      toast({
        title: "خطا", 
        description: "لطفاً کلید API خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    setError(null);
    setProgress(0);

    try {
      // Read file content
      const fileContent = await selectedFile.text();
      
      // Parse ASS file
      const parsedLines = AssParser.parseAssFile(fileContent);
      
      // Extract unique dialogue texts
      const dialogueTexts = parsedLines
        .filter(line => line.type === 'dialogue' && line.text && line.text.trim())
        .map(line => line.text!)
        .filter((text, index, array) => array.indexOf(text) === index); // Remove duplicates

      if (dialogueTexts.length === 0) {
        throw new Error('هیچ متن قابل ترجمه‌ای در فایل یافت نشد');
      }

      toast({
        title: "شروع ترجمه",
        description: `${dialogueTexts.length} خط متن برای ترجمه یافت شد`,
      });

      // Translate texts
      const settings: TranslationSettings = {
        temperature,
        topP,
        topK,
        apiKey: usePersonalApi ? apiKey : undefined,
      };

      const translations = await GeminiTranslator.translateTexts(
        dialogueTexts,
        settings,
        setProgress
      );

      // Reconstruct ASS file
      const translatedAssContent = AssParser.reconstructAssFile(parsedLines, translations);
      
      setTranslatedContent(translatedAssContent);
      setProgress(100);

      toast({
        title: "ترجمه تکمیل شد",
        description: `${translations.size} خط با موفقیت ترجمه شد`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطای نامشخص در ترجمه';
      setError(errorMessage);
      
      toast({
        title: "خطا در ترجمه",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = () => {
    if (!translatedContent || !selectedFile) return;

    const blob = new Blob([translatedContent], { type: 'text/plain;charset=utf-8' });
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
      description: "فایل ترجمه شده دانلود شد",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 glass-effect">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Languages className="w-8 h-8 text-primary animate-pulse-glow" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onRemoveFile={handleRemoveFile}
                />
              </CardContent>
            </Card>

            {/* Translation Button */}
            {selectedFile && (
              <div className="animate-slide-up">
                <Button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground hover-glow transition-all duration-300"
                >
                  {isTranslating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      در حال ترجمه...
                    </>
                  ) : (
                    <>
                      <Languages className="w-5 h-5 mr-2" />
                      شروع ترجمه به فارسی
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Translation Progress */}
            <TranslationProgress
              isTranslating={isTranslating}
              progress={progress}
              translatedText={translatedContent}
              error={error}
              onDownload={handleDownload}
              originalFileName={selectedFile?.name || ''}
            />
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <SettingsPanel
              apiKey={apiKey}
              setApiKey={setApiKey}
              temperature={temperature}
              setTemperature={setTemperature}
              topP={topP}
              setTopP={setTopP}
              topK={topK}
              setTopK={setTopK}
              usePersonalApi={usePersonalApi}
              setUsePersonalApi={setUsePersonalApi}
            />

            {/* Features Card */}
            <Card className="glass-effect hover-glow animate-fade-in">
              <CardHeader>
                <CardTitle className="text-foreground">ویژگی‌های سایت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>پشتیبانی کامل از فرمت ASS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>حفظ تگ‌های درون خطی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>ترجمه فقط بخش TEXT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>پردازش هوشمند تگ‌ها</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>API شخصی اختیاری</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>تنظیمات پیشرفته AI</span>
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
    </div>
  );
};

export default Index;
