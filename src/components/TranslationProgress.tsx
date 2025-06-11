
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface TranslationProgressProps {
  isTranslating: boolean;
  progress: number;
  translatedText: string;
  error: string | null;
  onDownload: () => void;
  originalFileName: string;
}

const TranslationProgress: React.FC<TranslationProgressProps> = ({
  isTranslating,
  progress,
  translatedText,
  error,
  onDownload,
  originalFileName,
}) => {
  if (!isTranslating && !translatedText && !error) {
    return null;
  }

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
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">در حال ترجمه...</span>
              <span className="text-primary font-mono">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full animate-pulse-glow" />
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
