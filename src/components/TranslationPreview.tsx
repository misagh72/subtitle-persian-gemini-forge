
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Download, FileText, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TranslationPreviewProps {
  original: string;
  translated: string;
  isVisible: boolean;
  onDownload: () => void;
  fileName: string;
}

const TranslationPreview: React.FC<TranslationPreviewProps> = ({
  original,
  translated,
  isVisible,
  onDownload,
  fileName
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'original' | 'translated'>('side-by-side');
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);

  if (!isVisible || !translated) return null;

  const renderSubtitleLine = (line: string, isOriginal: boolean = false) => {
    // Simple ASS line parsing for preview
    if (line.includes('Dialogue:')) {
      const parts = line.split(',');
      if (parts.length >= 10) {
        const text = parts.slice(9).join(',').replace(/\\N/g, '\n');
        return (
          <div className={`p-2 mb-2 rounded border-r-4 ${
            isOriginal ? 'border-blue-500 bg-blue-50/50' : 'border-green-500 bg-green-50/50'
          }`}>
            <div className="text-xs text-muted-foreground mb-1">
              {parts[1]} → {parts[2]} | Layer: {parts[3]}
            </div>
            <div className="text-sm whitespace-pre-wrap">{text}</div>
          </div>
        );
      }
    }
    return null;
  };

  const originalLines = original.split('\n').filter(line => line.includes('Dialogue:'));
  const translatedLines = translated.split('\n').filter(line => line.includes('Dialogue:'));

  return (
    <>
      <Card className="glass-effect hover-glow animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              پیش‌نمایش ترجمه
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {translatedLines.length} خط ترجمه شده
              </Badge>
              <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    مقایسه
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>مقایسه تفصیلی ترجمه</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col h-full">
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="side-by-side">مقایسه</TabsTrigger>
                        <TabsTrigger value="original">اصلی</TabsTrigger>
                        <TabsTrigger value="translated">ترجمه</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="side-by-side" className="mt-4">
                        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          <div>
                            <h4 className="font-medium mb-2 text-blue-600">متن اصلی</h4>
                            <div className="space-y-1">
                              {originalLines.slice(0, 10).map((line, index) => (
                                <div key={index}>
                                  {renderSubtitleLine(line, true)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 text-green-600">ترجمه فارسی</h4>
                            <div className="space-y-1">
                              {translatedLines.slice(0, 10).map((line, index) => (
                                <div key={index}>
                                  {renderSubtitleLine(line)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="original" className="mt-4">
                        <div className="max-h-96 overflow-y-auto">
                          <h4 className="font-medium mb-2 text-blue-600">متن اصلی کامل</h4>
                          <pre className="text-xs bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                            {original.slice(0, 2000)}
                            {original.length > 2000 && '\n... (ادامه دارد)'}
                          </pre>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="translated" className="mt-4">
                        <div className="max-h-96 overflow-y-auto">
                          <h4 className="font-medium mb-2 text-green-600">ترجمه فارسی کامل</h4>
                          <pre className="text-xs bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                            {translated.slice(0, 2000)}
                            {translated.length > 2000 && '\n... (ادامه دارد)'}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Preview */}
          <div className="max-h-60 overflow-y-auto bg-muted/30 p-4 rounded-lg border">
            <div className="space-y-3">
              {translatedLines.slice(0, 5).map((line, index) => (
                <div key={index}>
                  {renderSubtitleLine(line)}
                </div>
              ))}
              {translatedLines.length > 5 && (
                <div className="text-center text-muted-foreground text-sm">
                  ... و {translatedLines.length - 5} خط دیگر
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={onDownload}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              دانلود ({fileName.replace('.ass', '_persian.ass')})
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsCompareDialogOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              مشاهده کامل
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TranslationPreview;
