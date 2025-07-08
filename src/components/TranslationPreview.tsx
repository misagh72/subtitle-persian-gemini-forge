
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Download, FileText, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllLines, setShowAllLines] = useState(false);

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

  // Filter lines based on search term
  const filteredOriginalLines = searchTerm 
    ? originalLines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : originalLines;
  
  const filteredTranslatedLines = searchTerm 
    ? translatedLines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : translatedLines;

  // Determine how many lines to show
  const linesToShow = showAllLines ? filteredOriginalLines.length : Math.min(10, filteredOriginalLines.length);

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
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      مقایسه تفصیلی ترجمه
                      <div className="flex items-center gap-2 text-sm font-normal">
                        <Badge variant="secondary">{originalLines.length} خط اصلی</Badge>
                        <Badge variant="secondary">{translatedLines.length} خط ترجمه</Badge>
                      </div>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex flex-col space-y-4">
                    {/* Search and Controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="جستجو در متن..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllLines(!showAllLines)}
                      >
                        {showAllLines ? 'نمایش ۱۰ خط' : 'نمایش همه'}
                      </Button>
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchTerm('')}
                        >
                          پاک کردن
                        </Button>
                      )}
                    </div>

                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="side-by-side">مقایسه</TabsTrigger>
                        <TabsTrigger value="original">اصلی</TabsTrigger>
                        <TabsTrigger value="translated">ترجمه</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="side-by-side" className="mt-4">
                        <ScrollArea className="h-[50vh]">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2 text-blue-600 sticky top-0 bg-background">
                                متن اصلی ({filteredOriginalLines.length} خط)
                              </h4>
                              <div className="space-y-1">
                                {filteredOriginalLines.slice(0, linesToShow).map((line, index) => (
                                  <div key={index}>
                                    {renderSubtitleLine(line, true)}
                                  </div>
                                ))}
                                {!showAllLines && filteredOriginalLines.length > 10 && (
                                  <div className="text-center text-muted-foreground text-sm py-2">
                                    ... و {filteredOriginalLines.length - 10} خط دیگر
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2 text-green-600 sticky top-0 bg-background">
                                ترجمه فارسی ({filteredTranslatedLines.length} خط)
                              </h4>
                              <div className="space-y-1">
                                {filteredTranslatedLines.slice(0, linesToShow).map((line, index) => (
                                  <div key={index}>
                                    {renderSubtitleLine(line)}
                                  </div>
                                ))}
                                {!showAllLines && filteredTranslatedLines.length > 10 && (
                                  <div className="text-center text-muted-foreground text-sm py-2">
                                    ... و {filteredTranslatedLines.length - 10} خط دیگر
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="original" className="mt-4">
                        <ScrollArea className="h-[50vh]">
                          <h4 className="font-medium mb-2 text-blue-600">متن اصلی کامل</h4>
                          <pre className="text-xs bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                            {original}
                          </pre>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="translated" className="mt-4">
                        <ScrollArea className="h-[50vh]">
                          <h4 className="font-medium mb-2 text-green-600">ترجمه فارسی کامل</h4>
                          <pre className="text-xs bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                            {translated}
                          </pre>
                        </ScrollArea>
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
