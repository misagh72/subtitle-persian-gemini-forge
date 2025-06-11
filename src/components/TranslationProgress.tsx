
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, AlertCircle, StopCircle, Clock } from 'lucide-react';
import { TranslationStatus } from '@/utils/translator';

interface TranslationProgressProps {
  isTranslating: boolean;
  status: TranslationStatus;
  translatedText: string;
  error: string | null;
  statusMessage: string;
  onDownload: () => void;
  onCancel: () => void;
  originalFileName: string;
}

const TranslationProgress: React.FC<TranslationProgressProps> = ({
  isTranslating,
  status,
  translatedText,
  error,
  statusMessage,
  onDownload,
  onCancel,
  originalFileName,
}) => {
  if (!isTranslating && !translatedText && !error) {
    return null;
  }

  // Ensure status object has default values if undefined
  const safeStatus = status || {
    isTranslating: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    translatedCount: 0,
    totalTexts: 0
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          {isTranslating && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
          {translatedText && !error && <CheckCircle className="w-5 h-5 text-green-500" />}
          {error && <AlertCircle className="w-5 h-5 text-destructive" />}
          وضعیت ترجمه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTranslating && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{statusMessage}</span>
              <span className="text-primary font-mono">{safeStatus.progress}%</span>
            </div>
            <Progress value={safeStatus.progress} className="w-full animate-pulse-glow" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">بخش فعلی:</span>
                <span className="text-primary font-mono">{safeStatus.currentChunk} / {safeStatus.totalChunks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ترجمه شده:</span>
                <span className="text-primary font-mono">{safeStatus.translatedCount} / {safeStatus.totalTexts}</span>
              </div>
            </div>

            {safeStatus.estimatedTimeRemaining && (
              <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-lg">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  زمان تخمینی باقی‌مانده: 
                  <span className="text-primary font-mono ml-1">
                    {formatTime(safeStatus.estimatedTimeRemaining)}
                  </span>
                </span>
              </div>
            )}

            <Button
              onClick={onCancel}
              variant="destructive"
              className="w-full"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              توقف ترجمه
            </Button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-slide-up">
            <p className="text-destructive font-medium">خطا در ترجمه:</p>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
          </div>
        )}

        {translatedText && !error && (
          <div className="space-y-4 animate-slide-up">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ترجمه با موفقیت انجام شد!
              </p>
              <p className="text-green-400/80 text-sm mt-1">
                {safeStatus.translatedCount} خط با موفقیت ترجمه شد
              </p>
            </div>
            
            <div className="max-h-60 overflow-y-auto bg-muted/30 p-4 rounded-lg border">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {translatedText.slice(0, 500)}
                {translatedText.length > 500 && '...'}
              </pre>
            </div>

            <Button 
              onClick={onDownload} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-glow"
            >
              <Download className="w-4 h-4 mr-2" />
              دانلود فایل ترجمه شده ({originalFileName.replace('.ass', '_persian.ass')})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslationProgress;
