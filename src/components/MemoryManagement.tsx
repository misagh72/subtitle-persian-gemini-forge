
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TranslationMemory, MemoryEntry } from '@/utils/translationMemory';
import { Brain, Download, Upload, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MemoryManagementProps {
  isVisible: boolean;
}

const MemoryManagement: React.FC<MemoryManagementProps> = ({ isVisible }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isVisible) {
      setMemory(TranslationMemory.getMemory());
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const filteredMemory = memory.filter(entry => 
    entry.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const data = TranslationMemory.exportMemory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translation_memory_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "حافظه ترجمه صادر شد",
      description: "فایل حافظه ترجمه دانلود شد"
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (TranslationMemory.importMemory(content)) {
          setMemory(TranslationMemory.getMemory());
          toast({
            title: "حافظه ترجمه وارد شد",
            description: "حافظه ترجمه با موفقیت بازیابی شد"
          });
        } else {
          toast({
            title: "خطا در وارد کردن",
            description: "فایل نامعتبر است",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام حافظه ترجمه را پاک کنید?')) {
      TranslationMemory.clearMemory();
      setMemory([]);
      toast({
        title: "حافظه ترجمه پاک شد",
        description: "تمام داده‌های حافظه ترجمه حذف شد"
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fa-IR');
  };

  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            مدیریت حافظه ترجمه
          </div>
          <Badge variant="outline" className="text-xs">
            {memory.length} ورودی
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">جستجو در حافظه</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="جستجو در متن‌های اصلی یا ترجمه..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="flex-1">
            <Download className="w-4 h-4 mr-1" />
            صادرات
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-1" />
            وارد کردن
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-1" />
            پاک کردن
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        {/* Memory Entries */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredMemory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {memory.length === 0 ? 'هنوز هیچ ترجمه‌ای در حافظه ذخیره نشده' : 'نتیجه‌ای یافت نشد'}
            </div>
          ) : (
            filteredMemory.slice(0, 10).map((entry, index) => (
              <div key={index} className="p-3 bg-muted/20 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(entry.confidence * 100)}% اطمینان
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">اصلی: </span>
                    <span className="text-foreground">{entry.source.slice(0, 60)}</span>
                    {entry.source.length > 60 && '...'}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">ترجمه: </span>
                    <span className="text-foreground">{entry.target.slice(0, 60)}</span>
                    {entry.target.length > 60 && '...'}
                  </div>
                </div>
              </div>
            ))
          )}
          {filteredMemory.length > 10 && (
            <div className="text-center text-muted-foreground text-sm">
              ... و {filteredMemory.length - 10} ورودی دیگر
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryManagement;
